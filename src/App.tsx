/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Info, Eye, EyeOff, Music } from 'lucide-react';
import { WeddingInvite, WeddingEvent, CeremonyType } from './types';
import { EditEventModal, EditMapModal, EditPhotoModal } from './components/EditModal';
import Envelope from './components/Envelope';
import WeddingCard from './components/WeddingCard';
import AudioPlayer from './components/AudioPlayer';
import { sortWeddingEvents, cleanGoogleDriveUrl } from './utils/lunar';

const LOCAL_STORAGE_KEY = 'wedding_invite_organizer_data_v1';

const DEFAULT_INVITE: WeddingInvite = {
  groom: 'Vũ Văn Nhật',
  bride: 'Nguyễn Thị Kiều Trinh',
  groomParents: 'Vũ Văn Tám\nNguyễn Thị Chăm',
  brideParents: 'Nguyễn Văn Kết\nĐào Thị Thúy',
  ceremonyType: 'vu-quy',
  photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600&h=800',
  mapIframe: 'https://www.google.com/maps/embed?pb=!4v1779871128795!6m8!1m7!1shVw1ZX7FxHx-4obrsUVIsw!2m2!1d20.79030365273665!2d105.9857242743762!3f59.14076421414664!4f-26.032987768683626!5f0.7820865974627469',
  mapDirectionLink: 'https://www.google.com/maps/dir/?api=1&destination=20.790194,105.986694&waypoints=%C4%90H51,+Ch%C3%AD+Minh,+Kho%C3%A1i+Ch%C3%A2u,+H%C6%B0ng+Y%C3%AAn',
  events: [
    {
      id: 'evt-1',
      name: 'BỮA CƠM THÂN MẬT',
      time: '17:00',
      date: 'Thứ Bảy, ngày 06/06/2026',
      lunar: '(Tức chiều ngày 21 tháng 4 năm Bính Ngọ)',
      visible: true,
    },
    {
      id: 'evt-2',
      name: 'LỄ VU QUY',
      time: '08:30',
      date: 'Chủ Nhật, ngày 07/06/2026',
      lunar: '(Tức sáng ngày 22 tháng 4 năm Bính Ngọ)',
      visible: true,
    },
  ],
};

