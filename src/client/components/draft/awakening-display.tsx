import { AWAKENINGS } from "@shared/index";

const awakeningMap = new Map(AWAKENINGS.map((a) => [a.id, a]));

interface AwakeningDisplayProps {
  awakeningIds: [string, string];
}

export function AwakeningDisplay({ awakeningIds }: AwakeningDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="text-xs font-medium text-muted-foreground">
        Starting Awakenings:
      </span>
      <div className="flex gap-3">
        {awakeningIds.map((id) => {
          const awakening = awakeningMap.get(id);
          if (!awakening) return null;
          return (
            <div key={id} className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2 py-1">
              <div className="relative size-6 overflow-hidden rounded">
                <img
                  src={awakening.icon}
                  alt={awakening.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-medium">{awakening.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
