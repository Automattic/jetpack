import { useQuery } from '@tanstack/react-query';
import { dateI18n } from '@wordpress/date';
import { fetchBackupSchedule, type RawBackupSchedule } from '../data/api/backup-schedule';
import { keys } from '../data/query-client';
import { useCanQueryWpcom } from './use-connection';

// The schedule only changes when somebody changes it, and the setting
// that does so does not live on this page — so an hour is a generous
// floor rather than a risk. Well past the 30s default the query client
// hands out, which would re-read this on every list interaction.
const BACKUP_SCHEDULE_STALE_MS = 60 * 60_000;

// The last minute the reported window covers. WordPress.com starts the
// run at the top of the scheduled hour, so a window opening at 10:00 is
// shown as ending at 10:59 — legacy's `convertHourToRange` spells the
// same figure as `.add( 59, 'minutes' )`.
const WINDOW_LAST_MINUTE_MS = 59 * 60_000;

// And the instant the window is actually over, which is 59 seconds later
// than the minute it last displays. The distinction only shows up in the
// roll-forward below: without those seconds, the line would jump to
// tomorrow at 10:59:00 while the clock still reads 10:59.
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
 * The whole of the render gate, and deliberately narrow: this is the one
 * field the line needs, and every way of not having it — a site with no
 * schedule, which answers `scheduled_hour: null`; a response the route
 * could not decode, which is a bare `null` body served as HTTP 200 —
 * arrives here as "not a number in 0–23" and is answered with silence.
 *
 * `ok` is not consulted, even though the payload declares it. Requiring
 * it would blank the line on any response that simply omits the flag,
 * and that failure is silent and indistinguishable from "this site has
 * no schedule". A response carrying a usable hour has already answered
 * the only question asked of it.
 *
 * The range check is not ceremony. `Date.UTC( …, 24, … )` is not an
 * error, it is the following midnight, so an out-of-range hour would
 * quietly report a backup at the wrong time rather than reporting
 * nothing.
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
 * Today's window if it has not closed yet, tomorrow's otherwise —
 * "otherwise" being generous on purpose: a reader looking at the page at
 * 10:30 on a 10:00 schedule is told about the run happening now, not the
 * one tomorrow.
 *
 * All arithmetic is in UTC, which is both where the hour is expressed
 * and the only calendar with no daylight-saving discontinuity to fall
 * into — `setUTCDate( +1 )` is exactly 24 hours here, where the same
 * step taken on a local-time date is 23 or 25 hours twice a year.
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
 * A port of legacy's `useNextBackupSchedule`
 * (`js/hooks/scheduled-backups/use-next-backup-schedule.ts`) with two
 * deliberate differences.
 *
 * **It formats here rather than handing back a date.** Legacy returns a
 * moment and lets the component call `.format()` on it. Returning the
 * two finished strings keeps every date decision — the calendar the
 * arithmetic runs in, the timezone it is presented in, the format
 * characters — inside this file, and leaves the component with nothing
 * to get wrong.
 *
 * **It formats with `@wordpress/date`, not moment.** That is what every
 * other date on this dashboard uses, and on this page it is free: each
 * route's `package.json` declares `@wordpress/date`, so wp-build
 * externalizes it to WordPress core's own `wp-date` script, while a bare
 * `moment` import is not declared, not externalized, and would bundle a
 * second copy of moment into the route.
 *
 * It also gets the timezone right in a case legacy does not. `dateI18n`
 * resolves the site's zone itself — the IANA string when WordPress has
 * one, the numeric offset when it does not. Legacy reads
 * `getSettings().timezone.offset` by hand and branches on whether that
 * value is truthy, and the offset is typed `number`: a site set to UTC
 * reports `0`, takes the else branch, and is rendered in the reader's
 * browser timezone instead of its own.
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

	// The explicit `undefined` third argument is this dashboard's spelling
	// throughout, and it means the site's timezone rather than the
	// browser's: with no zone passed, `dateI18n` falls back to the
	// `settings.timezone` that `wp.date.setSettings()` populates from the
	// site's own options.
	//
	// The range is assembled here rather than as a third msgid because
	// neither half is translatable prose — both are `dateI18n` output —
	// and the separator is the hyphen legacy already renders between them.
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
