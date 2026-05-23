import type { ElementType } from '../types';

const EL_COLORS: Record<ElementType, string> = {
  fire:  '#ff6b35', water: '#45b7d1', wood:  '#7ed56f',
  earth: '#f5a623', metal: '#b0b8c4', dark:  '#a55eea', light: '#ffd700',
};

interface ChibiProps {
  emoji: string;
  element: ElementType;
  size?: number;
  evoStage?: number;
  className?: string;
}

export default function Chibi({ emoji, element, size = 56, evoStage = 0, className = '' }: ChibiProps) {
  const color = EL_COLORS[element];
  const glowSize = size * 0.7;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '12px',
        background: `radial-gradient(circle at 60% 35%, ${color}22, ${color}08)`,
        border: `1.5px solid ${color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.52,
        position: 'relative',
        flexShrink: 0,
        boxShadow: `0 0 ${glowSize * 0.5}px ${color}30`,
      }}
    >
      {emoji}
      {evoStage >= 2 && (
        <span style={{
          position: 'absolute',
          top: -4,
          right: -4,
          fontSize: 11,
          background: '#ff6b9d',
          borderRadius: '50%',
          width: 16,
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid #0b1120',
        }}>★</span>
      )}
      {evoStage === 1 && (
        <span style={{
          position: 'absolute',
          top: -4,
          right: -4,
          fontSize: 10,
          background: '#a55eea',
          borderRadius: '50%',
          width: 15,
          height: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid #0b1120',
        }}>◆</span>
      )}
    </div>
  );
}
