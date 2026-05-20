export function getIsoDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const nextMinutes = totalMinutes % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}
