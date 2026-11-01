"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import { registerSchema } from "@/lib/validation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data) {
    try {
      await pb.collection("users").create(data);
      await pb.collection("users").authWithPassword(data.email, data.password);
      router.push("/tickets");
    } catch (e) {
      setError("root", { message: "Nie udało się założyć konta (e-mail zajęty?)" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm mx-auto p-4 space-y-3">
      <Input placeholder="E-mail" {...register("email")} />
      {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      <Input type="password" placeholder="Hasło" {...register("password")} />
      {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      <Input type="password" placeholder="Powtórz hasło" {...register("passwordConfirm")} />
      {errors.passwordConfirm && <p className="text-sm text-red-500">{errors.passwordConfirm.message}</p>}
      {errors.root && <p className="text-sm text-red-500">{errors.root.message}</p>}
      <Button disabled={isSubmitting}>Zarejestruj</Button>
    </form>
  );
}