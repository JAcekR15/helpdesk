"use client";
import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(pb.authStore.record);
    setReady(true);
    if (pb.authStore.isValid) {
      // odświeża token i rolę (gdyby superuser ją zmienił)
      pb.collection("users").authRefresh().catch(() => pb.authStore.clear());
    }
    return pb.authStore.onChange((_token, record) => setUser(record));
  }, []);

  return { user, ready };
}