import { apiCall, apiPath } from './_helpers';

/**
 * Response of `GET /jetpack/v4/site/backup/schedule`.
 *
 * The route proxies WordPress.com's `/sites/%d/rewind/scheduled` and forwards the
 * decoded body verbatim. Every field is optional because a reply the route cannot read
 * collapses to a bare `null` body served with HTTP 200, as the other legacy
 * `/site/backup/*` routes do.
 *
 * `scheduled_hour` is the hour **in UTC**. Nothing in the payload says so, but it is how
 * legacy has always read it, and reading it as local time would move every reported
 * backup by the site's own offset.
 *
 * `ok` is WordPress.com's own success flag inside the 200 body; a payload that does not
 * set it carries no usable hour.
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
