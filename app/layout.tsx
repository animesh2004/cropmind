import type React from "react"
import type { Metadata } from "next"
import { PT_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const ptSans = PT_Sans({ weight: ["400", "700"], subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CropMind - Agriculture Dashboard",
  description: "Intelligent agriculture dashboard with real-time environmental insights",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ptSans.className} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
