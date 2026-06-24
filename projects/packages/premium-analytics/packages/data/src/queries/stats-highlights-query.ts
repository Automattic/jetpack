/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsHighlightsResponse } from '../processing/stats';
import type { StatsQueryParams } from '../utils/stats-params';
import type { UseQueryOptions } from '@tanstack/react-query';

export const statsHighlightsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'highlights',
		version: '1.1',
		endpoint: 'stats/highlights',
		params,
		sanitizer: 'highlights',
	} ) as UseQueryOptions< StatsHighlightsResponse >;
