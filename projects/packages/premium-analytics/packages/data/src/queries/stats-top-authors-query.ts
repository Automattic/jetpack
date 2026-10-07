/**
 * External dependencies
 */
import {
	PRESET_ALL_TIME,
	dateToISOStringWithLocalTZ,
	localTZDate,
} from '@jetpack-premium-analytics/datetime';
import { startOfDay, subDays } from 'date-fns';
/**
 * Internal dependencies
 */
import { statsReportQuery, type StatsReportParams } from './stats-query';

/**
 * WPCOM caps an all-time `num=-1` request at three years: it rolls authors up day by day,
 * which big sites cannot afford over their whole history.
 */
const ALL_TIME_MAX_DAYS = 365 * 3;

/**
 * Hold an all-time daily window to the span classic Stats shows for it, since an explicit start skips WPCOM's cap.
 *
 * @param params - The report params.
 * @return The params, with an all-time start moved up to the cap.
 */
function capAllTimeWindow( params: StatsReportParams ): StatsReportParams {
	const isDaily = params.period === undefined || params.period === 'day';
	if ( ! isDaily || params.preset !== PRESET_ALL_TIME || ! params.from || ! params.to ) {
		return params;
	}

	const floor = startOfDay( subDays( localTZDate( params.to ), ALL_TIME_MAX_DAYS - 1 ) );

	return localTZDate( params.from ) < floor
		? { ...params, from: dateToISOStringWithLocalTZ( floor ) }
		: params;
}

export const statsTopAuthorsQuery = ( params: StatsReportParams ) =>
	statsReportQuery(
		'top-authors',
		'stats/top-authors',
		capAllTimeWindow( params ),
		'topAuthors',
		'1.1',
		undefined,
		{
			omitParams: [ 'days' ],
		}
	);
