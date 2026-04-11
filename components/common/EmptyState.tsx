export function EmptyState({ message, icon = '📭' }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 opacity-60">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-muted">{message}</p>
    </div>
  );
}
