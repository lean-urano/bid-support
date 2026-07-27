"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function WorkspaceUrlSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (window.parent === window) return;
    window.parent.postMessage({ type: "workspace-preview-url", url: window.location.href }, "*");
  }, [pathname, searchParams]);

  return null;
}
