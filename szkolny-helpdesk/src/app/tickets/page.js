"use client";
import { useCallback, useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { AuthGuard } from "@/components/auth-guard";
import { TicketForm } from "@/components/ticket-form";
import { Badge } from "@/components/ui/badge";
import { STATUSES, labelOf } from "@/lib/constants";

export default function TicketsPage() {
  return <AuthGuard><MyTickets /></AuthGuard>;
}

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const load = useCallback(async () => {
    setTickets(await pb.collection("tickets").getFullList({ sort: "-created" }));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <h1 className="mb-4 text-2xl font-semibold">Nowe zgłoszenie</h1>
        <TicketForm onCreated={load} />
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-semibold">Moje zgłoszenia</h2>
        <ul className="space-y-2">
          {tickets.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-sm text-muted-foreground">Sala {t.room}</p>
              </div>
              <Badge>{labelOf(STATUSES, t.status)}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}