/**
 * Formats a Date object into a `h:mm:ss AM/PM` string.
 * @param date The Date object to format.
 * @returns The formatted time string.
 */

export function formatTime(date: Date): string {
  let hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ampm = hours24 >= 12 ? "PM" : "AM";

  let hours12 = hours24 % 12;
  hours12 = hours12 ? hours12 : 12; // Convert hour '0' to '12'

  const hoursStr = String(hours12);
  return `${hoursStr}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Formats a Date object into a `h:mm AM/PM` string for the document title.
 * @param date The Date object to format.
 * @returns The formatted time string without seconds.
 */
export function formatTimeForTitle(date: Date): string {
  let hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours24 >= 12 ? "PM" : "AM";

  let hours12 = hours24 % 12;
  hours12 = hours12 ? hours12 : 12;

  const hoursStr = String(hours12);
  return `${hoursStr}:${minutes} ${ampm}`;
}
