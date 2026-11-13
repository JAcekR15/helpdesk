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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const pb = new PocketBase("https://db.jacekr.tech");

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function AddTicket() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push("/");
    }
  }, [router]);

  async function sendTicket(data) {
    setSaving(true);
    try {
      await pb.collection("tickets").create(data);
      router.push("/dashboard/dashboardUser");
    } catch (err) {
      console.log("status:", err.status);
      console.log("response:", JSON.stringify(err.response, null, 2));
      const fieldError = Object.values(err.response?.data ?? {})[0]?.message;
      setError(fieldError ?? err.response?.message ?? err.message);
      setSaving(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const data = new FormData(e.currentTarget);

    // pusty input pliku wysyła pusty plik, którego PocketBase nie przyjmie
    const photo = data.get("photo");
    if (photo && photo.size === 0) data.delete("photo");

    data.append("author", pb.authStore.record.id);
    data.append("status", "nowe");

    sendTicket(data);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Dodaj zgłoszenie</CardTitle>
            <CardDescription>
              Wprowadź dane dotyczące zgłoszenia
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Nazwa zgłoszenia</FieldLabel>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="np. Nie działa projektor"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Opis zgłoszenia</FieldLabel>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Opisz, co się dzieje"
                  required
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="classroom">Sala</FieldLabel>
                <Input
                  id="classroom"
                  name="classroom"
                  type="text"
                  placeholder="np. 211"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="category">Kategoria</FieldLabel>
                <select
                  id="category"
                  name="category"
                  required
                  className={selectClass}
                >
                  <option value="sprzet">sprzet</option>
                  <option value="multimedia">multimedia</option>
                  <option value="instalacje">instalacje</option>
                  <option value="inne">inne</option>
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="priority">Priorytet</FieldLabel>
                <select
                  id="priority"
                  name="priority"
                  required
                  className={selectClass}
                >
                  <option value="niski">niski</option>
                  <option value="sredni">sredni</option>
                  <option value="wysoki">wysoki</option>
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="photo">Zdjęcie (opcjonalnie)</FieldLabel>
                <Input id="photo" name="photo" type="file" accept="image/*" />
              </Field>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </FieldGroup>
          </CardContent>

          <CardFooter className="mt-6 flex-col gap-2">
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Wysyłanie..." : "Dodaj zgłoszenie"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard/dashboardUser")}
            >
              Anuluj
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
