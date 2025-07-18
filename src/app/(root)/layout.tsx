'use client'

import Navbar from "@/components/Navbar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full h-full">
        <Navbar />
        <div className="w-full h-[85vh]">
            {children}
        </div>
    </div>
  )
}