export default function AppLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="h-6 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-10 w-40 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="h-32 rounded-2xl bg-muted animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}
