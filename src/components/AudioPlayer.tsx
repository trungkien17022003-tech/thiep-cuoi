/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

interface AudioPlayerProps {
  autoPlayTrigger?: boolean;
}

export default function AudioPlayer({ autoPlayTrigger }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // We use a high quality soft instrumental music loop
    audioRef.current = new Audio(audioUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.45;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (autoPlayTrigger && audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.log('Autoplay was prevented by browser security. User click is required to play music.', err);
        });
    }
  }, [autoPlayTrigger]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Error playing audio', err));
    }
  };

  const handleSaveUrl = (newUrl: string) => {
    if (newUrl.trim() === '') return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioUrl(newUrl);
    setIsEditingUrl(false);
    setIsPlaying(false);
    // Auto-trigger load
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    }, 100);
  };

  return (
    <div id="audio-player-control" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {isEditingUrl && (
        <div className="bg-white/95 backdrop-blur border border-[#E5DDD0] shadow-xl p-3 rounded-xl max-w-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 font-sans">
            Link nhạc nền (MP3 URL)
          </p>
          <input
            type="text"
            defaultValue={audioUrl}
            onBlur={(e) => handleSaveUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveUrl((e.target as HTMLInputElement).value);
              if (e.key === 'Escape') setIsEditingUrl(false);
            }}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E5DDD0] outline-none focus:border-[#C5A059] bg-[#FFFDFB] font-sans"
            placeholder="Dán link bài nhạc (.mp3)..."
            autoFocus
          />
          <p className="text-[9px] text-gray-400 mt-1 font-sans italic">
            Nhấn Enter để lưu và thử nhạc
          </p>
        </div>
      )}

      <div className="flex gap-2.5 items-center">
        {/* URL editor trigger (only for organizers/admins) */}
        {!isEditingUrl && (
          <button
            id="settings-audio-btn"
            onClick={() => setIsEditingUrl(true)}
            className="bg-white/80 hover:bg-white text-gray-500 hover:text-[#C5A059] p-2.5 rounded-full shadow-lg border border-[#E5DDD0] transition-all text-xs font-semibold flex items-center gap-1"
            title="Đổi nhạc nền"
          >
            <Music className="w-3.5 h-3.5" />
            <span className="text-[10px] pr-1 hidden md:inline">Đổi nhạc</span>
          </button>
        )}

        {/* Play/Pause Button */}
        <button
          id="play-music-btn"
          onClick={togglePlay}
          className={`p-3.5 rounded-full shadow-lg border text-white transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            isPlaying
              ? 'bg-[#1E4638] border-[#1E4638] hover:bg-[#122C23]'
              : 'bg-[#C5A059] border-[#C5A059] hover:bg-[#B8935E]'
          }`}
          title={isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc nền'}
        >
          {isPlaying ? (
            <div className="relative">
              <Volume2 className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-emerald-300 ring-2 ring-emerald-500 animate-ping" />
            </div>
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
