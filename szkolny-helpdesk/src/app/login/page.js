"use client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import { loginSchema } from "@/lib/validation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data) {
    try {
      const auth = await pb
        .collection("users")
        .authWithPassword(data.email, data.password);
      router.push(auth.record.role === "technician" ? "/technician" : "/tickets");
    } catch (e) {
      setError("root", { message: "Nieprawidłowy e-mail lub hasło" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm mx-auto p-4 space-y-3">
      <h1 className="text-xl font-semibold">Logowanie</h1>
      <Input placeholder="E-mail" {...register("email")} />
      {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      <Input type="password" placeholder="Hasło" {...register("password")} />
      {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      {errors.root && <p className="text-sm text-red-500">{errors.root.message}</p>}
      <Button disabled={isSubmitting}>Zaloguj</Button>
      <p className="text-sm">
        Nie masz konta? <Link href="/register" className="underline">Zarejestruj się</Link>
      </p>
    </form>
  );
}