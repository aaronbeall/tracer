import React from 'react';
import type { GoalHistory } from '@/lib/seriesStats';

interface GoalHabitStripProps {
  history: GoalHistory;
  color: string;
}

const formatRate = (rate: number | null): string => (rate === null ? '—' : `${Math.round(rate * 100)}%`);

const GoalHabitStrip: React.FC<GoalHabitStripProps> = ({ history, color }) => {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-[3px]">
        {history.days.map((day) => {
          if (day.met === null) {
            return (
              <span
                key={day.date}
                className="w-[5px] h-[5px] rounded-full bg-border shrink-0"
                title={day.date}
              />
            );
          }
          if (day.met) {
            return (
              <span
                key={day.date}
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{ backgroundColor: color }}
                title={day.date}
              />
            );
          }
          return (
            <span
              key={day.date}
              className="w-[7px] h-[7px] rounded-full border shrink-0"
              style={{ borderColor: color }}
              title={day.date}
            />
          );
        })}
      </div>
      <p className="font-mono text-[10px] text-muted-foreground mt-1.5 tracking-tight">
        {history.goalStreak > 0 ? `${history.goalStreak}-day streak` : 'No active streak'}
        {' · '}
        {formatRate(history.weekRate)} this week
        {' · '}
        {formatRate(history.monthRate)} this month
      </p>
    </div>
  );
};

export default GoalHabitStrip;
