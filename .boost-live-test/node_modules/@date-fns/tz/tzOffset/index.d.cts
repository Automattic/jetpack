/**
 * The function returns UTC offset in minutes for the given date in specified
 * time zone.
 *
 * Unlike `Date.prototype.getTimezoneOffset`, this function returns the value
 * mirrored to the sign of the offset in the time zone. For Asia/Singapore
 * (UTC+8), `tzOffset` returns `480`, while `getTimezoneOffset` returns `-480`.
 *
 * It uses `Intl.DateTimeFormat` internally to access otherwise unavailable
 * runtime's time zone data, and falls back to basic manual parsing if Intl API
 * is not supported (e.g., older Node.js versions, React Native's Hermes, etc.).
 *
 * @param timeZone - Time zone name (IANA or UTC offset).
 * @param date - Date to check the offset for.
 *
 * @returns UTC offset in minutes (e.g., `480` for date in UTC+8).
 */
export declare function tzOffset(timeZone: string | undefined, date: Date): number;
