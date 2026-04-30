"use client";

import type { ChannelType } from "@/types";

const TABS: { channel: ChannelType; label: string }[] = [
  { channel: "facebook", label: "Facebook" },
  { channel: "tiktok", label: "TikTok" },
  { channel: "instagram", label: "Instagram" },
  { channel: "linkedin", label: "LinkedIn" },
  { channel: "twitter", label: "Twitter / X" },
];

interface ChannelTabsProps {
  activeChannel: ChannelType;
  onChannelChange: (channel: ChannelType) => void;
}

export function ChannelTabs({ activeChannel, onChannelChange }: ChannelTabsProps) {
  return (
    <div className="flex gap-1 border-b border-slate-700">
      {TABS.map(({ channel, label }) => {
        const isActive = activeChannel === channel;
        return (
          <button
            key={channel}
            onClick={() => onChannelChange(channel)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              isActive
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