export default function App() {
  const [invite, setInvite] = useState<WeddingInvite>(DEFAULT_INVITE);
  const [guestName, setGuestName] = useState('Khách Quý');
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isInvitationOpened, setIsInvitationOpened] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showOrganizerPreview, setShowOrganizerPreview] = useState(false);

  // Modal controls
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<WeddingEvent | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // State load effect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // 1. Detect Guest Name parameter
    const guestParam = params.get('name');
    if (guestParam) {
      setGuestName(guestParam.trim());
    }

    // 2. Detect Custom Share Parameter (Base64 JSON invite)
    const customInviteParam = params.get('invite');
    const isAdminMode = params.get('admin') === 'true' || !params.toString();

    setIsOrganizer(isAdminMode);

    if (customInviteParam) {
      try {
        const decodedString = decodeURIComponent(escape(atob(customInviteParam)));
        const parsedInvite = JSON.parse(decodedString) as WeddingInvite;
        if (parsedInvite && parsedInvite.groom) {
          if (parsedInvite.events) {
            parsedInvite.events = sortWeddingEvents(parsedInvite.events);
          }
          setInvite(parsedInvite);
          return; // Skip loading local drafts if full custom invite is set in URL
        }
      } catch (err) {
        console.error('Failed to decode customized invitation params', err);
      }
    }

    // 3. Fallback to Local Organizer Drafts if in Admin Mode
    if (isAdminMode) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as WeddingInvite;
          if (parsed && parsed.groom) {
            if (parsed.events) {
              parsed.events = sortWeddingEvents(parsed.events);
            }
            setInvite(parsed);
          }
        } catch {
          // ignore parsing issues
        }
      }
    }
  }, []);

  // Save drafts locally as organizer modifies parameters
  const handleUpdateInvite = (newInvite: WeddingInvite) => {
    setInvite(newInvite);
    if (isOrganizer) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newInvite));
    }
  };

  const handleUpdateField = (field: keyof WeddingInvite, value: any) => {
    let updatedValue = value;
    if (field === 'events' && Array.isArray(value)) {
      updatedValue = sortWeddingEvents(value);
    }
    if (field === 'photoUrl' && typeof value === 'string') {
      updatedValue = cleanGoogleDriveUrl(value);
    }
    const updated = { ...invite, [field]: updatedValue };
    // Auto sync Ceremony label to the corresponding Timeline Event Name if visible
    if (field === 'ceremonyType') {
      const type = value as CeremonyType;
      updated.events = updated.events.map((evt) => {
        if (evt.name === 'LỄ VU QUY' || evt.name === 'LỄ THÀNH HÔN') {
          return {
            ...evt,
            name: type === 'vu-quy' ? 'LỄ VU QUY' : 'LỄ THÀNH HÔN',
          };
        }
        return evt;
      });
      updated.events = sortWeddingEvents(updated.events);
    }
    handleUpdateInvite(updated);
  };

  // Event list modifiers
  const handleSaveEvent = (edited: WeddingEvent) => {
    let updatedEvents = [...invite.events];
    const exists = invite.events.some((e) => e.id === edited.id);

    if (exists) {
      updatedEvents = updatedEvents.map((e) => (e.id === edited.id ? edited : e));
    } else {
      updatedEvents.push(edited);
    }

    handleUpdateField('events', updatedEvents);
    setIsEventModalOpen(false);
    setEventToEdit(null);
  };

  const handleDeleteEvent = (id: string) => {
    const updated = invite.events.filter((e) => e.id !== id);
    handleUpdateField('events', updated);
  };

  const handleToggleEventVisible = (id: string, currentVisible: boolean) => {
    const updated = invite.events.map((e) => (e.id === id ? { ...e, visible: !currentVisible } : e));
    handleUpdateField('events', updated);
  };

  // Google map configuration save
  const handleSaveMap = (newIframe: string, newDirectionLink: string, locationTitle: string, locationAddress: string) => {
    const updated = {
      ...invite,
      mapIframe: newIframe,
      mapDirectionLink: newDirectionLink,
      locationTitle,
      locationAddress,
    };
    handleUpdateInvite(updated);
    setIsMapModalOpen(false);
  };

  // Photograph save
  const handleSavePhoto = (newPhotoUrl: string) => {
    handleUpdateField('photoUrl', newPhotoUrl);
    setIsPhotoModalOpen(false);
  };

  // Serialize parameters into shareable deep link copy
  const handleShareLink = () => {
    try {
      const inviteToShare = { ...invite };
      let hadBase64Photo = false;
      if (inviteToShare.photoUrl && inviteToShare.photoUrl.startsWith('data:')) {
        hadBase64Photo = true;
        inviteToShare.photoUrl = DEFAULT_INVITE.photoUrl; // Default fine-art couple image fallback
      }

      const serializedString = btoa(unescape(encodeURIComponent(JSON.stringify(inviteToShare))));
      const shareUrl = new URL(window.location.origin + window.location.pathname);
      // Remove admin param if present
      shareUrl.searchParams.delete('admin');
      shareUrl.searchParams.set('invite', serializedString);
      shareUrl.searchParams.set('name', guestName.trim() || 'Khách Quý');

      navigator.clipboard.writeText(shareUrl.toString())
        .then(() => {
          if (hadBase64Photo) {
            showToast('✅ Đã sao chép! Lưu ý: Do ảnh tự tải lên dung lượng cực lớn, link gửi sẽ dùng ảnh cưới mẫu. Để hiện ảnh thật của bạn trên mọi thiết bị, vui lòng "Dán Link ảnh"!');
          } else {
            showToast('✅ Đã sao chép Link thiết kế! Gửi liên kết này cho bạn bè của bạn.');
          }
        })
        .catch(() => {
          prompt('Dán và copy thủ công liên kết tùy chỉnh của bạn:', shareUrl.toString());
        });
    } catch (e) {
      console.error('Error generating customized wedding invitation link', e);
      alert('Không thể tạo liên kết tùy chọn! Hãy tải lại trang và thử lại.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  return (
    <div id="wedding-invitation-root" className="w-full flex flex-col items-center">
      {/* Toast Notification */}
      <div
        id="toast-msg"
        className={`toast-notification z-50 fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-[#1E4638] text-white font-semibold text-xs md:text-sm shadow-xl transition-all duration-300 ${
          toastMessage ? 'show translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'
        }`}
      >
        <span>{toastMessage}</span>
      </div>

      {/* Organizer Designer Top Header Instruction bar */}
      {isOrganizer && (
        <div id="organizer-designer-bar" className="w-full max-w-[500px] mb-4 bg-white/90 backdrop-blur border border-[#C5A059] rounded-2xl p-4 shadow-lg text-left antialiased">
          <div className="flex items-center gap-2 text-[#1E4638] font-bold text-sm mb-1">
            <Sparkles className="w-4 h-4 text-[#C5A059] fill-[#C5A059]" />
            Chế độ Thiết kế thiệp cưới
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            Hệ thống đang hoạt động ở chế độ chỉnh sửa. Bạn có thể sửa trực tiếp tên, họ hàng, bản đồ, chương trình âm dương lịch. Sau đó, bấm <strong>Tạo Link Gửi Bạn Bè</strong> để sao chép liên kết hoàn chỉnh!
          </p>

          <div className="flex flex-col gap-1.5 mb-4 p-3.5 bg-[#F0F7F4] rounded-xl border border-[#C5A059]/40 text-left">
            <label className="text-[10px] font-bold text-[#1E4638] uppercase tracking-wider block">
              ✍️ Nhập tên khách mời (Để tạo link gửi bạn bè):
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="VD: Anh Thiên, Gia đình Anh Chị..."
              className="w-full px-3 py-2 rounded-lg border border-[#EDE6DB] focus:border-[#C5A059] outline-none text-xs bg-white font-medium text-gray-800 shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleShareLink}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1E4638] hover:bg-[#122C23] text-white shadow transition-transform hover:-translate-y-0.5"
            >
              📤 Tạo Link Gửi Bạn Bè
            </button>
            <button
              onClick={() => {
                setInvite(DEFAULT_INVITE);
                setGuestName('Khách Quý');
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                showToast('✨ Đã khôi phục thiết kế thiệp gốc!');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 border border-[#E5E1D8] transition-colors"
            >
              Khôi phục thiệp gốc
            </button>
          </div>
        </div>
      )}

      {/* Primary Container components */}
      {!isInvitationOpened ? (
        <Envelope
          guestName={guestName}
          groom={invite.groom}
          bride={invite.bride}
          groomShort={invite.groomShort}
          brideShort={invite.brideShort}
          onOpen={() => setIsInvitationOpened(true)}
          isOrganizer={isOrganizer}
          onUpdateGuestName={setGuestName}
        />
      ) : (
        <WeddingCard
          invite={invite}
          isOrganizer={isOrganizer}
          guestName={guestName}
          onUpdateGuestName={setGuestName}
          onUpdateField={handleUpdateField}
          onOpenEventModal={(evt) => {
            setEventToEdit(evt);
            setIsEventModalOpen(true);
          }}
          onDeleteEvent={handleDeleteEvent}
          onToggleEventVisible={handleToggleEventVisible}
          onOpenMapModal={() => setIsMapModalOpen(true)}
          onOpenPhotoModal={() => setIsPhotoModalOpen(true)}
          onShare={handleShareLink}
        />
      )}

      {/* Floating Ambient Instrumental Audio Player */}
      <AudioPlayer
        autoPlayTrigger={isInvitationOpened}
        audioUrl={invite.audioUrl}
        onUpdateAudioUrl={(url) => handleUpdateField('audioUrl', url)}
        isOrganizer={isOrganizer}
      />

      {/* Shared Modular Modals Portal */}
      <EditEventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        onSave={handleSaveEvent}
      />

      <EditMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        currentIframe={invite.mapIframe}
        currentDirectionLink={invite.mapDirectionLink}
        currentLocationTitle={invite.locationTitle}
        currentLocationAddress={invite.locationAddress}
        onSave={handleSaveMap}
      />

      <EditPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentPhotoUrl={invite.photoUrl}
        onSave={handleSavePhoto}
      />
    </div>
  );
}
