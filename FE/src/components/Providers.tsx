"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const appProviders = (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );

  if (!googleClientId) {
    return appProviders;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {appProviders}
    </GoogleOAuthProvider>
  );
}
