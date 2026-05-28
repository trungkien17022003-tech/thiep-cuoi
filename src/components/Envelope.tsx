/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface EnvelopeProps {
  guestName: string;
  groom: string;
  bride: string;
  groomShort?: string;
  brideShort?: string;
  onOpen: () => void;
}

export default function Envelope({
  guestName,
  groom,
  bride,
  groomShort,
  brideShort,
  onOpen,
}: EnvelopeProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [isBroken, setIsBroken] = useState(false);

  // Compute initials and short names for synchronization
  const groomWord = groomShort || groom.trim().split(' ').pop() || 'Nhật';
  const brideWord = brideShort || bride.trim().split(' ').pop() || 'Trinh';
  const displayGuest = guestName.trim() || 'Khách Quý';

  const initials = `${groomWord.charAt(0)} & ${brideWord.charAt(0)}`.toUpperCase();
  const shortPair = `${groomWord} & ${brideWord}`;

  const handleOpen = () => {
    if (isOpened) return;
    setIsOpened(true);

    // Audio click effect (fallback oscillator)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(250, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.log('AudioContext is blocked or unsupported', e);
    }

    // Step 1: Wax seal breaks
    setTimeout(() => {
      setIsBroken(true);
    }, 500);

    // Step 2: Main card triggers reveal
    setTimeout(() => {
      onOpen();
    }, 2800);
  };

  return (
    <div
      id="envelope-screen"
      className="fixed inset-0 w-full h-full flex flex-col items-center justify-center z-40 transition-all duration-[1250ms] ease-in-out"
      style={{
        background: 'radial-gradient(ellipse at center, #FAF9F6 0%, #F3F0E9 60%, #E5E1D8 100%)',
        opacity: isBroken ? 0 : 1,
        pointerEvents: isBroken ? 'none' : 'auto',
        transform: isBroken ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Dynamic ambient background glow */}
      <div className="absolute w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(225,29,72,0.15)_0%,transparent_70%)] pointer-events-none animate-pulse duration-[3000ms]" />

      {/* Floating Sparkle Elements */}
      <div className="sparkles">
        <div className="sparkle s1 font-garamond">✨</div>
        <div className="sparkle s2 font-garamond">✦</div>
        <div className="sparkle s3 font-garamond">✨</div>
        <div className="sparkle s4 font-garamond">✦</div>
        <div className="sparkle s5 font-garamond">✨</div>
        <div className="sparkle s6 font-garamond">❀</div>
      </div>

      {/* 3D Envelope Scene */}
      <div className="scene mb-8">
        <div className="envelope3d relative w-[400px] h-[270px]">
          {/* Top Flap (lies outside clip to rotate freely) */}
          <div className={`env-flap-wrap ${isOpened ? 'flap-opened' : ''}`}>
            <div className="env-flap-front" />
            <div className="env-flap-back" />
          </div>

          {/* Envelope Body Clip (cuts rising card) */}
          <div className="env-clip absolute inset-0 rounded-2xl overflow-hidden shadow-2xl z-10">
            <div className="env-body absolute inset-0 bg-gradient-to-br from-[#4C0519] via-[#881337] to-[#9F1239]">
              <div className="env-pattern absolute inset-0" />
              <div className="env-left-flap" />
              <div className="env-right-flap" />
              <div className="env-bottom-flap" />
            </div>

            {/* Micro Card that Slides/Rises Up */}
            <div className={`mini-card ${isOpened ? 'card-rising' : ''}`}>
              <div className="mini-card-inner flex flex-col items-center justify-center h-full p-4.5 text-center">
                <p className="mini-card-title font-garamond text-[11px] italic text-[#999] tracking-wider mb-1">
                  Trân trọng kính mời
                </p>
                <div className="mini-card-name font-dancing text-2xl md:text-[26px] font-bold text-[#E11D48] mb-1.5 max-w-[270px] leading-tight break-words">
                  {displayGuest}
                </div>
                <div className="mini-couple font-garamond text-base md:text-[17px] font-bold text-gray-800 tracking-wider">
                  {shortPair}
                </div>
                <div className="mini-flower text-lg text-[#C5A059] mt-1.5 animate-spin-slow">
                  ✿
                </div>
              </div>
            </div>
          </div>

          {/* 3D Wax Seal button with hover effects & initials */}
          <button
            onClick={handleOpen}
            className={`seal3d ${isOpened ? 'seal-open' : ''}`}
            title="Nhấn vào đây để mở thiệp"
            disabled={isOpened}
          >
            <div className="seal-ring" />
            <span className="seal-inner relative text-xs md:text-sm font-bold tracking-widest text-[#3A2206] shadow-sm z-10 font-garamond">
              {initials}
            </span>
            <div className="tap-hint absolute -bottom-9 left-1/2 -translate-x-1/2 text-xl pointer-events-none line-none">
              <span className="text-[#C5A059] block drop-shadow-md">☝</span>
            </div>
          </button>
        </div>
      </div>

      {/* Decorative Invitee Names outside */}
      <div className="envelope-invite-text text-center transition-all duration-[600ms] ease-in-out">
        <p className="env-title font-garamond text-base md:text-lg italic text-[#665C4E] mb-1">
          Trân trọng kính mời
        </p>
        <div className="env-guest-name font-dancing text-3xl md:text-4xl font-bold text-[#E11D48] leading-snug drop-shadow-sm px-4">
          {displayGuest}
        </div>
      </div>

      <p className="tap-label font-garamond text-xs md:text-sm italic text-[#8A7A65] mt-3.5 tracking-wide animate-pulse">
        Nhấn vào con dấu sáp để mở thiệp cưới
      </p>
    </div>
  );
}
