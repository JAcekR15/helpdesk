export const ROOMS = ["101", "102", "103", "Pracownia 1", "Pracownia 2", "Biblioteka"]
  .map((r) => ({ value: r, label: r }));
export const CATEGORIES = [
  { value: "sprzet", label: "Sprzęt komputerowy" },
  { value: "multimedia", label: "Multimedia" },
  { value: "instalacje", label: "Instalacje" },
  { value: "inne", label: "Inne" },
];
export const PRIORITIES = [
  { value: "niski", label: "Niski" },
  { value: "sredni", label: "Średni" },
  { value: "wysoki", label: "Wysoki" },
];
export const STATUSES = [
  { value: "nowe", label: "Nowe" },
  { value: "w_realizacji", label: "W realizacji" },
  { value: "zamkniete", label: "Zamknięte" },
];
export const labelOf = (list, v) => list.find((i) => i.value === v)?.label ?? v;