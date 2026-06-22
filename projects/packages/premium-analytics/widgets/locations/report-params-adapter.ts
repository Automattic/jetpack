/**
 * Internal dependencies
 */
import type { ReportParams } from '@jetpack-premium-analytics/data';

const PRESET_DAYS: Partial< Record< string, number > > = {
	today: 1,
	yesterday: 1,
	'last-7-days': 7,
	'last-30-days': 30,
	'last-90-days': 90,
	'last-365-days': 365,
	'last-month': 30,
	'last-12-months': 365,
	'last-year': 365,
};

const DEFAULT_NUM = 30;

/**
 * Convert PA ReportParams to the trailing-day window the Stats API expects.
 *
 * Presets map to a fixed number of days. For a custom range (`from`/`to`
 * present, no preset), the window is the inclusive day count between the
 * two dates. Falls back to 30 days if the result is not a positive integer.
 *
 * @param params - Report parameters from the widget root context.
 * @return Number of trailing days to request from the Stats endpoint.
 */
export function reportParamsToStatsDays( params: ReportParams ): number {
	if ( params.preset ) {
		const days = PRESET_DAYS[ params.preset ];
		if ( days ) {
			return days;
		}
	}

	if ( params.from && params.to ) {
		const from = new Date( params.from );
		const to = new Date( params.to );
		const days = Math.round( ( to.getTime() - from.getTime() ) / ( 1000 * 60 * 60 * 24 ) ) + 1;
		if ( days > 0 ) {
			return days;
		}
	}

	return DEFAULT_NUM;
}
