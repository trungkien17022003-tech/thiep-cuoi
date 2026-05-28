/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, Upload, Link as LinkIcon, Check, X, Play, Pause, FileAudio } from 'lucide-react';

interface AudioPlayerProps {
  autoPlayTrigger?: boolean;
  audioUrl?: string;
  onUpdateAudioUrl?: (url: string) => void;
  isOrganizer?: boolean;
}

// Built-in high-quality romantic wedding instrumental presets
const PRESET_TRACKS = [
  {
    name: 'Beautiful In White (Piano Solo)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    description: 'Bản tình ca cổ điển lãng mạn, nhẹ nhàng sâu lắng',
  },
  {
    name: 'Cozy Wedding Lofi (Acoustic Loop)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    description: 'Nhịp điệu thư giãn, ấm cúng, hợp không khí tiệc cưới',
  },
  {
    name: 'Sweet Romance (Acoustic Guitar)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    description: 'Tiếng guitar mộc mạc, rạng rỡ và bay bổng',
  },
];

const DEFAULT_TRACK = PRESET_TRACKS[0].url;

// --- Simple, lightweight IndexedDB support for local large audio files ---
const DB_NAME = 'WeddingAudioDB';
const STORE_NAME = 'AudioStore';
const KEY = 'custom_audio';

