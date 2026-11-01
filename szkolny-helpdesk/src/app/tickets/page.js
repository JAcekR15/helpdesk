"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TicketsPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.push("/login");
      return;
    }
    pb.collection("tickets")
      .getFullList({ sort: "-created" })
      .then(setTickets)
      .finally(() => setLoading(false));
  }, [ready, user, router]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Moje zgłoszenia</h1>
        <div className="flex gap-2">
          <Button asChild><Link href="/tickets/new">Nowe zgłoszenie</Link></Button>
          <Button
            variant="outline"
            onClick={() => { pb.authStore.clear(); router.push("/login"); }}
          >
            Wyloguj
          </Button>
        </div>
      </div>

      {loading && <p>Ładowanie...</p>}
      {!loading && tickets.length === 0 && <p>Nie masz jeszcze zgłoszeń.</p>}

      {tickets.map((t) => (
        <div key={t.id} className="border rounded-md p-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{t.title}</p>
            <Badge>{t.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.room} · {t.category} · priorytet: {t.priority}
          </p>
          <p className="text-sm">{t.description}</p>
          {t.photo && (
            <img
              src={pb.files.getURL(t, t.photo, { thumb: "300x300" })}
              alt="Zdjęcie usterki"
              className="max-h-40 rounded"
            />
          )}
        </div>
      ))}
    </div>
  );
}