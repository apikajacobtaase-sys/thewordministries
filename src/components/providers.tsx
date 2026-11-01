"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

export default function Providers({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      {children}

      <Toaster
        position="top-center"
        richColors
        closeButton
        duration={3500}
        visibleToasts={4}
      />
    </SessionProvider>
  );
}
