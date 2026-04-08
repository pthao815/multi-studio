interface TopBarProps {
  displayName: string;
}

export default function TopBar({ displayName }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="text-sm font-medium text-gray-700">
        {displayName || "Welcome"}
      </div>
    </header>
  );
}
