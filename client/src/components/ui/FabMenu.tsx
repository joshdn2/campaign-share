import { useState } from "react";
import type { NodeType } from "../../types";

const NODE_TYPES: { type: NodeType; label: string; angle: number }[] = [
  { type: "ARC", label: "Arc", angle: 0 },
  { type: "SESSION", label: "Session", angle: 30 },
  { type: "CHARACTER", label: "Character", angle: 60 },
  { type: "CREATURE", label: "Creature", angle: 90 },
  { type: "ITEM", label: "Item", angle: 120 },
  { type: "LOCATION", label: "Location", angle: 150 },
  { type: "NOTE", label: "Note", angle: 180 },
];

interface FabMenuProps {
  onSelect: (type: NodeType) => void;
}

export function FabMenu({ onSelect }: FabMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative">
        {open && (
          <div className="absolute bottom-0 right-0">
            {NODE_TYPES.map(({ type, label, angle }) => {
              const rad = (angle * Math.PI) / 180;
              const distance = 140;
              const x = Math.cos(rad) * distance;
              const y = -Math.sin(rad) * distance;

              return (
                <button
                  key={type}
                  onClick={() => {
                    onSelect(type);
                    setOpen(false);
                  }}
                  className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-110"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    right: 0,
                    bottom: 0,
                  }}
                  title={label}
                >
                  {label.slice(0, 3)}
                </button>
              );
            })}
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          onMouseEnter={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-110"
        >
          {open ? "×" : "+"}
        </button>
      </div>
    </div>
  );
}
