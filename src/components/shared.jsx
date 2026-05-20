import React from "react";
import { X } from "lucide-react";

export function AppFontStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap');

      * {
        font-family: Comfortaa, ui-rounded, system-ui, sans-serif !important;
      }

      .input {
        margin-top: .25rem;
        width: 100%;
        border-radius: 1rem;
        border: 1px solid #D8D2C6;
        background: #FFFDF8;
        padding: .75rem 1rem;
        font-size: .875rem;
        outline: none;
      }

      .input:focus {
        box-shadow: 0 0 0 2px rgba(143,161,115,.25);
      }

      .label {
        display: block;
        font-size: .72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .04em;
        color: #8A8175;
      }

      @keyframes camelioFloatBubble {
        0% { transform: translate3d(0, 0, 0) scale(1); }
        50% { transform: translate3d(18px, -28px, 0) scale(1.04); }
        100% { transform: translate3d(0, 0, 0) scale(1); }
      }

      .camelio-floating-bubble {
        animation-name: camelioFloatBubble;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
      }
    `}</style>
  );
}

export function FloatingBubbles() {
  const bubbles = [
    { size: 120, top: "8%", left: "8%", color: "#EAA5AF", delay: "0s", duration: "52s" },
    { size: 86, top: "18%", left: "78%", color: "#B5A7C8", delay: "4s", duration: "58s" },
    { size: 64, top: "42%", left: "4%", color: "#A8B193", delay: "8s", duration: "54s" },
    { size: 96, top: "62%", left: "82%", color: "#A2BADF", delay: "2s", duration: "62s" },
    { size: 52, top: "78%", left: "18%", color: "#EEC988", delay: "10s", duration: "50s" },
    { size: 140, top: "84%", left: "66%", color: "#F0E5D7", delay: "6s", duration: "68s" },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {bubbles.map((bubble, index) => (
        <span
          key={index}
          className="camelio-floating-bubble absolute rounded-full blur-[1px]"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            top: bubble.top,
            left: bubble.left,
            backgroundColor: bubble.color,
            opacity: 0.16,
            animationDelay: bubble.delay,
            animationDuration: bubble.duration,
          }}
        />
      ))}
    </div>
  );
}

export function SectionTitle({ title, subtitle, icon: Icon }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="rounded-2xl bg-[#A8B193] p-3 text-white shadow-sm ring-1 ring-[#DDE4D2]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#55534C]">{title}</h2>
        <p className="text-sm leading-5 text-[#746F64]">{subtitle}</p>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
      <p className="label">{label}</p>
      <p className="mt-1 font-bold text-[#55534C]">{value}</p>
    </div>
  );
}

export function Popup({ title, kicker, close, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 px-3 py-4 backdrop-blur-sm md:items-center">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-[2rem] bg-white shadow-2xl md:max-w-[560px]">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#A8B193]">{kicker}</p>
              <h3 className="mt-1 text-xl font-bold text-[#55534C]">{title}</h3>
            </div>
            <button type="button" onClick={close} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F8F3EA] text-[#746F64]">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
