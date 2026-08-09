"use client";

// App shell: decides between the login screen, the fixed-height app layout
// (home + playlists) and the scrolling layout (search).
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { usePlayer } from "@/providers/player-provider";
import { Header } from "./header";
import { Footer } from "./footer";
import { PlayerBar } from "./player-bar";
import { LoginView } from "./login-view";
import { Preconnect } from "./preconnect";
import { GlowBlobs } from "./glow-blobs";
import { LoadingDots } from "./ui-state";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const { song } = usePlayer();

  const isFixedView = pathname === "/" || pathname?.startsWith("/playlist");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-muted">
          <LoadingDots />
          <span className="label">Loading</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  /* Fixed app view (home + playlist pages): fixed viewport height, no page
     scroll; contents scroll privately inside their own regions. */
  if (isFixedView) {
    return (
      <div className="relative flex h-dvh flex-col overflow-hidden">
        <Preconnect />
        <GlowBlobs />
        <Header />
        <main
          key={pathname}
          className="relative z-10 mx-auto min-h-0 w-full max-w-[1152px] flex-1 animate-rise overflow-hidden"
        >
          {children}
        </main>
        <Footer />
        <PlayerBar />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-clip">
      <Preconnect />
      <GlowBlobs />
      <Header />
      <main
          key={pathname}
          className={`relative z-10 mx-auto w-full max-w-[1152px] flex-1 animate-rise px-4 pt-8 transition-[padding] duration-300 sm:px-6 ${
          song ? "pb-40" : "pb-12"
        }`}
      >
        {children}
      </main>
      <Footer />
      <PlayerBar />
    </div>
  );
}