import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Podaj poprawny adres e-mail"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
});

export const registerSchema = loginSchema
  .extend({
    name: z.string().min(2, "Imię: minimum 2 znaki"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Hasła muszą być takie same",
    path: ["passwordConfirm"],
  });

const noFile = (f) => !f || f.length === 0;

export const ticketSchema = z.object({
  title: z.string().min(3, "Tytuł: minimum 3 znaki").max(100, "Tytuł: maksymalnie 100 znaków"),
  description: z.string().min(10, "Opis: minimum 10 znaków"),
  room: z.string().min(1, "Wybierz salę"),
  category: z.string().min(1, "Wybierz kategorię"),
  priority: z.string().min(1, "Wybierz priorytet"),
  image: z
    .any()
    .refine((f) => noFile(f) || f[0].size <= 5 * 1024 * 1024, "Zdjęcie może mieć maksymalnie 5 MB")
    .refine((f) => noFile(f) || f[0].type.startsWith("image/"), "Dozwolone są tylko obrazy"),
});