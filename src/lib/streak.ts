const DAY = 24 * 60 * 60 * 1000;

function dayKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Dias consecutivos de estudo contando a partir de hoje (ou ontem). */
export function computeStreak(dates: Array<string | null | undefined>): number {
  const days = new Set(
    dates.filter((value): value is string => Boolean(value)).map((value) => dayKey(value)),
  );
  if (days.size === 0) return 0;

  const today = dayKey(new Date());
  let cursor = days.has(today) ? today : today - DAY;
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

export function streakMessage(streak: number) {
  if (streak === 0) return "Comece hoje sua sequência de estudos.";
  if (streak === 1) return "Primeiro dia da sua sequência. Bora manter!";
  if (streak < 7) return `${streak} dias seguidos estudando. Continue assim!`;
  return `${streak} dias seguidos. Você está em ritmo de prova!`;
}
