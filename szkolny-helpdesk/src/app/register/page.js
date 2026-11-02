"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { pb } from "@/lib/pocketbase";
import { registerSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  async function onSubmit({ name, email, password, passwordConfirm }) {
    try {
      // rola NIE jest wysyłana, reguła w PocketBase by ją odrzuciła
      await pb.collection("users").create({ name, email, password, passwordConfirm });
      await pb.collection("users").authWithPassword(email, password);
      toast.success("Konto zostało utworzone");
      router.push("/tickets");
    } catch (err) {
      const data = err?.response?.data;
      if (data?.email) {
        setError("email", { message: "Ten adres e-mail jest już zajęty" });
      } else if (data?.password) {
        setError("password", { message: "Hasło jest nieprawidłowe" });
      } else {
        setError("root", { message: "Nie udało się utworzyć konta. Spróbuj ponownie." });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Rejestracja</h1>

      <div className="space-y-1">
        <Label htmlFor="name">Imię</Label>
        <Input id="name" autoComplete="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Hasło</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="passwordConfirm">Powtórz hasło</Label>
        <Input id="passwordConfirm" type="password" autoComplete="new-password" {...register("passwordConfirm")} />
        {errors.passwordConfirm && (
          <p className="text-sm text-destructive">{errors.passwordConfirm.message}</p>
        )}
      </div>

      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        Załóż konto
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Masz już konto? <a href="/login" className="underline">Zaloguj się</a>
      </p>
    </form>
  );
}