import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Readable } from 'stream';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route: Proxy Google Drive Audio Streams securely
  // This bypasses CORS blocks, iframe constraints, third-party cookie restrictions, and virus scan screens.
  app.get('/api/proxy-audio', async (req, res) => {
    const fileId = req.query.id as string;
    if (!fileId) {
      return res.status(400).send('Missing parameter: id');
    }

    const driveUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;

    try {
      const clientHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      // 1. Initial request to check the file. We do not pass the Range header here
      // because if Google Drive responds with HTML (virus warning page), Range header makes no sense.
      let response = await fetch(driveUrl, { headers: clientHeaders });

      let contentType = response.headers.get('content-type') || '';
      let cookies = '';

      // 2. If Google Drive returned an HTML page, it is likely the virus warning/confirmation screen.
      if (contentType.includes('text/html')) {
        const text = await response.text();
        const confirmMatch = text.match(/confirm=([0-9A-Za-z_]+)/);

        if (confirmMatch) {
          const confirmToken = confirmMatch[1];
          const confirmUrl = `https://docs.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;

          // Extract response cookies to establish session persistence
          const setCookieHeaders = response.headers.getSetCookie
            ? response.headers.getSetCookie()
            : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')!] : []);

          cookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');

          const finalHeaders: Record<string, string> = {
            ...clientHeaders,
            'Cookie': cookies
          };

          // Append any Range request header from the browser
          if (req.headers.range) {
            finalHeaders['Range'] = req.headers.range as string;
          }

          // Make the confirmed request to stream the actual media tệp
          response = await fetch(confirmUrl, { headers: finalHeaders });
          contentType = response.headers.get('content-type') || 'audio/mpeg';
        } else {
          // No confirmation token matched. Send HTML content back as-is (e.g. login/permissions error screen)
          console.warn(`No confirm token found for file ID: ${fileId}. Forwarding HTML.`);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.status(response.status);
          return res.send(text);
        }
      } else {
        // If the first request returned the stream directly (e.g., small file size bypasses virus screen),
        // and browser sent Range header, execute a secondary request targeting that specific range.
        if (req.headers.range) {
          const finalHeaders: Record<string, string> = {
            ...clientHeaders
          };
          finalHeaders['Range'] = req.headers.range as string;
          response = await fetch(driveUrl, { headers: finalHeaders });
          contentType = response.headers.get('content-type') || contentType;
        }
      }

      // 3. Relay the response headers and status back to the client
      res.status(response.status);

      const contentLength = response.headers.get('content-length');
      const contentRange = response.headers.get('content-range');

      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
      }

      // Stream the response body
      if (response.body) {
        const nodeStream = Readable.fromWeb(response.body as any);
        nodeStream.pipe(res);
      } else {
        res.status(500).send('Received empty body from Google Drive stream request.');
      }

    } catch (error: any) {
      console.error('Audio proxy streaming error:', error);
      res.status(500).send(`Error proxying Google Drive media stream: ${error.message}`);
    }
  });

  // Handle Vite middleware integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development server loaded in middleware mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`Serving static files in production mode from: ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server starting and listening on port ${PORT}`);
  });
}

startServer();
