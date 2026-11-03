/**
 * External dependencies
 */
import { reportingTimeZone } from '@jetpack-premium-analytics/datetime';

/** Params naming the zone a report is built and read in. */
export type ReportTimeZoneParams = { timezone?: string };

/**
 * The reporting timezone for one report, decided once where its query is built.
 *
 * The only place the data layer asks the environment: everything downstream
 * takes the zone as a value, so a normalized report can be read back without
 * replaying what the environment said when it was built.
 *
 * @param timezone - A zone the params already name, if any.
 * @return An IANA zone name, or a `±HH:MM` offset.
 */
export function resolveReportTimeZone( timezone?: string ): string {
	return timezone ?? reportingTimeZone();
}
