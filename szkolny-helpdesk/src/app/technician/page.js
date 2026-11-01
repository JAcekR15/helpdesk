"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/lib/useAuth";
import { ROOMS, PRIORITIES, STATUSES, selectClass } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

function TicketRow({ ticket, onChanged }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function changeStatus(newStatus) {
    if (newStatus === ticket.status) return;
    setBusy(true);
    try {
      await pb.collection("tickets").update(ticket.id, { status: newStatus });
      await pb.collection("ticket_events").create({
        ticket: ticket.id,
        user: pb.authStore.record.id,
        from_status: ticket.status,
        to_status: newStatus,
        comment,
      });
      setComment("");
      onChanged();
    } catch (e) {
      alert("Nie udało się zmienić statusu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{ticket.title}</TableCell>
      <TableCell>{ticket.expand?.author?.email}</TableCell>
      <TableCell>{ticket.room}</TableCell>
      <TableCell>{ticket.category}</TableCell>
      <TableCell>{ticket.priority}</TableCell>
      <TableCell><Badge>{ticket.status}</Badge></TableCell>
      <TableCell className="min-w-56 space-y-2">
        <select
          className={selectClass}
          value={ticket.status}
          disabled={busy}
          onChange={(e) => changeStatus(e.target.value)}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Input
          placeholder="Komentarz (opcjonalnie)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </TableCell>
    </TableRow>
  );
}

export default function TechnicianPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({ status: "", room: "", priority: "" });

  const load = useCallback(async () => {
    const parts = [];
    const params = {};
    if (filters.status) { parts.push("status = {:status}"); params.status = filters.status; }
    if (filters.room) { parts.push("room = {:room}"); params.room = filters.room; }
    if (filters.priority) { parts.push("priority = {:priority}"); params.priority = filters.priority; }

    const list = await pb.collection("tickets").getFullList({
      filter: parts.length ? pb.filter(parts.join(" && "), params) : "",
      sort: "-created",
      expand: "author",
    });
    setTickets(list);
  }, [filters]);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "technician") { router.push("/tickets"); return; }
    load();
  }, [ready, user, router, load]);

  if (!user || user.role !== "technician") return null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Panel technika</h1>
        <Button
          variant="outline"
          onClick={() => { pb.authStore.clear(); router.push("/login"); }}
        >
          Wyloguj
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <select className={selectClass} value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Wszystkie statusy</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={selectClass} value={filters.room}
          onChange={(e) => setFilters({ ...filters, room: e.target.value })}>
          <option value="">Wszystkie sale</option>
          {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className={selectClass} value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">Wszystkie priorytety</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tytuł</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead>Priorytet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Zmień status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TicketRow key={t.id} ticket={t} onChanged={load} />
            ))}
          </TableBody>
        </Table>
        {tickets.length === 0 && <p className="p-4 text-sm">Brak zgłoszeń.</p>}
      </div>
    </div>
  );
}