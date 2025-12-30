
// Added React import to fix namespace errors
import React from 'react';
import { Drone, Survivor } from '../types.ts';

interface TacticalMapProps {
  drones: Drone[];
  survivors: Survivor[];
  selectedDroneId: string | null;
  onSelectDrone: (id: string) => void;
  onMapClick: (x: number, y: number) => void;
  onDeploy: (survivor: Survivor) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({ 
  drones, 
  survivors, 
  selectedDroneId, 
  onSelectDrone, 
  onMapClick,
  onDeploy
}) => {
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursor = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    if (e.target === svg || (e.target as any).tagName === 'rect') {
      onMapClick(cursor.x, cursor.y);
    }
  };

  return (
    <div className="w-full h-full relative group bg-[#01040d]">
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full cursor-crosshair transition-all duration-700"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        onClick={handleSvgClick}
      >
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(30, 58, 138, 0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="criticalSignal">
            <stop offset="0%" stopColor="rgba(239,68,68,0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="friendlyGlow">
            <stop offset="0%" stopColor="rgba(34,197,94,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect width="100" height="100" fill="#020617" />
        <rect width="100" height="100" fill="url(#mapGlow)" />
        
        {/* Trail Breadcrumbs */}
        {drones.map(d => d.trail.map((p, i) => (
          <circle key={`trail-${d.id}-${i}`} cx={p.x} cy={p.y} r="0.18" fill="#3b82f6" opacity={p.opacity * 0.3} />
        )))}

        {/* Survivors / Targets / Friendlies */}
        {survivors.map((s) => {
          const isSOS = s.signalType === 'SOS';
          const isReached = s.isReached && !s.isFriendly;
          const isFriendly = s.isFriendly;
          const color = isFriendly ? '#22c55e' : isReached ? '#3b82f6' : isSOS ? '#ef4444' : '#eab308';

          return (
            <g key={s.id} className="transition-all duration-1000">
              {isSOS && <circle cx={s.x} cy={s.y} r="6" fill="url(#criticalSignal)" className="animate-pulse" />}
              {isFriendly && <circle cx={s.x} cy={s.y} r="4" fill="url(#friendlyGlow)" />}
              
              {/* Signal Symbol */}
              {isFriendly ? (
                <path d={`M ${s.x} ${s.y-1} L ${s.x+1} ${s.y+0.5} L ${s.x-1} ${s.y+0.5} Z`} fill={color} opacity="0.8" />
              ) : (
                <g transform={`translate(${s.x - 1}, ${s.y - 1})`}>
                   <rect x="0.7" y="0.2" width="0.6" height="1.6" fill={color} rx="0.1" opacity="0.9" />
                   <rect x="0.2" y="0.7" width="1.6" height="0.6" fill={color} rx="0.1" opacity="0.9" />
                </g>
              )}

              {/* Dynamic Range Pulse */}
              {!isFriendly && <circle cx={s.x} cy={s.y} r="3.5" fill="none" stroke={color} strokeWidth="0.1" className="ping" />}
              
              <text x={s.x} y={s.y - 3} textAnchor="middle" className="text-[2px] font-black mono uppercase italic" fill={color}>
                {isFriendly ? `BFT_${s.id}` : isReached ? 'LOCKED' : isSOS ? 'SOS_PRIORITY' : s.id}
              </text>
              
              {isReached && (
                 <g className="cursor-pointer group" onClick={(e) => { e.stopPropagation(); onDeploy(s); }}>
                    <rect x={s.x - 4} y={s.y + 3} width="8" height="2.5" rx="0.6" fill="#2563eb" className="group-hover:fill-blue-400 transition-colors" />
                    <text x={s.x} y={s.y + 4.7} textAnchor="middle" className="fill-white font-black text-[1.2px] uppercase tracking-tighter">DISPATCH</text>
                 </g>
              )}
            </g>
          );
        })}

        {/* Drone Fleet */}
        {drones.map((d) => {
          const isSelected = d.id === selectedDroneId;
          const lowBatt = d.battery < 15;
          const color = lowBatt ? '#ef4444' : isSelected ? '#fff' : '#3b82f6';
          
          return (
            <g key={d.id} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onSelectDrone(d.id); }}>
              {d.status === 'triangulating' && (
                <circle cx={d.x} cy={d.y} r="4" fill="none" stroke="#3b82f6" strokeWidth="0.05" strokeDasharray="0.2 0.2" className="animate-spin" style={{ animationDuration: '6s' }} />
              )}
              
              <path 
                d={`M ${d.x} ${d.y-1.2} L ${d.x+1.2} ${d.y+1} L ${d.x} ${d.y+0.5} L ${d.x-1.2} ${d.y+1} Z`}
                fill={color}
                className="transition-all"
                stroke={isSelected ? '#3b82f6' : 'none'}
                strokeWidth="0.15"
              />

              {isSelected && <circle cx={d.x} cy={d.y} r="5" fill="none" stroke="#3b82f6" strokeWidth="0.1" opacity="0.3" />}
              
              <text x={d.x} y={d.y - 2.5} textAnchor="middle" className={`text-[1.8px] font-black mono ${isSelected ? 'fill-white' : lowBatt ? 'fill-red-500' : 'fill-slate-500'}`}>
                {d.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
