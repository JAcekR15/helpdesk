import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Podaj poprawny adres e-mail"),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
  passwordConfirm: z.string(),
}).refine((d) => d.password === d.passwordConfirm, {
  message: "Hasła nie są takie same",
  path: ["passwordConfirm"],
});

export const loginSchema = z.object({
  email: z.string().email("Podaj poprawny adres e-mail"),
  password: z.string().min(1, "Podaj hasło"),
});

export const ticketSchema = z.object({
  title: z.string().min(3, "Tytuł min. 3 znaki").max(100),
  description: z.string().min(10, "Opis min. 10 znaków"),
  room: z.string().min(1, "Wybierz salę"),
  category: z.string().min(1, "Wybierz kategorię"),
  priority: z.string().min(1, "Wybierz priorytet"),
  photo: z
    .any()
    .optional()
    .refine((f) => !f?.[0] || f[0].size <= 5 * 1024 * 1024, "Maks. 5 MB")
    .refine((f) => !f?.[0] || f[0].type.startsWith("image/"), "Tylko obrazy"),
});