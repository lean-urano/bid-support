"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function WorkspaceUrlSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    const embedded = window.parent !== window;
    setIsEmbedded(embedded);
    if (!embedded) return;
    window.parent.postMessage({ type: "workspace-preview-url", url: window.location.href }, "*");
  }, [pathname, searchParams]);

  const refreshWorkspace = () => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("_workspaceRefresh", Date.now().toString());
    window.location.assign(`${pathname}?${nextSearchParams.toString()}`);
  };

  if (!isEmbedded) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={refreshWorkspace}
        className="bg-background/95 shadow-lg backdrop-blur"
      >
        <RefreshCw aria-hidden="true" />
        最新の表示に更新
      </Button>
    </div>
  );
}
