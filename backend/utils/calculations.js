/**
 * Format minutes into corporate readable format (e.g. 534 -> "8h 54m")
 */
export function formatMinutes(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return '0h 00m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

/**
 * Returns today's ISO date string in YYYY-MM-DD
 */
export function getTodayDateString(d = new Date()) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates elapsed working minutes between checkIn and checkOut
 */
export function calculateWorkingMinutes(checkIn, checkOut = new Date()) {
  if (!checkIn) return 0;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  return Math.round((end - start) / (1000 * 60));
}

/**
 * Check if a date string is in the past
 */
export function isOverdue(deadlineDateString) {
  if (!deadlineDateString) return false;
  const today = getTodayDateString();
  return deadlineDateString < today;
}

/**
 * Format timestamp to friendly time (e.g., "09:18 AM")
 */
export function formatTime(dateValue) {
  if (!dateValue) return '--:--';
  const d = new Date(dateValue);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}
