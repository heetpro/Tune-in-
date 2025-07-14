import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import "./globals.css";
import ClientAuthDebug from "@/components/ClientAuthDebug";
import SocketDebug from "@/components/SocketDebug";




export const metadata: Metadata = {
  title: "SpotiLove | Music Dating App",
  description: "Find friends and dates with similar music taste",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` bg-white antialiased`}
      >
        <AuthProvider>
          <SocketProvider >
            {children}
            <ClientAuthDebug />
            <SocketDebug />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
