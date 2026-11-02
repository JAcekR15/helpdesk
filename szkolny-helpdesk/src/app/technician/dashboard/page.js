const open = tickets.filter((t) => t.status !== "zamkniete").length;
const count = (key) => tickets.reduce((a, t) => ({ ...a, [t[key]]: (a[t[key]] ?? 0) + 1 }), {});
const byCategory = count("category");
const topRoom = Object.entries(count("room")).sort((a, b) => b[1] - a[1])[0]; // [sala, liczba]