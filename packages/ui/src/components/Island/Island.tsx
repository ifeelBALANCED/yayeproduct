'use client';

// Я-острів — нічна атмосферна версія, 4 шари = 4 ФМ.
// Стилістика: indie-ілюстрація під впливом cinematic-арту, але БЕЗ
// кіберпанкових неонів — продуктова палітра warm-earth + soft glow.
//
// Принципово (з канону Demo Day v2.1):
// — Шари не підсвічуються «під користувача». Острів — модель, не зчитування.
// — Hover/tap на шар — tooltip-панель з shortText під SVG.

import { useState, useCallback } from 'react';
import { ISLAND_LAYERS, type IslandVariant } from './island.types';

interface IslandProps {
  variant?: IslandVariant;
  className?: string;
  'aria-label'?: string;
}

const DIMENSIONS: Record<IslandVariant, { maxW: number; viewBox: string }> = {
  hero:      { maxW: 480, viewBox: '0 0 480 600' },
  mini:      { maxW: 240, viewBox: '0 0 480 600' },
  explainer: { maxW: 360, viewBox: '0 0 480 600' },
};

const STARS: ReadonlyArray<readonly [number, number, number, number]> = [
  [60, 50, 1.2, 0.9], [140, 30, 0.8, 0.7], [210, 75, 1.0, 0.85],
  [290, 45, 1.4, 0.95], [360, 65, 0.9, 0.7], [420, 35, 1.1, 0.8],
  [105, 110, 0.7, 0.55], [195, 130, 0.9, 0.65], [370, 145, 1.0, 0.7],
  [435, 95, 0.8, 0.6], [25, 95, 0.9, 0.5], [320, 110, 0.7, 0.5],
  [85, 175, 0.8, 0.55], [255, 185, 1.0, 0.7], [410, 200, 0.9, 0.6],
];

