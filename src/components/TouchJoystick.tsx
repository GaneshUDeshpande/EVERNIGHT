import React, { useState, useRef, useEffect } from 'react';

interface TouchJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
}

export const TouchJoystick: React.FC<TouchJoystickProps> = ({ onMove }) => {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const radius = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    startPosRef.current = { x: cx, y: cy };
    setActive(true);

    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - startPosRef.current.x;
        const dy = touch.clientY - startPosRef.current.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= radius) {
          setPos({ x: dx, y: dy });
          onMove({ x: dx / radius, y: dy / radius });
        } else {
          const clampedX = (dx / dist) * radius;
          const clampedY = (dy / dist) * radius;
          setPos({ x: clampedX, y: clampedY });
          onMove({ x: clampedX / radius, y: clampedY / radius });
        }
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        setPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="pointer-events-auto fixed bottom-8 left-8 w-32 h-32 rounded-full bg-slate-900/60 border-2 border-slate-700/80 backdrop-blur-xs flex items-center justify-center touch-none z-30 select-none"
    >
      <div
        className="w-14 h-14 rounded-full bg-amber-400/80 border border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-transform duration-75"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
        }}
      />
    </div>
  );
};
