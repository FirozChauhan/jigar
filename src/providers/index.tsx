"use client";

import { AuthProvider } from "./auth-provider";
import { PlayerProvider } from "./player-provider";

export function Providers({
  children,
  initialAuthenticated = false,
}: {
  children: React.ReactNode;
  initialAuthenticated?: boolean;
}) {
  return (
    <AuthProvider initialAuthenticated={initialAuthenticated}>
      <PlayerProvider>{children}</PlayerProvider>
    </AuthProvider>
  );
}