'use client'

import Navbar from "@/components/Navbar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full h-full">
        <div className="w-full h-[100vh]">
            {children}
        </div>
    </div>
  )
}