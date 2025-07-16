import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import "./globals.css";
import ClientAuthDebug from "@/components/ClientAuthDebug";
import SocketDebug from "@/components/SocketDebug";
import Header from "@/components/Header";


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
    <html lang="en" className={``}>
      <body
        className={` bg-white antialiased`}
      >
        <AuthProvider>
          <SocketProvider >
            <Header />
            
            {children}
            {/* <ClientAuthDebug />
            <SocketDebug /> */}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
