import { apiCall, apiPath } from './_helpers';

/**
 * Response of `GET /jetpack/v4/site/backup/schedule`.
 *
 * The route proxies WordPress.com's `/sites/%d/rewind/scheduled` and
 * forwards the decoded body verbatim. Every field is optional here
 * because the route hands back whatever it managed to decode: a reply it
 * cannot read at all collapses to a bare `null` body served with HTTP
 * 200, the same shape the other legacy `/site/backup/*` routes take.
 * A non-200 from WordPress.com is the one case that does *not* look like
 * that — `get_site_backup_schedule_time()` returns a `WP_Error`, so the
 * request rejects and `apiCall` throws.
 *
 * `scheduled_hour` is the hour of the day **in UTC**, 0–23, at which
 * WordPress.com starts the site's daily full backup. Nothing in the
 * payload says so; it is how the legacy dashboard has always read it
 * (`js/hooks/scheduled-backups/use-next-backup-schedule.ts` builds the
 * instant with `moment.utc()`), and reading it as local time would move
 * every reported backup by the site's own offset.
 *
 * The field names are legacy's, which is the only description of this
 * payload written against a live response — `js/hooks/scheduled-backups/
 * use-scheduled-time-query.ts` declares `{ ok, scheduled_hour,
 * scheduled_by }`. Note that `src/abilities/class-backup-abilities.php`
 * reads `hour` and `minute` off the same route instead; the two cannot
 * both be right, and the one that renders on screen today is this one.
 *
 * `ok` is declared because legacy declares it, and deliberately not read
 * — see `useNextBackupSchedule()` for why the hour is the better gate.
 * `scheduled_by` is the account that last changed the schedule; nothing
 * here shows it.
 */
export type RawBackupSchedule = {
	ok?: boolean;
	scheduled_hour?: number | null;
	scheduled_by?: string | null;
} | null;

/**
 * Fetch the hour of the day WordPress.com backs this site up.
 *
 * @return WordPress.com's payload, or `null` when it could not be read.
 */
export async function fetchBackupSchedule(): Promise< RawBackupSchedule > {
	return apiCall< RawBackupSchedule >( { path: apiPath( '/site/backup/schedule' ) } );
}
