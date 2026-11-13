"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PocketBase from "pocketbase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const pb = new PocketBase("https://db.jacekr.tech");

const statusStyles = {
  nowe: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  w_realizacji: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

const priorityStyles = {
  niski: "bg-muted text-muted-foreground",
  wysoki: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export default function DashboardUser() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push("/");
      return;
    }

    setUserName(pb.authStore.record.name);

    async function fetchTickets() {
      try {
        const list = await pb.collection("tickets").getFullList({
          filter: pb.filter("author = {:id}", { id: pb.authStore.record.id }),
          sort: "-created",
          requestKey: null,
        });
        setTickets(list);
      } catch (err) {
        if (err.isAbort) return;
        console.log("status:", err.status);
        console.log("response:", err.response);
        setError(err.response?.message ?? err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [router]);

  function logout() {
    pb.authStore.clear();
    router.push("/");
  }

  function AddTicket() {
    router.push("/dashboard/dashboardUser/addTicket");
  }

  async function cancelTicket(ticketId) {
    if (!confirm("Na pewno anulować to zgłoszenie?")) return;

    try {
      await pb.collection("tickets").delete(ticketId);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (err) {
      console.log("status:", err.status);
      console.log("response:", err.response);
      setError(err.response?.message ?? err.message);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 p-4 sm:p-6">
      {/* Nagłówek */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl sm:text-4xl">
            Cześć{userName ? `, ${userName}` : ""}!
          </h1>
          <p className="text-muted-foreground">
            Tutaj zobaczysz swoje zgłoszenia i ich status.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={AddTicket}>Dodaj zgłoszenie</Button>
          <Button variant="outline" onClick={logout}>
            Wyloguj
          </Button>
        </div>
      </header>

      {/* Lista */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between border-b pb-2">
          <h2 className="text-xl">Twoje zgłoszenia</h2>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {tickets.length}
            </span>
          )}
        </div>

        {loading && <p className="text-muted-foreground">Ładowanie...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && tickets.length === 0 && (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            Nie masz jeszcze żadnych zgłoszeń.
          </div>
        )}

        {tickets.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle>{t.title}</CardTitle>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${
                    statusStyles[t.status] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.status?.replace("_", " ")}
                </span>
              </div>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <span>Sala {t.classroom}</span>
                <span>·</span>
                <span>{t.category}</span>
                <span>·</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    priorityStyles[t.priority] ??
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  priorytet: {t.priority}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <p>{t.description}</p>

              {t.photo && (
                <img
                  src={pb.files.getURL(t, t.photo)}
                  alt="Zdjęcie zgłoszenia"
                  className="max-h-60 w-full rounded-md object-cover"
                />
              )}

              {t.technician_comment && (
                <div className="rounded-md border-l-4 bg-muted/50 p-3 text-sm">
                  <p className="mb-1 text-xs uppercase text-muted-foreground">
                    Komentarz technika
                  </p>
                  <p>{t.technician_comment}</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Dodano {new Date(t.created).toLocaleDateString("pl-PL")}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={t.status !== "nowe"}
                onClick={() => cancelTicket(t.id)}
              >
                Anuluj
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  );
}