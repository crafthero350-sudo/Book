import { useMemo } from "react";
import { generateActivityData } from "@/data/mockData";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const levelColors = [
  "bg-activity-none",
  "bg-activity-low",
  "bg-activity-medium",
  "bg-activity-high",
  "bg-activity-max",
];

export function ActivityGraph() {
  const data = useMemo(() => generateActivityData(), []);
  const weeks: typeof data[] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const totalDays = data.filter((d) => d.level > 0).length;

  return (
    <div className="px-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="section-title">Reading Activity</h3>
        <span className="text-xs text-muted-foreground">{totalDays} active days</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <Tooltip key={di}>
                  <TooltipTrigger asChild>
                    <div className={`w-3 h-3 rounded-[2px] ${levelColors[day.level]} transition-colors`} />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {day.date}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {levelColors.map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}
