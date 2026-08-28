import { useQuery } from '@tanstack/react-query';
import { dateI18n } from '@wordpress/date';
import { fetchBackupSchedule, type RawBackupSchedule } from '../data/api/backup-schedule';
import { keys } from '../data/query-client';
import { useCanQueryWpcom } from './use-connection';

// The schedule only changes when somebody changes it, and not from this page, so an
// hour is a generous floor rather than a risk.
const BACKUP_SCHEDULE_STALE_MS = 60 * 60_000;

// The last minute the reported window covers: WordPress.com starts the run at the top
// of the scheduled hour, so a window opening at 10:00 is shown as ending at 10:59.
const WINDOW_LAST_MINUTE_MS = 59 * 60_000;

// And the instant the window is actually over. Without those extra seconds the
// roll-forward below jumps to tomorrow while the clock still reads 10:59.
const WINDOW_END_MS = WINDOW_LAST_MINUTE_MS + 59_000;

type Result = { isLoading: boolean } & (
	| {
			hasSchedule: true;
			/** The next run's date, formatted for the site, e.g. `Oct 22`. */
			nextBackupDate: string;
			/** The window it runs in, e.g. `10:00-10:59 AM`. */
			timeRange: string;
	  }
	| { hasSchedule: false; nextBackupDate: null; timeRange: null }
);

/**
 * The scheduled hour, if the payload carried a usable one.
 *
 * The whole of the render gate: every way of not having an hour arrives here as "not a
 * number in 0–23" and is answered with silence. `ok` is deliberately not consulted —
 * requiring it would blank the line on a response that merely omits the flag.
 *
 * The range check is not ceremony: `Date.UTC( …, 24, … )` is the following midnight, so
 * an out-of-range hour would report a backup at the wrong time rather than none.
 *
 * @param raw - Whatever the route returned.
 * @return The hour in UTC, or null when there is nothing to show.
 */
function scheduledHourOf( raw: RawBackupSchedule ): number | null {
	const hour = raw?.scheduled_hour;

	if ( typeof hour !== 'number' || ! Number.isInteger( hour ) || hour < 0 || hour > 23 ) {
		return null;
	}

	return hour;
}

/**
 * The instant WordPress.com next opens this site's backup window.
 *
 * Today's window if it has not closed yet, tomorrow's otherwise — so a reader at 10:30
 * on a 10:00 schedule is told about the run happening now. All arithmetic is in UTC,
 * where `setUTCDate( +1 )` is exactly 24 hours rather than 23 or 25 twice a year.
 *
 * @param scheduledHourUtc - Hour of the day, 0–23, in UTC.
 * @param now              - The current instant.
 * @return The start of the next window.
 */
function nextWindowStart( scheduledHourUtc: number, now: Date ): Date {
	const start = new Date(
		Date.UTC( now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), scheduledHourUtc, 0, 0, 0 )
	);

	if ( now.getTime() > start.getTime() + WINDOW_END_MS ) {
		start.setUTCDate( start.getUTCDate() + 1 );
	}

	return start;
}

/**
 * When the site's next full backup runs, ready to render.
 *
 * A port of legacy's `useNextBackupSchedule` that formats here rather than handing back
 * a date, so the calendar, the timezone and the format characters all stay in this file.
 *
 * Formatting with `@wordpress/date` also fixes a timezone bug legacy has: it branches on
 * a truthy `getSettings().timezone.offset`, so a site set to UTC reports `0` and renders
 * in the reader's browser timezone instead of its own.
 *
 * @return The formatted next-run date and window, or nulls.
 */
export function useNextBackupSchedule(): Result {
	const query = useQuery( {
		queryKey: keys.backupSchedule(),
		queryFn: fetchBackupSchedule,
		staleTime: BACKUP_SCHEDULE_STALE_MS,
		enabled: useCanQueryWpcom(),
	} );

	const scheduledHour = scheduledHourOf( query.data ?? null );

	if ( scheduledHour === null ) {
		return {
			isLoading: query.isLoading,
			hasSchedule: false,
			nextBackupDate: null,
			timeRange: null,
		};
	}

	const start = nextWindowStart( scheduledHour, new Date() );
	const lastMinute = new Date( start.getTime() + WINDOW_LAST_MINUTE_MS );

	// The explicit `undefined` third argument means the site's timezone rather than the
	// browser's. The range is assembled here rather than as a third msgid: neither half
	// is translatable prose.
	return {
		isLoading: query.isLoading,
		hasSchedule: true,
		nextBackupDate: dateI18n( 'M j', start, undefined ),
		timeRange: `${ dateI18n( 'g:i', start, undefined ) }-${ dateI18n(
			'g:i A',
			lastMinute,
			undefined
		) }`,
	};
}
