import PocketBase from "pocketbase";

const url = process.env.NEXT_PUBLIC_POCKETBASE_URL;

if (!url) {
  throw new Error("Brak zmiennej NEXT_PUBLIC_POCKETBASE_URL");
}

export const pb = new PocketBase(url);