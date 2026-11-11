"use client";

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

import { useState } from "react";
import { useRouter } from "next/navigation";
import PocketBase from "pocketbase";

const pb = new PocketBase("https://db.jacekr.tech");

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(email, password) {
    setLoading(true);
    try {
      const authData = await pb
        .collection("users")
        .authWithPassword(email, password);

      const role = authData.record.role;

      if (role === "technician") {
        router.push("/dashboard/dashboardTech");
      } else {
        router.push("/dashboard/dashboardUser");
      }
    } catch (err) {
      console.log("status:", err.status);
      console.log("response:", err.response);
      setError(
        err.status === 400
          ? "Nieprawidłowy e-mail lub hasło"
          : `Błąd ${err.status}: ${err.response?.message ?? err.message}`,
      );
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    login(String(form.get("email")), String(form.get("password")));
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Zaloguj się</CardTitle>
            <CardDescription>
              Podaj e-mail i hasło, aby wejść do systemu.
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jan@example.com"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Hasło</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </Field>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </FieldGroup>
          </CardContent>

          <CardFooter className="mt-6 flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logowanie..." : "Zaloguj się"}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => router.push("/register")}
            >
              Nie masz konta? Zarejestruj się
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}