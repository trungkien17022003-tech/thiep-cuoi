/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Image as ImageIcon, Upload, Check } from 'lucide-react';
import { WeddingEvent } from '../types';
import {
  solarToLunar,
  lunarToSolarBF,
  canChiYear,
  formatSolarVN,
  formatLunarVN,
} from '../utils/lunar';

// ==========================================
// PRESET MOCKUP CONSTANTS (Fine-art vertical images)
// ==========================================
const PHOTO_PRESETS = [
  {
    name: 'Fine Art Couple',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600&h=800',
  },
  {
    name: 'Romantic Kiss',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600&h=800',
  },
  {
    name: 'Traditional Laughing',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600&h=800',
  },
  {
    name: 'Bride & Details',
    url: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&q=80&w=600&h=800',
  },
];

// ==========================================
// 1. EVENT EDITOR MODAL WITH REAL-TIME LUNAR SYNC
// ==========================================
interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit: WeddingEvent | null;
  onSave: (edited: WeddingEvent) => void;
}

export function EditEventModal({ isOpen, onClose, eventToEdit, onSave }: EditEventModalProps) {
  const [name, setName] = useState('');
  const [time, setTime] = useState('17:00');
  const [dateStr, setDateStr] = useState('');
  const [lunarStr, setLunarStr] = useState('');

  // Lunar picker state
  const [lunarDay, setLunarDay] = useState<number>(0);
  const [lunarMonth, setLunarMonth] = useState<number>(0);
  const [lunarYear, setLunarYear] = useState<number>(0);
  const [lunarLeap, setLunarLeap] = useState(false);
  const [hasLeapOption, setHasLeapOption] = useState(false);

  // Load state when modal opens
  useEffect(() => {
    if (eventToEdit) {
      setName(eventToEdit.name);
      setTime(eventToEdit.time);
      setDateStr(eventToEdit.date);
      setLunarStr(eventToEdit.lunar);

      // Reset picker
      setLunarDay(0);
      setLunarMonth(0);
      setLunarYear(0);
      setLunarLeap(false);
      setHasLeapOption(false);
    } else {
      setName('');
      setTime('12:00');
      setDateStr('');
      setLunarStr('');
      setLunarDay(0);
      setLunarMonth(0);
      setLunarYear(new Date().getFullYear());
      setLunarLeap(false);
    }
  }, [eventToEdit, isOpen]);

  // Check Leap Month possibility when lunarMonth or lunarYear adjusts
  useEffect(() => {
    if (lunarYear && lunarMonth) {
      // Search: does this lunar month in this lunar year have any leap double month?
      let hasLeap = false;
      const trialFirst = new Date(lunarYear, lunarMonth - 2, 1);
      const trialLast = new Date(lunarYear, lunarMonth + 2, 28);
      for (let d = new Date(trialFirst); d <= trialLast; d.setDate(d.getDate() + 1)) {
        const L = solarToLunar(d.getDate(), d.getMonth() + 1, d.getFullYear());
        if (L.month === lunarMonth && L.year === lunarYear && L.leap) {
          hasLeap = true;
          break;
        }
      }
      setHasLeapOption(hasLeap);
      if (!hasLeap) setLunarLeap(false);
    } else {
      setHasLeapOption(false);
    }
  }, [lunarYear, lunarMonth]);

  // Handle conversion loop when lunar parameters change
  const handleLunarChange = (d: number, m: number, y: number, leap: boolean) => {
    setLunarDay(d);
    setLunarMonth(m);
    setLunarYear(y);
    setLunarLeap(leap);

    if (d && m && y) {
      const solar = lunarToSolarBF(d, m, y, leap);
      if (!solar) {
        setDateStr('⚠ Ngày Âm lịch không tồn tại trong chu kỳ!');
        setLunarStr('');
        return;
      }
      const solarText = formatSolarVN(solar);

      // Detect state of day from hour string
      let timeState = '';
      const hour = parseInt(time.split(':')[0], 10);
      if (!isNaN(hour)) {
        if (hour < 12) timeState = 'sáng';
        else if (hour < 13) timeState = 'trưa';
        else if (hour < 18) timeState = 'chiều';
        else timeState = 'tối';
      }

      const lunarObj = solarToLunar(solar.getDate(), solar.getMonth() + 1, solar.getFullYear());
      const lunarText = formatLunarVN(lunarObj, timeState);

      setDateStr(solarText);
      setLunarStr(lunarText);
    }
  };

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-[400px] max-h-[92vh] overflow-y-auto antialiased animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b border-[#E5E1D8] pb-3 mb-4">
          <h3 className="font-garamond text-xl font-bold text-[#E11D48] flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {eventToEdit ? 'Chỉnh sửa bữa / lễ' : 'Thêm bữa / lễ mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-5">
          {/* Event Name */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Tên bữa / lễ
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="VD: BỮA CƠM THÂN MẬT, LỄ THÀNH HÔN"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE6DB] focus:border-[#C5A059] outline-none text-sm bg-[#FFFDFB]"
              autoFocus
            />
          </div>

          {/* Event Time */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Giờ diễn ra
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE6DB] focus:border-[#C5A059] outline-none text-sm bg-[#FFFDFB]"
            />
          </div>

          {/* Dynamic Lunar Date Picker */}
          <div className="border border-[#E5DDD0] rounded-xl p-3.5 bg-[#FAF9F6]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              🌙 Chuyển đổi Âm lịch sang Dương lịch
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">Ngày</span>
                <select
                  value={lunarDay}
                  onChange={(e) => handleLunarChange(parseInt(e.target.value, 10), lunarMonth, lunarYear, lunarLeap)}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#EDE6DB] text-xs bg-white focus:border-[#C5A059] outline-none"
                >
                  <option value={0}>--</option>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">Tháng</span>
                <select
                  value={lunarMonth}
                  onChange={(e) => handleLunarChange(lunarDay, parseInt(e.target.value, 10), lunarYear, lunarLeap)}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#EDE6DB] text-xs bg-white focus:border-[#C5A059] outline-none"
                >
                  <option value={0}>--</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">Năm</span>
                <select
                  value={lunarYear}
                  onChange={(e) => handleLunarChange(lunarDay, lunarMonth, parseInt(e.target.value, 10), lunarLeap)}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#EDE6DB] text-xs bg-white focus:border-[#C5A059] outline-none"
                >
                  <option value={0}>--</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y} ({canChiYear(y)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasLeapOption && (
              <div className="mt-2.5 flex items-center gap-2 pl-1 animate-in slide-in-from-top-1 duration-150">
                <input
                  type="checkbox"
                  id="leap-chk"
                  checked={lunarLeap}
                  onChange={(e) => handleLunarChange(lunarDay, lunarMonth, lunarYear, e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#E11D48]"
                />
                <label htmlFor="leap-chk" className="text-xs font-semibold text-[#E11D48] cursor-pointer">
                  Tháng nhuận
                </label>
              </div>
            )}
          </div>

          {/* Calculated Output Texts with Manual Editing Override */}
          <details className="border border-[#E5DDD0] rounded-xl overflow-hidden" open={!lunarDay}>
            <summary className="bg-gray-50/80 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100/85 cursor-pointer flex justify-between select-none">
              <span>✏️ Chỉnh tay hiển thị ngày (thủ công)</span>
            </summary>
            <div className="p-3.5 bg-[#FFFDFB] flex flex-col gap-3">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  Dương lịch (hiển thị)
                </label>
                <input
                  type="text"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  placeholder="VD: Thứ Bảy, ngày 06/06/2026"
                  className="w-full px-3 py-2 rounded-lg border border-[#EDE6DB] text-xs outline-none bg-white focus:border-[#C5A059]"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  Âm lịch (hiển thị)
                </label>
                <input
                  type="text"
                  value={lunarStr}
                  onChange={(e) => setLunarStr(e.target.value)}
                  placeholder="VD: (Tức chiều ngày 21 tháng 4 năm Bính Ngọ)"
                  className="w-full px-3 py-2 rounded-lg border border-[#EDE6DB] text-xs outline-none bg-white focus:border-[#C5A059]"
                />
              </div>
            </div>
          </details>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => {
              if (name.trim() === '') {
                alert('Vui lòng nhập tên bữa/lễ!');
                return;
              }
              if (dateStr.trim() === '') {
                alert('Vui lòng nhập ngày dương lịch!');
                return;
              }
              onSave({
                id: eventToEdit ? eventToEdit.id : `evt-${Date.now()}`,
                name: name.trim(),
                time,
                date: dateStr,
                lunar: lunarStr,
                visible: eventToEdit ? eventToEdit.visible : true,
              });
            }}
            className="flex-1 bg-[#E11D48] hover:bg-[#BE123C] text-white py-2.5 rounded-xl text-sm font-semibold tracking-wide shadow-md transition-colors"
          >
            Lưu bữa lễ
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 border border-[#E5DDD0] text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. GOOGLE MAPS CONFIGURATION MODAL
// ==========================================
interface EditMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIframe: string;
  currentDirectionLink: string;
  onSave: (newIframe: string, newDirectionLink: string) => void;
}

export function EditMapModal({
  isOpen,
  onClose,
  currentIframe,
  currentDirectionLink,
  onSave,
}: EditMapModalProps) {
  const [iframeInput, setIframeInput] = useState('');
  const [directionLink, setDirectionLink] = useState('');

  useEffect(() => {
    setIframeInput(currentIframe);
    setDirectionLink(currentDirectionLink);
  }, [currentIframe, currentDirectionLink, isOpen]);

  if (!isOpen) return null;

  // Extract clean src URL from pasted raw HTML iframe tag if necessary
  const handleSave = () => {
    let cleanSrc = iframeInput.trim();
    if (cleanSrc.includes('<iframe')) {
      const match = cleanSrc.match(/src="([^"]+)"/);
      if (match && match[1]) {
        cleanSrc = match[1];
      }
    }
    onSave(cleanSrc, directionLink.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b border-[#E5E1D8] pb-3 mb-4">
          <h3 className="font-garamond text-xl font-bold text-[#E11D48] flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Cấu hình Bản đồ chỉ đường
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-5">
          {/* Iframe Input */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Mã Iframe Nhúng Bản Đồ (Google Maps Iframe src)
            </label>
            <textarea
              value={iframeInput}
              onChange={(e) => setIframeInput(e.target.value)}
              placeholder='Dán đoạn mã <iframe> hoặc link nhúng src từ Google Maps...'
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE6DB] focus:border-[#C5A059] outline-none text-xs bg-[#FFFDFB] font-mono"
            />
            <p className="text-[10px] text-gray-400 leading-normal">
              Mẹo: Lên Google Maps → Chia sẻ → Nhúng bản đồ → Sao chép HTML rồi dán vào đây! Hệ thống sẽ tự lọc link nhúng sạch.
            </p>
          </div>

          {/* Direction Link */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Link mở bản đồ trực tiếp (Đi tới đích)
            </label>
            <input
              type="text"
              value={directionLink}
              onChange={(e) => setDirectionLink(e.target.value)}
              placeholder="VD: https://www.google.com/maps/dir/?api=1&destination=..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE6DB] focus:border-[#C5A059] outline-none text-xs bg-[#FFFDFB]"
            />
            <p className="text-[10px] text-gray-400 lead-normal">
              Dán link chia sẻ vị trí của Google Maps để khách mời bấm mở bản ghi hướng đi trên điện thoại di động dễ dàng.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={handleSave}
            className="flex-1 bg-[#E11D48] hover:bg-[#BE123C] text-white py-2.5 rounded-xl text-sm font-semibold tracking-wide shadow-md transition-colors"
          >
            Lưu cấu hình
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 border border-[#E5DDD0] text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. BRIDE & GROOM PHOTO ADJUSTER MODAL
// ==========================================
interface EditPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl: string;
  onSave: (newPhotoUrl: string) => void;
}

export function EditPhotoModal({ isOpen, onClose, currentPhotoUrl, onSave }: EditPhotoModalProps) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    setPhotoUrl(currentPhotoUrl);
  }, [currentPhotoUrl, isOpen]);

  if (!isOpen) return null;

  // Handle local image file upload converting it to stable Base64 string
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ!');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước ảnh quá lớn! Vui lòng chọn ảnh < 2MB để lưu trữ tốt nhất.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-[420px] max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 font-sans">
        <div className="flex justify-between items-center border-b border-[#E5E1D8] pb-3 mb-4">
          <h3 className="font-garamond text-xl font-bold text-[#E11D48] flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Thay đổi Ảnh Cô dâu & Chú rể
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-5">
          {/* File Upload drag-drop frame */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Tải ảnh từ máy tính / Điện thoại
            </label>
            <div className="relative border-2 border-dashed border-[#EDE6DB] hover:border-[#C5A059] rounded-xl p-5 flex flex-col items-center justify-center bg-[#FFFDFB] transition-colors group cursor-pointer text-center">
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#C5A059] transition-colors mb-2" />
              <p className="text-xs text-gray-500 font-medium mb-1">
                Kéo ảnh vào đây hoặc bấm để chọn
              </p>
              <p className="text-[10px] text-gray-400">
                Chấp nhận PNG, JPG, GIF (Tối đa 2MB)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Photo URL pasting */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Hoặc dán Link/URL hình ảnh cưới
            </label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Dán link ảnh cưới dọc..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#EDE6DB] focus:border-[#C5A059] outline-none text-xs bg-[#FFFDFB]"
            />
          </div>

          {/* Vertical Fine Art presets row selection */}
          <div className="text-left mt-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Hoặc chọn ảnh mẫu minh họa nghệ thuật
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {PHOTO_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setPhotoUrl(preset.url)}
                  className="relative rounded-lg overflow-hidden h-20 group border border-gray-100 hover:border-[#C5A059] transition-all transform hover:scale-105"
                  title={preset.name}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  {photoUrl === preset.url && (
                    <div className="absolute inset-0 bg-[#E11D48]/50 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white font-bold" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => onSave(photoUrl)}
            className="flex-1 bg-[#E11D48] hover:bg-[#BE123C] text-white py-2.5 rounded-xl text-sm font-semibold tracking-wide shadow-md transition-colors"
          >
            Lưu thay đổi
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 border border-[#E5DDD0] text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
}
