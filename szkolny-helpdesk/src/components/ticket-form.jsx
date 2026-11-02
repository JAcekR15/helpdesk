"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { pb } from "@/lib/pocketbase";
import { ticketSchema } from "@/lib/schemas";
import { ROOMS, CATEGORIES, PRIORITIES } from "@/lib/constants";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function TicketForm({ onCreated }) {
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: "", description: "", room: "", category: "", priority: "" },
  });

  async function onSubmit(values) {
    const fd = new FormData();
    ["title", "description", "room", "category", "priority"].forEach((k) => fd.append(k, values[k]));
    fd.append("author", pb.authStore.record.id);
    fd.append("status", "nowe");
    if (values.image?.length) fd.append("image", values.image[0]);

    try {
      await pb.collection("tickets").create(fd);
      toast.success("Zgłoszenie zostało dodane");
      reset();
      onCreated?.();
    } catch {
      toast.error("Nie udało się dodać zgłoszenia");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Tytuł</Label>
        <Input id="title" {...register("title")} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Opis</Label>
        <Textarea id="description" {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>
      <SelectField control={control} name="room" label="Sala" options={ROOMS} error={errors.room} />
      <SelectField control={control} name="category" label="Kategoria" options={CATEGORIES} error={errors.category} />
      <SelectField control={control} name="priority" label="Priorytet" options={PRIORITIES} error={errors.priority} />
      <div className="space-y-1">
        <Label htmlFor="image">Zdjęcie (opcjonalnie, max 5 MB)</Label>
        <Input id="image" type="file" accept="image/*" {...register("image")} />
        {errors.image && <p className="text-sm text-destructive">{errors.image.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>Wyślij zgłoszenie</Button>
    </form>
  );
}