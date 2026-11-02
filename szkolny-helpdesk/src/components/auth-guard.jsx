"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";

export function AuthGuard({ role, children }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const allowed = user && (!role || user.role === role);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (!allowed) router.replace("/tickets");
  }, [ready, user, allowed, router]);

  return allowed ? children : null;
}