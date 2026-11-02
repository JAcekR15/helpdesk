"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { pb } from "@/lib/pocketbase";
import { AuthGuard } from "@/components/auth-guard";
import { STATUSES, ROOMS, PRIORITIES, CATEGORIES, labelOf } from "@/lib/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ALL = "all";

export default function TechnicianPage() {
  return <AuthGuard role="technik"><TicketsTable /></AuthGuard>;
}

function TicketsTable() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({ status: ALL, room: ALL, priority: ALL });

  const load = useCallback(async () => {
    const parts = Object.entries(filters)
      .filter(([, v]) => v !== ALL)
      .map(([k, v]) => pb.filter(`${k} = {:v}`, { v })); // bezpieczne podstawianie
    setTickets(
      await pb.collection("tickets").getFullList({
        sort: "-created",
        expand: "author",
        filter: parts.join(" && "),
      })
    );
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // REALTIME: każda zmiana w kolekcji odświeża listę
  useEffect(() => {
    pb.collection("tickets").subscribe("*", () => load());
    return () => { pb.collection("tickets").unsubscribe("*"); };
  }, [load]);

  const setFilter = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Wszystkie zgłoszenia</h1>
      <div className="flex flex-wrap gap-2">
        <FilterSelect label="Status" value={filters.status} onChange={setFilter("status")} options={STATUSES} />
        <FilterSelect label="Sala" value={filters.room} onChange={setFilter("room")} options={ROOMS} />
        <FilterSelect label="Priorytet" value={filters.priority} onChange={setFilter("priority")} options={PRIORITIES} />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tytuł</TableHead><TableHead>Sala</TableHead><TableHead>Kategoria</TableHead>
              <TableHead>Priorytet</TableHead><TableHead>Autor</TableHead><TableHead>Status i komentarz</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => <Row key={t.id} t={t} />)}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-44"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: wszystkie</SelectItem>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function Row({ t }) {
  const [status, setStatus] = useState(t.status);
  const [comment, setComment] = useState(t.technician_comment ?? "");

  useEffect(() => {
    setStatus(t.status);
    setComment(t.technician_comment ?? "");
  }, [t.status, t.technician_comment]);

  async function save() {
    try {
      await pb.collection("tickets").update(t.id, { status, technician_comment: comment });
      if (status !== t.status) {
        await pb.collection("ticket_events").create({
          ticket: t.id,
          user: pb.authStore.record.id,
          from_status: t.status,
          to_status: status,
        });
      }
      toast.success("Zapisano");
    } catch {
      toast.error("Nie udało się zapisać");
    }
  }

  return (
    <TableRow>
      <TableCell>{t.title}</TableCell>
      <TableCell>{t.room}</TableCell>
      <TableCell>{labelOf(CATEGORIES, t.category)}</TableCell>
      <TableCell>{labelOf(PRIORITIES, t.priority)}</TableCell>
      <TableCell>{t.expand?.author?.name ?? "—"}</TableCell>
      <TableCell>
        <div className="flex min-w-72 gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Komentarz" />
          <Button size="sm" onClick={save}>Zapisz</Button>
        </div>
      </TableCell>
    </TableRow>
  );
}