export function formatScheduleLabel(hour: number, minute: number) {
  const period = hour >= 12 ? "malam" : "pagi";
  const normalizedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const minuteLabel = String(minute).padStart(2, "0");
  return `Bab baru setiap jam ${normalizedHour}:${minuteLabel} ${period}`;
}

export function nextScheduledDate({
  from,
  hour,
  minute,
}: {
  from: Date;
  hour: number;
  minute: number;
}) {
  const next = new Date(from);
  next.setSeconds(0, 0);
  next.setHours(hour, minute, 0, 0);

  if (next <= from) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}