export function Island({
  variant = 'hero',
  className = '',
  'aria-label': ariaLabel = 'Я-острів: 4 шари переживання',
}: IslandProps) {
  const { maxW, viewBox } = DIMENSIONS[variant];
  const interactive = variant !== 'mini';

  // fm = 1|2|3|4 або null (нічого не вибрано)
  const [activeFm, setActiveFm] = useState<1 | 2 | 3 | 4 | null>(null);

  const handleEnter = useCallback((fm: 1 | 2 | 3 | 4) => {
    if (interactive) setActiveFm(fm);
  }, [interactive]);

  const handleLeave = useCallback(() => {
    setActiveFm(null);
  }, []);

  const handleTap = useCallback((fm: 1 | 2 | 3 | 4) => {
    if (!interactive) return;
    setActiveFm((prev) => (prev === fm ? null : fm));
  }, [interactive]);

  const activeLayer = activeFm !== null
    ? ISLAND_LAYERS.find((l) => l.fm === activeFm) ?? null
    : null;

  return (
    <div style={{ maxWidth: `${maxW}px`, width: '100%' }}>
      <svg
        width="100%"
        height="auto"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
        className={`island-svg ${className}`}
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id="islandSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1F1B16" />
            <stop offset="55%"  stopColor="#3A2F25" />
            <stop offset="100%" stopColor="#5A5347" />
          </linearGradient>
          <linearGradient id="islandWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#5A5347" />
            <stop offset="100%" stopColor="#3A2F25" />
          </linearGradient>
          <linearGradient id="islandWaterAbs" x1="0" y1="430" x2="0" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#5A5347" />
            <stop offset="100%" stopColor="#3A2F25" />
          </linearGradient>
          <radialGradient id="islandNebula" cx="0.7" cy="0.25" r="0.35">
            <stop offset="0%"   stopColor="#D9A989" stopOpacity="0.15" />
            <stop offset="60%"  stopColor="#C28160" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#1F1B16" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="islandBeam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#FFF6DC" stopOpacity="0.65" />
            <stop offset="50%"  stopColor="#FFF6DC" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFF6DC" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="islandLampHalo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%"   stopColor="#FFE4A0" stopOpacity="0.8" />
            <stop offset="40%"  stopColor="#FFE4A0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFE4A0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="islandRock" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#A88E5C" />
            <stop offset="100%" stopColor="#5A4A2C" />
          </linearGradient>
          <linearGradient id="islandBeach" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7A8A6D" />
            <stop offset="100%" stopColor="#4A5A3F" />
          </linearGradient>
          <linearGradient id="islandMist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#D9D0BD" stopOpacity="0" />
            <stop offset="50%"  stopColor="#D9D0BD" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D9D0BD" stopOpacity="0" />
          </linearGradient>
          <filter id="islandSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Небо */}
        <rect width="480" height="430" fill="url(#islandSky)" />
        <rect width="480" height="430" fill="url(#islandNebula)" />

        {/* Зорі */}
        <g className="island-stars">
          {STARS.map(([x, y, r, op], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#F5EFE4" opacity={op} />
          ))}
        </g>

        {/* Вода */}
        <rect y="430" width="480" height="170" fill="url(#islandWater)" />
        <line x1="0" y1="430" x2="480" y2="430" stroke="#7A6F5C" strokeWidth="1" opacity="0.6" />
        <g opacity="0.35" fill="none" stroke="#D9D0BD" strokeWidth="0.7">
          <path d="M 0,475 Q 80,470 160,475 T 320,475 T 480,475" />
          <path d="M 0,505 Q 80,500 160,505 T 320,505 T 480,505" />
          <path d="M 0,535 Q 80,530 160,535 T 320,535 T 480,535" />
          <path d="M 0,565 Q 80,560 160,565 T 320,565 T 480,565" />
        </g>

        {/* Шар 1 · Берег (ФМ1) */}
        <g
          className="island-layer island-layer--beach"
          data-fm="1"
          style={{ cursor: interactive ? 'pointer' : undefined, opacity: activeFm && activeFm !== 1 ? 0.55 : 1, transition: 'opacity 200ms ease' }}
          onMouseEnter={() => handleEnter(1)}
          onMouseLeave={handleLeave}
          onClick={() => handleTap(1)}
          aria-label={`${ISLAND_LAYERS[0]!.metaphor}: ${ISLAND_LAYERS[0]!.shortText}`}
        >
          <path d="M 50,475 Q 70,485 110,485 Q 200,488 290,485 Q 360,482 420,475 Q 430,465 425,455 L 55,455 Q 45,465 50,475 Z" fill="#4A5A3F" />
          <path d="M 55,455 Q 75,425 130,415 Q 200,405 280,408 Q 355,415 405,425 Q 425,440 425,455 Z" fill="url(#islandBeach)" />
        </g>

        {/* Шар 2 · Бухта (ФМ2) */}
        <g
          className="island-layer island-layer--bay"
          data-fm="2"
          style={{ cursor: interactive ? 'pointer' : undefined, opacity: activeFm && activeFm !== 2 ? 0.55 : 1, transition: 'opacity 200ms ease' }}
          onMouseEnter={() => handleEnter(2)}
          onMouseLeave={handleLeave}
          onClick={() => handleTap(2)}
          aria-label={`${ISLAND_LAYERS[1]!.metaphor}: ${ISLAND_LAYERS[1]!.shortText}`}
        >
          <path d="M 70,465 Q 85,448 115,442 Q 150,440 170,452 Q 175,464 162,472 Q 130,478 95,476 Q 75,473 70,465 Z" fill="url(#islandWaterAbs)" />
          <ellipse cx="125" cy="458" rx="35" ry="6" fill="#D9A989" opacity="0.18" />
          <path d="M 90,455 Q 115,453 145,455" stroke="#D9D0BD" strokeWidth="0.6" fill="none" opacity="0.5" />
          <path d="M 95,463 Q 120,461 150,463" stroke="#D9D0BD" strokeWidth="0.5" fill="none" opacity="0.4" />
          <path d="M 100,470 Q 125,468 152,470" stroke="#D9D0BD" strokeWidth="0.4" fill="none" opacity="0.3" />
        </g>

        {/* Шар 3 · Скеля (ФМ3) */}
        <g
          className="island-layer island-layer--rock"
          data-fm="3"
          style={{ cursor: interactive ? 'pointer' : undefined, opacity: activeFm && activeFm !== 3 ? 0.55 : 1, transition: 'opacity 200ms ease' }}
          onMouseEnter={() => handleEnter(3)}
          onMouseLeave={handleLeave}
          onClick={() => handleTap(3)}
          aria-label={`${ISLAND_LAYERS[2]!.metaphor}: ${ISLAND_LAYERS[2]!.shortText}`}
        >
          <path d="M 165,440 L 175,400 L 195,395 L 210,420 L 200,440 Z" fill="#5A4A2C" opacity="0.9" />
          <path d="M 290,440 L 300,405 L 320,402 L 330,425 L 320,440 Z" fill="#5A4A2C" opacity="0.9" />
          <path d="M 195,425 L 215,355 L 240,300 L 268,308 L 295,360 L 305,400 L 295,430 L 210,432 Z" fill="url(#islandRock)" />
          <path d="M 240,300 L 268,308 L 295,360 L 280,368 L 250,338 Z" fill="#3A2F25" opacity="0.7" />
          <path d="M 215,355 L 240,300 L 250,338 L 232,365 Z" fill="#D4BD8F" opacity="0.55" />
          <path d="M 250,318 L 250,360 L 245,395" stroke="#1F1B16" strokeWidth="0.8" fill="none" opacity="0.5" />
          <path d="M 225,380 L 230,410" stroke="#1F1B16" strokeWidth="0.6" fill="none" opacity="0.4" />
          <path d="M 275,375 L 278,415" stroke="#1F1B16" strokeWidth="0.6" fill="none" opacity="0.4" />
          <path d="M 220,400 Q 240,395 270,400" stroke="#A88E5C" strokeWidth="1" fill="none" opacity="0.6" />
        </g>

        {/* Шар 4 · Маяк (ФМ4) */}
        <g
          className="island-layer island-layer--lighthouse"
          data-fm="4"
          style={{ cursor: interactive ? 'pointer' : undefined, opacity: activeFm && activeFm !== 4 ? 0.55 : 1, transition: 'opacity 200ms ease' }}
          onMouseEnter={() => handleEnter(4)}
          onMouseLeave={handleLeave}
          onClick={() => handleTap(4)}
          aria-label={`${ISLAND_LAYERS[3]!.metaphor}: ${ISLAND_LAYERS[3]!.shortText}`}
        >
          <g className="island-layer__beam">
            <path d="M 250,212 L 60,150 L 60,275 Z" fill="url(#islandBeam)" filter="url(#islandSoftGlow)" opacity="0.7" />
            <path d="M 250,212 L 95,170 L 95,255 Z" fill="url(#islandBeam)" opacity="0.85" />
          </g>
          <circle cx="250" cy="212" r="22" fill="url(#islandLampHalo)" />
          <rect x="232" y="297" width="36" height="8" fill="#1F1B16" />
          <path d="M 240,297 L 244,232 L 256,232 L 260,297 Z" fill="#E8D5B7" />
          <rect x="241" y="240" width="18" height="6" fill="#8C7A4A" />
          <rect x="241" y="262" width="18" height="6" fill="#8C7A4A" />
          <rect x="241" y="284" width="18" height="6" fill="#8C7A4A" />
          <path d="M 253,232 L 256,232 L 260,297 L 256,297 Z" fill="#000" opacity="0.25" />
          <rect x="247" y="252" width="6" height="2" fill="#FFE4A0" opacity="0.9" />
          <rect x="247" y="274" width="6" height="2" fill="#FFE4A0" opacity="0.9" />
          <rect x="237" y="220" width="26" height="6" fill="#1F1B16" />
          <g fill="#3A2F25">
            <rect x="239" y="220" width="1" height="6" />
            <rect x="243" y="220" width="1" height="6" />
            <rect x="247" y="220" width="1" height="6" />
            <rect x="251" y="220" width="1" height="6" />
            <rect x="255" y="220" width="1" height="6" />
            <rect x="259" y="220" width="1" height="6" />
          </g>
          <rect x="243" y="205" width="14" height="15" fill="#1F1B16" />
          <rect x="245" y="207" width="10" height="11" fill="#FFF6DC" />
          <ellipse cx="250" cy="212" rx="4" ry="3.5" fill="#FFE4A0" />
          <path d="M 240,205 L 250,190 L 260,205 Z" fill="#1F1B16" />
          <path d="M 246,205 L 250,193 L 254,205 Z" fill="#3A2F25" />
          <line x1="250" y1="190" x2="250" y2="182" stroke="#1F1B16" strokeWidth="1.5" />
          <circle cx="250" cy="181" r="1.5" fill="#1F1B16" />
        </g>

        {/* Туман */}
        <g opacity="0.7">
          <rect x="0" y="420" width="480" height="40" fill="url(#islandMist)" />
        </g>

        {/* Відблиск маяка у воді */}
        <g>
          <ellipse cx="250" cy="478" rx="16" ry="2"   fill="#FFE4A0" opacity="0.30" />
          <ellipse cx="250" cy="488" rx="14" ry="1.6" fill="#FFE4A0" opacity="0.22" />
          <ellipse cx="250" cy="498" rx="12" ry="1.4" fill="#FFE4A0" opacity="0.17" />
          <ellipse cx="250" cy="510" rx="10" ry="1.2" fill="#FFE4A0" opacity="0.12" />
          <ellipse cx="250" cy="523" rx="8"  ry="1"   fill="#FFE4A0" opacity="0.08" />
        </g>

        {/* CSS-анімації */}
        <style>{`
          .island-layer { transform-origin: center; }
          @media (prefers-reduced-motion: no-preference) {
            .island-layer--beach      { animation: islandFadeUp 700ms ease-out 0ms   both; }
            .island-layer--bay        { animation: islandFadeUp 700ms ease-out 200ms both; }
            .island-layer--rock       { animation: islandFadeUp 700ms ease-out 400ms both; }
            .island-layer--lighthouse { animation: islandFadeUp 700ms ease-out 600ms both; }
            .island-layer__beam       { animation: islandBeamPulse 8s ease-in-out 1200ms infinite; transform-origin: 250px 212px; }
            .island-stars circle      { animation: islandStarTwinkle 4s ease-in-out infinite; }
            .island-stars circle:nth-child(2n)  { animation-delay: 1.2s; }
            .island-stars circle:nth-child(3n)  { animation-delay: 2.4s; }
            .island-stars circle:nth-child(5n)  { animation-delay: 0.8s; }
            @keyframes islandFadeUp {
              from { opacity: 0; transform: translateY(8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes islandBeamPulse {
              0%, 100% { opacity: 0.85; }
              50%      { opacity: 1; }
            }
            @keyframes islandStarTwinkle {
              0%, 100% { opacity: 1; }
              50%      { opacity: 0.4; }
            }
          }
        `}</style>
      </svg>

      {/* Tooltip-панель під островом — з'являється при hover/tap */}
      {interactive && (
        <div
          style={{
            minHeight: '3.5rem',
            transition: 'opacity 180ms ease',
            opacity: activeLayer ? 1 : 0,
            pointerEvents: activeLayer ? 'auto' : 'none',
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {activeLayer && (
            <div
              style={{
                marginTop: '12px',
                borderRadius: '16px',
                border: '1px solid #D9D0BD',
                background: '#EDE5D6',
                padding: '12px 16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              {/* FM номер */}
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#C28160',
                  paddingTop: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                фм{activeLayer.fm}
              </span>
              <div>
                {/* Назва шару */}
                <p
                  style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontStyle: 'italic',
                    fontSize: '16px',
                    color: '#1F1B16',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {activeLayer.metaphor} · {activeLayer.name}
                </p>
                {/* Короткий текст */}
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: '#5A5347',
                    margin: '4px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  {activeLayer.shortText}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
