'use client'

export default function AdminHeader({ title }: { title: string }) {
  return (
    <div className="bg-base-200 shadow-sm border-b border-base-300 px-6 py-4">
      <h2 className="text-2xl font-semibold text-primary">{title}</h2>
    </div>
  )
}
