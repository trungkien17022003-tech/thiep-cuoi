/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Calendar, Clock, Edit2, Plus, Eye, EyeOff, Trash2, Heart, Share2 } from 'lucide-react';
import { WeddingInvite, WeddingEvent, CeremonyType } from '../types';

interface WeddingCardProps {
  invite: WeddingInvite;
  isOrganizer: boolean;
  onUpdateField: (field: keyof WeddingInvite, value: any) => void;
  onOpenEventModal: (event: WeddingEvent | null) => void;
  onDeleteEvent: (id: string) => void;
  onToggleEventVisible: (id: string, current: boolean) => void;
  onOpenMapModal: () => void;
  onOpenPhotoModal: () => void;
  onShare: () => void;
}

export default function WeddingCard({
  invite,
  isOrganizer,
  onUpdateField,
  onOpenEventModal,
  onDeleteEvent,
  onToggleEventVisible,
  onOpenMapModal,
  onOpenPhotoModal,
  onShare,
}: WeddingCardProps) {
  const visibleEvents = invite.events.filter((e) => e.visible !== false);

  // Computes short names based on updated full names
  const groomLast = invite.groomShort || invite.groom.trim().split(' ').pop() || 'Nhật';
  const brideLast = invite.brideShort || invite.bride.trim().split(' ').pop() || 'Trinh';

  return (
    <div id="main-card" className="w-full max-w-[500px] animate-in fade-in slide-in-from-bottom-5 duration-500 font-sans">
      <div className="bg-white border-[12px] border-[#E5E1D8] rounded-[24px] px-6 py-10 shadow-2xl relative overflow-hidden text-center antialiased">
        {/* Fine Gold border lining */}
        <div className="absolute inset-3.5 border border-[#C5A059]/50 rounded-2xl pointer-events-none z-10" />

        {/* Vintage Top Ornaments */}
        <svg className="decor-top-left absolute top-[-5px] left-[-5px] w-28 md:w-32 opacity-85 pointer-events-none z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0C30 10 60 5 80 30C50 35 20 20 0 0Z" fill="#E11D48" opacity="0.12"/>
          <path d="M0 20C15 35 40 30 55 50C35 50 15 40 0 20Z" fill="#E11D48" opacity="0.08"/>
          <circle cx="15" cy="40" r="2.5" fill="#C5A059" opacity="0.4"/>
          <circle cx="45" cy="20" r="2" fill="#C5A059" opacity="0.4"/>
        </svg>

        <svg className="decor-top-right absolute top-[-5px] right-[-5px] w-28 md:w-32 opacity-85 pointer-events-none z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 0C70 10 40 5 20 30C50 35 80 20 100 0Z" fill="#E11D48" opacity="0.12"/>
          <path d="M100 20C85 35 60 30 45 50C65 50 85 40 100 20Z" fill="#E11D48" opacity="0.08"/>
          <circle cx="85" cy="40" r="2.5" fill="#C5A059" opacity="0.4"/>
          <circle cx="55" cy="20" r="2" fill="#C5A059" opacity="0.4"/>
        </svg>

        <p className="invitation-title font-sans text-[10px] md:text-xs tracking-[3.5px] text-gray-500 font-bold uppercase mb-4 mt-4">
          Trân trọng kính mời
        </p>

        {/* Guest names block (clickable to dynamically modify for quick generation) */}
        <div className="relative inline-block group mb-3">
          <div className="guest-box font-dancing text-4xl md:text-5xl font-bold text-[#E11D48] pb-1.5 border-b-2 border-dashed border-[#C5A059] px-4 select-none">
            {invite.groomShort && invite.brideShort ? 'Quý Khách' : 'Khách Quý'}
          </div>
          {isOrganizer && (
            <p className="text-[10px] text-gray-400 italic mt-0.5">
              (Xem trước thiệp dưới góc độ khách mời)
            </p>
          )}
        </div>

        {/* Ceremony Type Selector toggle (restricted only to wedding organizers) */}
        {isOrganizer && (
          <div id="ceremony-toggle-wrapper" className="my-3 flex justify-center animate-in fade-in duration-200">
            <div className="ceremony-toggle flex bg-[#FFF1F2] border border-[#E5E1D8] rounded-full p-1 gap-1">
              <button
                onClick={() => onUpdateField('ceremonyType', 'vu-quy')}
                className={`ctog-btn px-4.5 py-1.5 rounded-full text-xs font-semibold select-none transition-all ${
                  invite.ceremonyType === 'vu-quy'
                    ? 'bg-[#E11D48] text-white shadow-md'
                    : 'text-gray-500 hover:bg-[#C5A059]/15'
                }`}
              >
                Lễ Vu Quy
              </button>
              <button
                onClick={() => onUpdateField('ceremonyType', 'thanh-hon')}
                className={`ctog-btn px-4.5 py-1.5 rounded-full text-xs font-semibold select-none transition-all ${
                  invite.ceremonyType === 'thanh-hon'
                    ? 'bg-[#E11D48] text-white shadow-md'
                    : 'text-gray-500 hover:bg-[#C5A059]/15'
                }`}
              >
                Lễ Thành Hôn
              </button>
            </div>
          </div>
        )}

        <p id="invitation-text" className="invitation-text font-garamond text-base md:text-lg font-semibold text-gray-700 leading-relaxed mb-6 mt-1.5">
          Tới dự bữa cơm thân mật<br />
          mừng lễ {invite.ceremonyType === 'vu-quy' ? 'vu quy' : 'thành hôn'} cùng gia đình chúng tôi
        </p>

        {/* Groom & Bride primary names display */}
        <div className="couple-names font-garamond text-3xl md:text-4xl font-extrabold text-[#E11D48] leading-tight select-none">
          <div className="relative inline-block group">
            {isOrganizer ? (
              <input
                type="text"
                value={invite.groom}
                onChange={(e) => onUpdateField('groom', e.target.value)}
                className="text-center font-bold bg-transparent outline-none border-b border-transparent focus:border-[#C5A059] px-2 w-full text-3xl md:text-4xl"
                placeholder="Tên Chú Rể"
              />
            ) : (
              <span>{invite.groom}</span>
            )}
          </div>

          <div className="ampersand font-dancing text-[42px] md:text-5xl font-bold text-[#C5A059] my-0.5">
            &
          </div>

          <div className="relative inline-block group">
            {isOrganizer ? (
              <input
                type="text"
                value={invite.bride}
                onChange={(e) => onUpdateField('bride', e.target.value)}
                className="text-center font-bold bg-transparent outline-none border-b border-transparent focus:border-[#C5A059] px-2 w-full text-3xl md:text-4xl"
                placeholder="Tên Cô Dâu"
              />
            ) : (
              <span>{invite.bride}</span>
            )}
          </div>
        </div>

        {/* Elegant Framed Wedding Couple Photography */}
        <div className="couple-photo-wrapper my-7 flex flex-col items-center">
          <div className="couple-photo-frame relative w-[260px] border-radius-xl">
            {/* Fine vintage gold corner borders */}
            <div className="photo-corner tl" />
            <div className="photo-corner tr" />
            <div className="photo-corner bl" />
            <div className="photo-corner br" />

            {/* Main Image */}
            <img
              src={invite.photoUrl}
              alt={`Ảnh cưới ${invite.groom} & ${invite.bride}`}
              className="couple-photo w-full h-[340px] object-cover object-top rounded-xl shadow-lg border-4 border-white outline outline-1 outline-[#C5A059]/40"
              loading="lazy"
            />

            {/* Click to Edit photo overlay (visible only to organizers) */}
            {isOrganizer && (
              <button
                onClick={onOpenPhotoModal}
                className="absolute inset-0 bg-black/45 hover:bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-white"
                title="Thay đổi ảnh cưới"
              >
                <Edit2 className="w-6 h-6 text-[#F5DE9E]" />
                <span className="text-xs font-semibold font-sans tracking-wide">Đổi ảnh cưới</span>
              </button>
            )}
          </div>
          <p className="photo-caption font-garamond italic text-[14px] text-gray-500 mt-2 font-medium">
            ❦ Hạnh phúc mãi mãi ❦
          </p>
        </div>

        {/* MAP LOCATION & GOOGLE EMBEDDING DETAILS */}
        <div className="location-wrapper my-7 flex flex-col items-center bg-[#FFF1F2] border border-[#E5E1D8] p-5 rounded-2xl">
          <div className="flex w-full justify-between items-center mb-1">
            <p className="location-title font-sans text-[10px] md:text-xs font-bold tracking-[1.5px] uppercase text-[#7A6F5D]">
              📍 VỊ TRÍ ĐƯỢC TỔ CHỨC
            </p>
            {isOrganizer && (
              <button
                onClick={onOpenMapModal}
                className="text-xs text-[#E11D48] hover:text-[#BE123C] font-bold flex items-center gap-1 bg-[#E11D48]/5 px-2.5 py-1 rounded-lg"
              >
                <Edit2 className="w-3 h-3" /> Cấu hình bản đồ
              </button>
            )}
          </div>
          <p className="location-main font-garamond text-xl md:text-2xl font-bold text-[#E11D48] tracking-wider mb-1.5">
            NHÀ CÔ DÂU
          </p>
          <p className="location-detail text-sm font-medium text-gray-800 leading-relaxed px-1">
            Cuối ngõ Nghè (Đi vào từ đường ĐH51), gần chợ Đại Quan,<br />
            Xã Chí Minh, Tỉnh Hưng Yên
          </p>

          {/* Embed Google maps using the loaded secure parameter src URL */}
          {invite.mapIframe && (
            <div className="map-embed w-full mt-3 rounded-xl overflow-hidden border border-[#E5DDD0] shadow-sm bg-white">
              <iframe
                src={invite.mapIframe}
                allowFullScreen={true}
                loading="lazy"
                title="Bản đồ địa điểm nhà cô dâu"
                className="w-full h-40 border-none block"
              />
            </div>
          )}

          {invite.mapDirectionLink && (
            <a
              href={invite.mapDirectionLink}
              target="_blank"
              rel="noopener noreferrer"
              className="map-link-btn inline-block bg-[#E11D48] hover:bg-[#BE123C] text-white text-[11px] font-bold tracking-wider uppercase px-6 py-2.5 rounded-full shadow-md transition-transform transform hover:-translate-y-0.5 mt-3 duration-200"
            >
              Mở bản đồ chỉ đường
            </a>
          )}
        </div>

        {/* WEDDING EVENTS TIMELINE FLOW */}
        <div id="event-manager-wrapper" className="my-6">
          {isOrganizer && (
            <div className="event-manager bg-[#FFF1F2] border border-[#E5E1D8] rounded-2xl p-4.5 mb-5 shadow-sm text-left">
              <div className="event-manager-header flex justify-between items-center border-b border-dashed border-[#C5A059] pb-2.5 mb-3.5">
                <span className="event-manager-title text-xs font-bold text-[#E11D48] tracking-widest uppercase">
                  📋 QUẢN LÝ CÁC BỮA & LỄ CỦA THIỆP
                </span>
                <button
                  onClick={() => onOpenEventModal(null)}
                  className="btn-add-evt bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 tracking-wide shadow transition-transform hover:-translate-y-0.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm bữa lễ
                </button>
              </div>

              {/* Admin configuration table rows */}
              <div id="event-admin-list" className="flex flex-col gap-2.5">
                {invite.events.map((evt) => (
                  <div
                    key={evt.id}
                    className={`event-admin-row flex items-center justify-between p-3 bg-white border border-[#E5E1D8] rounded-xl shadow-xs transition-opacity duration-200 ${
                      evt.visible ? '' : 'opacity-50'
                    }`}
                  >
                    <div className="event-admin-info truncate min-w-0 pr-2">
                       <span className="event-admin-name text-sm font-bold text-[#E11D48] font-garamond block truncate">
                        {evt.name}
                      </span>
                      <span className="event-admin-meta text-[11px] text-gray-400 block truncate">
                        {evt.time} — {evt.date}
                      </span>
                    </div>
                    <div className="event-admin-actions flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => onToggleEventVisible(evt.id, evt.visible)}
                        className="btn-icon w-8 h-8 rounded-lg border border-[#E5DDD0] flex items-center justify-center hover:bg-gray-50"
                        title={evt.visible ? 'Ẩn sự kiện này' : 'Hiện sự kiện này'}
                      >
                        {evt.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                      <button
                        onClick={() => onOpenEventModal(evt)}
                        className="btn-icon w-8 h-8 rounded-lg border border-[#E5DDD0] flex items-center justify-center hover:bg-gray-50 text-gray-600"
                        title="Chỉnh sửa bữa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteEvent(evt.id)}
                        className="btn-icon w-8 h-8 rounded-lg border border-[#E5DDD0] flex items-center justify-center hover:bg-red-50 text-red-600 hover:border-red-200"
                        title="Xóa sự kiện"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actual timeline visible rendering */}
          <div className="event-timeline flex flex-col gap-5 text-left">
            {invite.events.filter((e) => e.visible !== false).length === 0 ? (
              <p className="text-center font-garamond italic text-gray-400 text-sm py-4">
                Chưa có bữa / lễ nào được thêm vào lịch trình của thiệp.
              </p>
            ) : (
              invite.events
                .filter((e) => e.visible !== false)
                .map((evt, idx) => (
                  <div key={evt.id} className="relative animate-in fade-in duration-300">
                    {idx > 0 && <div className="event-divider w-4/5 h-[1px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent my-4 mx-auto" />}
                    <div className="event-item p-5 bg-[#FFF1F2] border border-[#E5E1D8] rounded-2xl hover:scale-[1.012] hover:shadow-md transition-all duration-300">
                      <div className="event-name font-garamond text-xl font-bold text-[#E11D48] tracking-wide mb-1 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-[#C5A059] fill-[#C5A059]" />
                        {evt.name}
                      </div>
                      <div className="event-time text-2xl font-bold text-gray-800 mb-1 flex items-center gap-1">
                        <Clock className="w-5 h-5 text-gray-400" />
                        {evt.time}
                      </div>
                      <div className="event-date text-xs font-semibold text-gray-600 tracking-wider uppercase mb-1">
                        {evt.date}
                      </div>
                      {evt.lunar && <div className="event-lunar text-xs italic text-gray-500">{evt.lunar}</div>}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <p className="welcome-text font-garamond italic text-base text-gray-700 leading-relaxed mb-6 px-2.5">
          Sự hiện diện của quý vị là niềm vinh hạnh vô bờ cho gia đình chúng tôi!
        </p>

        {/* Generate Link and trigger clipboard copy */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={onShare}
            className="share-btn bg-[#C5A059] hover:bg-[#B8935E] text-gray-900 border-none font-sans font-bold text-xs tracking-wider uppercase px-6 py-2.5 rounded-xl shadow transition-transform transform hover:-translate-y-0.5 duration-200 flex items-center gap-1.5"
            title="Tạo link và cóp"
          >
            <Share2 className="w-3.5 h-3.5" />
            📤 Tạo Link Gửi Bạn Bè
          </button>
        </div>

        {/* PARENTS FAMILY SPECIFICS */}
        <div className="parents-section flex justify-between items-start border-t border-dashed border-[#C5A059] pt-6 text-sm text-left leading-normal">
          <div className="parents-column w-[48%]">
            <p className="parents-title font-sans text-[10px] md:text-xs font-bold tracking-wider uppercase text-gray-400 mb-1.5">
              Họ Nhà Trai
            </p>
            {isOrganizer ? (
              <textarea
                value={invite.groomParents}
                onChange={(e) => onUpdateField('groomParents', e.target.value)}
                rows={2}
                className="w-full text-sm font-bold text-[#E11D48] font-garamond leading-snug bg-transparent border-b border-transparent focus:border-[#C5A059] outline-none"
                placeholder="Tên bố mẹ chú rể..."
              />
            ) : (
              <p className="parents-names text-base font-bold text-[#E11D48] font-garamond leading-snug whitespace-pre-line">
                {invite.groomParents}
              </p>
            )}
            <span className="role-note text-xs italic text-gray-500 mt-1.5 block">
              Chú rể: {groomLast}
            </span>
          </div>

          <div className="parents-column parents-column-right w-[48%] text-right">
            <p className="parents-title font-sans text-[10px] md:text-xs font-bold tracking-wider uppercase text-gray-400 mb-1.5">
              Họ Nhà Gái
            </p>
            {isOrganizer ? (
              <textarea
                value={invite.brideParents}
                onChange={(e) => onUpdateField('brideParents', e.target.value)}
                rows={2}
                className="w-full text-sm font-bold text-[#E11D48] font-garamond leading-snug bg-transparent border-b border-transparent focus:border-[#C5A059] outline-none text-right"
                placeholder="Tên bố mẹ cô dâu..."
              />
            ) : (
              <p className="parents-names text-base font-bold text-[#E11D48] font-garamond leading-snug whitespace-pre-line text-right">
                {invite.brideParents}
              </p>
            )}
            <span className="role-note text-xs italic text-gray-500 mt-1.5 block">
              Cô dâu: {brideLast}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
