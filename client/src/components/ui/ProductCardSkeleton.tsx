export default function ProductCardSkeleton() {
  return (
    <div className="card p-3 animate-pulse">
      <div className="bg-gray-200 rounded-xl aspect-square mb-3" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-5 bg-gray-200 rounded w-2/3" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  )
}
