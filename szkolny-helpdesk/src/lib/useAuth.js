"use client";
import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(pb.authStore.record);
    setReady(true);
    const unsubscribe = pb.authStore.onChange((token, record) => setUser(record));
    return () => unsubscribe();
  }, []);

  return { user, ready };
}