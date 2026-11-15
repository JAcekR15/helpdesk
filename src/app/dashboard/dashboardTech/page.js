"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CLOSED = "zakonczone"; // wpisz dokładnie tak, jak w PocketBase

const STATUSES = [
  { value: "nowe", label: "nowe" },
  { value: "w_realizacji", label: "w realizacji" },
  { value: CLOSED, label: "zakończone" },
];

const statusLabel = (value) =>
  STATUSES.find((s) => s.value === value)?.label ?? value;

const PRIORITY_ORDER = { niski: 0, sredni: 1, wysoki: 2 };
const STATUS_ORDER = { nowe: 0, w_realizacji: 1, [CLOSED]: 2 };

const SORT_VALUES = {
  title: (t) => t.title ?? "",
  description: (t) => t.description ?? "",
  classroom: (t) => t.classroom ?? "",
  category: (t) => t.category ?? "",
  priority: (t) => PRIORITY_ORDER[t.priority] ?? -1,
  author: (t) => t.expand?.author?.name ?? "",
  status: (t) => STATUS_ORDER[t.status] ?? -1,
  comment: (t) => t.technician_comment ?? "",
};

function compare(a, b) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pl", { numeric: true });
}

export default function DashboardTech() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [showClosed, setShowClosed] = useState(false);
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [openHistoryId, setOpenHistoryId] = useState(null);
  const [history, setHistory] = useState({}); // { [ticketId]: [zdarzenia] }

  // pierwsze pobranie listy
  useEffect(() => {
    if (!pb.authStore.isValid || pb.authStore.record?.role !== "technician") {
      router.push("/");
      return;
    }

    async function fetchData() {
      try {
        const records = await pb.collection("tickets").getFullList({
          sort: "-created",
          expand: "author",
          requestKey: null,
        });
        setTickets(records);
        setComments(
          Object.fromEntries(
            records.map((t) => [t.id, t.technician_comment ?? ""]),
          ),
        );
      } catch (err) {
        if (err.isAbort) return;
        console.log("status:", err.status);
        console.log("response:", err.response);
        setError(err.response?.message ?? err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // realtime: lista odświeża się sama
  useEffect(() => {
    if (!pb.authStore.isValid || pb.authStore.record?.role !== "technician") {
      return;
    }

    const unsubscribe = pb.collection("tickets").subscribe(
      "*",
      (e) => {
        if (e.action === "create") {
          setTickets((prev) =>
            prev.some((t) => t.id === e.record.id) ? prev : [e.record, ...prev],
          );
          setComments((prev) => ({
            ...prev,
            [e.record.id]: e.record.technician_comment ?? "",
          }));
        } else if (e.action === "update") {
          setTickets((prev) =>
            prev.map((t) => (t.id === e.record.id ? e.record : t)),
          );
        } else if (e.action === "delete") {
          setTickets((prev) => prev.filter((t) => t.id !== e.record.id));
        }
      },
      { expand: "author" },
    );

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, []);

  function logout() {
    pb.authStore.clear();
    router.push("/");
  }

  async function loadHistory(ticketId) {
    try {
      const events = await pb.collection("ticket_events").getFullList({
        filter: pb.filter("ticket = {:id}", { id: ticketId }),
        sort: "-created",
        expand: "user",
        requestKey: null,
      });
      setHistory((prev) => ({ ...prev, [ticketId]: events }));
    } catch (err) {
      if (err.isAbort) return;
      console.log("status:", err.status);
      console.log("response:", err.response);
      setError(err.response?.message ?? err.message);
    }
  }

  function toggleHistory(ticketId) {
    if (openHistoryId === ticketId) {
      setOpenHistoryId(null);
      return;
    }
    setOpenHistoryId(ticketId);
    loadHistory(ticketId);
  }

  async function logEvent(ticketId, fromStatus, toStatus) {
    try {
      await pb.collection("ticket_events").create(
        {
          ticket: ticketId,
          user: pb.authStore.record.id,
          from_status: fromStatus,
          to_status: toStatus,
        },
        { requestKey: null },
      );
      if (openHistoryId === ticketId) loadHistory(ticketId);
    } catch (err) {
      console.log("status:", err.status);
      console.log("response:", err.response);
      setError("Status zmieniono, ale nie udało się zapisać historii.");
    }
  }

  async function updateTicket(id, data) {
    const oldStatus = tickets.find((t) => t.id === id)?.status;

    setError("");
    setSavingId(id);
    try {
      const updated = await pb.collection("tickets").update(id, data, {
        expand: "author",
        requestKey: null,
      });
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));

      if (data.status && data.status !== oldStatus) {
        await logEvent(id, oldStatus, data.status);
      }
    } catch (err) {
      console.log("status:", err.status);
      console.log("response:", err.response);
      setError(err.response?.message ?? err.message);
    } finally {
      setSavingId(null);
    }
  }

  function closeTicket(t) {
    if (!confirm(`Zakończyć zgłoszenie „${t.title}"?`)) return;

    const draft = comments[t.id] ?? "";
    const data = { status: CLOSED };
    if (draft !== (t.technician_comment ?? "")) {
      data.technician_comment = draft;
    }
    updateTicket(t.id, data);
  }

  function reopenTicket(t) {
    updateTicket(t.id, { status: "w_realizacji" });
  }

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: "asc" };
    });
  }

  function SortableHead({ sortKey, children, className }) {
    const active = sort.key === sortKey;
    const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;

    return (
      <TableHead className={className}>
        <button
          type="button"
          onClick={() => toggleSort(sortKey)}
          className="flex items-center gap-1 hover:text-foreground"
        >
          {children}
          <Icon
            className={`h-3.5 w-3.5 ${active ? "opacity-100" : "opacity-40"}`}
          />
        </button>
      </TableHead>
    );
  }

  const closedCount = tickets.filter((t) => t.status === CLOSED).length;
  const filtered = showClosed
    ? tickets
    : tickets.filter((t) => t.status !== CLOSED);

  const visibleTickets = sort.key
    ? [...filtered].sort((a, b) => {
        const get = SORT_VALUES[sort.key];
        const result = compare(get(a), get(b));
        return sort.dir === "asc" ? result : -result;
      })
    : filtered;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Dashboard Technika</h1>
          <p className="text-muted-foreground">
            Aktywne: {tickets.length - closedCount} · Zakończone: {closedCount}
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Wyloguj
        </Button>
      </header>

      <label className="flex w-fit items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showClosed}
          onChange={(e) => setShowClosed(e.target.checked)}
        />
        Pokaż zakończone
      </label>

      {loading && <p className="text-muted-foreground">Ładowanie...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead sortKey="title">Tytuł</SortableHead>
                <SortableHead sortKey="description">Opis</SortableHead>
                <TableHead>Zdjęcie</TableHead>
                <SortableHead sortKey="classroom">Sala</SortableHead>
                <SortableHead sortKey="category">Kategoria</SortableHead>
                <SortableHead sortKey="priority">Priorytet</SortableHead>
                <SortableHead sortKey="author">Autor</SortableHead>
                <SortableHead sortKey="status">Status</SortableHead>
                <SortableHead sortKey="comment" className="min-w-64">
                  Komentarz technika
                </SortableHead>
                <TableHead>Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    Brak zgłoszeń.
                  </TableCell>
                </TableRow>
              )}

              {visibleTickets.map((t) => {
                const draft = comments[t.id] ?? "";
                const changed = draft !== (t.technician_comment ?? "");
                const closed = t.status === CLOSED;
                const busy = savingId === t.id;
                const historyOpen = openHistoryId === t.id;
                const events = history[t.id];

                return (
                  <Fragment key={t.id}>
                    <TableRow className={closed ? "opacity-60" : ""}>
                      <TableCell>{t.title}</TableCell>
                      <TableCell className="max-w-xs whitespace-normal">
                        {t.description}
                      </TableCell>

                      <TableCell>
                        {t.photo ? (
                          <a
                            href={pb.files.getURL(t, t.photo)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={pb.files.getURL(t, t.photo)}
                              alt="Zdjęcie zgłoszenia"
                              className="h-16 w-16 rounded-md object-cover"
                            />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell>{t.classroom}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell>{t.priority}</TableCell>
                      <TableCell>{t.expand?.author?.name ?? "-"}</TableCell>

                      <TableCell>
                        <select
                          value={t.status}
                          disabled={busy || closed}
                          onChange={(e) =>
                            updateTicket(t.id, { status: e.target.value })
                          }
                          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                        >
                          {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            value={draft}
                            disabled={closed}
                            placeholder="Dodaj komentarz..."
                            onChange={(e) =>
                              setComments((prev) => ({
                                ...prev,
                                [t.id]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            disabled={!changed || busy || closed}
                            onClick={() =>
                              updateTicket(t.id, { technician_comment: draft })
                            }
                          >
                            Zapisz
                          </Button>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {closed ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => reopenTicket(t)}
                            >
                              Otwórz ponownie
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => closeTicket(t)}
                            >
                              Zakończ
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleHistory(t.id)}
                          >
                            {historyOpen ? "Ukryj historię" : "Historia"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {historyOpen && (
                      <TableRow>
                        <TableCell colSpan={10} className="bg-muted/30">
                          {!events && (
                            <p className="text-sm text-muted-foreground">
                              Ładowanie historii...
                            </p>
                          )}
                          {events && events.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              Brak zapisanych zmian.
                            </p>
                          )}
                          {events && events.length > 0 && (
                            <ul className="flex flex-col gap-1 text-sm">
                              {events.map((ev) => (
                                <li key={ev.id}>
                                  <span className="text-muted-foreground">
                                    {new Date(ev.created).toLocaleString(
                                      "pl-PL",
                                    )}
                                  </span>{" "}
                                  · {ev.expand?.user?.name ?? "nieznany"}:{" "}
                                  {ev.from_status
                                    ? statusLabel(ev.from_status)
                                    : "—"}{" "}
                                  → {statusLabel(ev.to_status)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}