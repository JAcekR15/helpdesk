"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PocketBase from "pocketbase";

const pb = new PocketBase("https://db.jacekr.tech");

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function registerUser(name, email, password) {
    setLoading(true);
    try {
      await pb.collection("users").create({
        email,
        emailVisibility: true,
        name,
        role: "user",
        password,
        passwordConfirm: password,
      });

      await pb.collection("users").authWithPassword(email, password);
      router.push("/dashboard/dashboardUser");
    } catch (err) {
      console.log("status:", err.status);
      console.log("response:", err.response);
      const fieldError = Object.values(err.response?.data ?? {})[0]?.message;
      setError(fieldError ?? err.response?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    registerUser(
      String(form.get("name")),
      String(form.get("email")),
      String(form.get("password")),
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Utwórz konto</CardTitle>
            <CardDescription>
              Wypełnij dane, aby zarejestrować się w systemie.
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Imię</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jan Kowalski"
                  required
                />
              </Field>
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
                  minLength={8}
                  placeholder="••••••••"
                  required
                />
                <FieldDescription>Minimum 8 znaków.</FieldDescription>
              </Field>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </FieldGroup>
          </CardContent>

          <CardFooter className="mt-6 flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Rejestrowanie..." : "Zarejestruj się"}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => router.push("/login")}
            >
              Masz już konto? Zaloguj się
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}