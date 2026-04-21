import type { Metadata } from "next";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React from "react";
import "./globals.css";

import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "VPH STORE",
  description: "Project TTCS: Xây dựng website bán laptop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy"}>
          <Providers>
            {children}
          </Providers>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}