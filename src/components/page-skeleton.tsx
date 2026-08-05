/** Generic premium skeleton shown while a route's code/data loads. */
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-in fade-in duration-200">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton mt-3 h-4 w-72" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28 w-full" />
        ))}
      </div>
      <div className="skeleton mt-6 h-40 w-full" />
    </div>
  );
}
