"use client";

import type { Schedule, ChannelType } from "@/types";

interface ScheduleRow {
  schedule: Schedule;
  output: { channel: ChannelType } | null;
  project: { title: string } | null;
}

interface CalendarWeekViewProps {
  rows: ScheduleRow[];
  weekStart: Date;
}

// Hours displayed: 07:00 – 22:00
const HOUR_START = 7;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

// Day labels Mon–Sun (weekStart is Monday)
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Colour-coded pills per channel (solid, per TASK-74 spec)
const PILL_COLORS: Record<ChannelType, string> = {
  facebook: "bg-blue-600 text-white",
  tiktok:   "bg-red-500 text-white",
  instagram: "bg-orange-500 text-white",
  linkedin: "bg-blue-900 text-white",
  twitter:  "bg-slate-700 text-white",
};

function truncate(str: string, max: number) {
  return str.length <= max ? str : str.slice(0, max) + "…";
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function CalendarWeekView({ rows, weekStart }: CalendarWeekViewProps) {
  const weekEnd = addDays(weekStart, 7);

  // Filter schedules that fall within this week and within display hours
  const visible = rows.filter(({ schedule }) => {
    const d = new Date(schedule.scheduledAt);
    const hour = d.getHours();
    return d >= weekStart && d < weekEnd && hour >= HOUR_START && hour <= HOUR_END;
  });

  // Day-of-week: Mon=0 … Sun=6
  function dayIndex(date: Date) {
    const day = date.getDay(); // 0=Sun,1=Mon,...,6=Sat
    return day === 0 ? 6 : day - 1;
  }

  // gridRow: header is row 1, HOUR_START is row 2, HOUR_START+1 is row 3, etc.
  function rowFor(hour: number) {
    return hour - HOUR_START + 2;
  }

  // gridColumn: hour label col is 1, Mon=2 … Sun=8
  function colFor(date: Date) {
    return dayIndex(date) + 2;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
      {/* CSS grid: hour label column (3rem) + 7 equal day columns */}
      <div
        className="grid min-w-[600px]"
        style={{
          gridTemplateColumns: "3rem repeat(7, 1fr)",
          gridTemplateRows: `2rem repeat(${HOURS.length}, 3rem)`,
        }}
      >
        {/* ── Header row ── */}
        {/* Empty top-left cell */}
        <div className="border-b border-r border-slate-800 bg-slate-900" style={{ gridRow: 1, gridColumn: 1 }} />

        {DAY_LABELS.map((label, i) => {
          const dayDate = addDays(weekStart, i);
          const isToday =
            dayDate.toDateString() === new Date().toDateString();
          return (
            <div
              key={label}
              style={{ gridRow: 1, gridColumn: i + 2 }}
              className={`border-b border-r border-slate-800 flex items-center justify-center gap-1.5 px-1 ${
                isToday ? "bg-indigo-900/30" : "bg-slate-900"
              }`}
            >
              <span className={`text-xs font-medium ${isToday ? "text-indigo-300" : "text-slate-400"}`}>
                {label}
              </span>
              <span className={`text-xs ${isToday ? "text-indigo-400 font-semibold" : "text-slate-600"}`}>
                {dayDate.getDate()}
              </span>
            </div>
          );
        })}

        {/* ── Hour rows ── */}
        {HOURS.map((hour) => (
          <>
            {/* Hour label */}
            <div
              key={`label-${hour}`}
              style={{ gridRow: rowFor(hour), gridColumn: 1 }}
              className="border-b border-r border-slate-800 flex items-start justify-end pr-1.5 pt-0.5"
            >
              <span className="text-[10px] text-slate-600 leading-none">
                {String(hour).padStart(2, "0")}:00
              </span>
            </div>

            {/* 7 day cells for this hour */}
            {Array.from({ length: 7 }, (_, dayIdx) => (
              <div
                key={`cell-${hour}-${dayIdx}`}
                style={{ gridRow: rowFor(hour), gridColumn: dayIdx + 2 }}
                className="border-b border-r border-slate-800/60 relative"
              />
            ))}
          </>
        ))}

        {/* ── Schedule pills (absolutely positioned within grid cells) ── */}
        {visible.map(({ schedule, output, project }) => {
          const d = new Date(schedule.scheduledAt);
          const channel = (schedule.platform ?? output?.channel ?? "facebook") as ChannelType;
          const title = project?.title ?? "Untitled";
          const gridRow = rowFor(d.getHours());
          const gridCol = colFor(d);
          const minuteOffset = d.getMinutes() / 60; // 0–1 within the hour cell

          return (
            <div
              key={schedule.$id}
              style={{
                gridRow,
                gridColumn: gridCol,
                paddingTop: `${minuteOffset * 3}rem`,
              }}
              className="relative z-10 px-0.5 pt-0.5"
            >
              <div
                title={`${title} — ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-snug truncate cursor-default ${
                  PILL_COLORS[channel] ?? "bg-slate-600 text-white"
                }`}
              >
                {truncate(title, 20)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="py-6 text-center text-xs text-slate-600">
          No scheduled posts this week (07:00–22:00)
        </div>
      )}
    </div>
  );
}