function saveAudioToIDB(dataUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(dataUrl, KEY);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function getAudioFromIDB(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(KEY);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export default function AudioPlayer({
  autoPlayTrigger,
  audioUrl = '',
  onUpdateAudioUrl,
  isOrganizer = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState(DEFAULT_TRACK);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'link'>('presets');
  const [inpUrl, setInpUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync resolved actual playing source
  useEffect(() => {
    const loadSource = async () => {
      if (!audioUrl) {
        setResolvedSrc(DEFAULT_TRACK);
      } else if (audioUrl === 'local:uploaded') {
        try {
          const idbData = await getAudioFromIDB();
          if (idbData) {
            setResolvedSrc(idbData);
          } else {
            setResolvedSrc(DEFAULT_TRACK);
          }
        } catch (err) {
          console.error('Failed to load audio from IndexedDB', err);
          setResolvedSrc(DEFAULT_TRACK);
        }
      } else {
        setResolvedSrc(audioUrl);
      }
    };
    loadSource();
  }, [audioUrl]);

  // Create & mount audio player on resolved source change
  useEffect(() => {
    let shouldResume = isPlaying;
    
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      audioRef.current = new Audio(resolvedSrc);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.45;

      if (shouldResume) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log('Autoplay audio failed or was blocked on source transition', err);
            setIsPlaying(false);
          });
      }
    } catch (e) {
      console.error('Audio creation error:', e);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [resolvedSrc]);

  // Handle outside layout autoplay triggers
  useEffect(() => {
    if (autoPlayTrigger && audioRef.current && !isPlaying) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.log('Context trigger play blocked by browser sandbox policy.', err);
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
        .catch((err) => console.error('Audio stream play triggered error:', err));
    }
  };

  // Process selecting a curated preset track
  const handleSelectPreset = (url: string) => {
    onUpdateAudioUrl?.(url);
    // Restart audio play immediately to preview
    setIsPlaying(true);
  };

  // Process pasting online audio URL link
  const handleSaveLink = () => {
    if (inpUrl.trim() === '') return;
    onUpdateAudioUrl?.(inpUrl.trim());
    setIsPlaying(true);
    setInpUrl('');
  };

  // Process drag & drop / local file upload
  const handleLocalLoad = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.endsWith('.mp3') && !file.name.endsWith('.m4a') && !file.name.endsWith('.wav')) {
      alert('Vui lòng chọn file âm thanh định dạng .mp3, .m4a hoặc .wav');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('File nhạc quá lớn! Vui lòng chọn file nhạc nhỏ hơn 20MB.');
      return;
    }

    setUploadProgress(true);
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (typeof reader.result === 'string') {
          // Store securely in persistent browser storage
          await saveAudioToIDB(reader.result);
          // Update URL code state to local trigger
          onUpdateAudioUrl?.('local:uploaded');
          setUploadProgress(false);
          setUploadSuccess(true);
          setIsPlaying(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        }
      } catch (err) {
        console.error('IndexedDB writing error', err);
        alert('Tải lên thất bại do trình duyệt bị hạn chế bộ nhớ. Hãy dùng link dán thay thế!');
        setUploadProgress(false);
      }
    };
    reader.onerror = () => {
      setUploadProgress(false);
      alert('Đã có lỗi xảy ra khi đọc tệp!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="audio-panel-root" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 text-left font-sans">
      {isOrganizer && isEditing && (
        <div className="bg-white/95 backdrop-blur border border-[#EDE6DB] shadow-2xl p-4 rounded-2xl w-[320px] max-w-[calc(100vw-40px)] animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#F0ECE4] mb-3">
            <span className="text-xs font-bold text-[#1E4638] uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              Cấu hình Nhạc nền
            </span>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Settings Tabs Header */}
          <div className="flex bg-[#F5F2EC] rounded-xl p-1 mb-3.5">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                activeTab === 'presets'
                  ? 'bg-[#1E4638] text-white shadow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Nhạc mẫu
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                activeTab === 'upload'
                  ? 'bg-[#1E4638] text-white shadow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Tải file (.mp3)
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                activeTab === 'link'
                  ? 'bg-[#1E4638] text-white shadow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Dán link
            </button>
          </div>

          {/* Curated Preset Playlist View */}
          {activeTab === 'presets' && (
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
              {PRESET_TRACKS.map((track) => {
                const isActive = audioUrl === track.url || (!audioUrl && track.url === DEFAULT_TRACK);
                return (
                  <button
                    key={track.url}
                    onClick={() => handleSelectPreset(track.url)}
                    className={`text-left p-2.5 rounded-xl border transition-all text-xs flex justify-between items-center group ${
                      isActive
                        ? 'bg-[#1E4638]/5 border-[#1E4638]/40 text-[#1E4638] font-semibold'
                        : 'bg-white border-[#EDE6DB] text-gray-700 hover:border-[#1E4638]/30 hover:bg-[#FDFCF9]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="truncate font-semibold">{track.name}</p>
                      <p className="text-[10px] text-gray-400 font-normal truncate">{track.description}</p>
                    </div>
                    {isActive ? (
                      <Check className="w-4 h-4 text-[#1E4638] flex-shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-[#1E4638] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Local Device Audio Upload View */}
          {activeTab === 'upload' && (
            <div className="flex flex-col gap-2.5">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleLocalLoad(e.dataTransfer.files[0]); }}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  dragActive ? 'border-[#1E4638] bg-[#1E4638]/5' : 'border-[#EDE6DB] bg-white hover:border-[#C5A059]'
                }`}
              >
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-gray-600 mb-0.5">Tải lên từ điện thoại / máy tính</p>
                <p className="text-[10px] text-gray-400">Hỗ trợ các file .mp3, .m4a (Tối đa 20MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => { if (e.target.files?.[0]) handleLocalLoad(e.target.files[0]); }}
                  className="hidden"
                />
              </div>

              {uploadProgress && (
                <div className="flex items-center justify-center gap-2 py-1 text-xs text-gray-500 font-medium">
                  <span className="w-4 h-4 border-2 border-[#1E4638] border-t-transparent rounded-full animate-spin" />
                  Đang tải lên và xử lý nhạc...
                </div>
              )}

              {uploadSuccess && (
                <div className="text-[11px] text-[#1E4638] bg-[#F0F7F4] border border-[#1E4638]/20 rounded-lg py-1 px-2 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Đã lưu nhạc vào thiết bị chỉnh sửa!
                </div>
              )}

              {audioUrl === 'local:uploaded' && !uploadProgress && (
                <div className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5 italic">
                  <span>💡 <strong>Để ý:</strong> Do nhạc tự tải lên dung lượng cực lớn để chia sẻ trực tiếp qua link, link gửi bạn bè sẽ tự động phát nhạc cưới mẫu. Nếu muốn khách nghe nhạc riêng của bạn, vui lòng sang phần <strong>Dán link</strong> để dán liên kết .mp3 online nhé!</span>
                </div>
              )}
            </div>
          )}

          {/* Internet Audio Link View */}
          {activeTab === 'link' && (
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Nhập link nhạc nền (.mp3 URL)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={inpUrl}
                    onChange={(e) => setInpUrl(e.target.value)}
                    placeholder="VD: https://server.com/nhac-cuoi.mp3"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#EDE6DB] outline-none focus:border-[#C5A059] bg-[#FFFDFB]"
                  />
                  <button
                    onClick={handleSaveLink}
                    className="bg-[#1E4638] hover:bg-[#122C23] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    Lưu
                  </button>
                </div>
              </div>

              {audioUrl && audioUrl !== 'local:uploaded' && !audioUrl.startsWith('https://www.soundhelix') && (
                <div className="text-[11px] text-gray-600 bg-[#FDFCFA] border border-[#EDE6DB] px-2 py-1.5 rounded-lg truncate flex items-center gap-1 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate">Đang phát: {audioUrl}</span>
                </div>
              )}

              <p className="text-[9px] text-gray-400 leading-relaxed italic">
                * Mẹo: Bạn có thể dán link tệp nhạc .mp3 lấy từ Dropbox, Archive.org hoặc host nhạc của riêng bạn để phát đồng điệu với tất cả khách mời.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Floating control buttons */}
      <div className="flex gap-2.5 items-center">
        {isOrganizer && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-white/90 hover:bg-white text-gray-700 hover:text-[#1E4638] p-2.5 rounded-full shadow-lg border border-[#EDE6DB] transition-all text-xs font-semibold flex items-center gap-1.5 animate-bounce"
            title="Đổi nhạc nền"
          >
            <Music className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[10px] pr-1 hidden sm:inline font-bold uppercase tracking-wider">Đổi nhạc</span>
          </button>
        )}

        <button
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
