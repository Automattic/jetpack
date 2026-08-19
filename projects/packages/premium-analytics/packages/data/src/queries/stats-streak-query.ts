import { getDatePart } from '@jetpack-premium-analytics/datetime';
import { statsProxyQuery } from './stats-query';
import type { StatsReportParams, StatsReportQueryOptions } from './stats-query';
import type { StatsProxyParams } from '../api';
import type { StatsStreakResponse } from '../processing/stats';

export type StatsStreakParams = StatsReportParams & {
	startDate?: string;
	endDate?: string;
	gmtOffset?: number;
};

export type { StatsStreakResponse };

export const statsStreakQuery = (
	params: StatsStreakParams
): StatsReportQueryOptions< 'streak' > => {
	const streakParams: StatsProxyParams = {
		startDate: params.startDate ?? getDatePart( params.from ) ?? params.start_date,
		endDate: params.endDate ?? getDatePart( params.to ) ?? params.end_date ?? params.date,
		...( params.gmtOffset !== undefined ? { gmtOffset: params.gmtOffset } : {} ),
		...( params.max !== undefined ? { max: params.max } : {} ),
	};

	return statsProxyQuery( {
		name: 'streak',
		version: '1.1',
		endpoint: 'stats/streak',
		params: streakParams,
		sanitizer: 'streak',
		enabled: !! ( streakParams.startDate && streakParams.endDate ),
	} );
};
