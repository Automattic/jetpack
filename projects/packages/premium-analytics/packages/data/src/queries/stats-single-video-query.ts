/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsSingleVideoQuery = ( videoId: number, params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'single-video',
		version: '1.1',
		endpoint: `stats/video/${ videoId }`,
		params,
		sanitizer: 'singleVideo',
		enabled: Number.isInteger( videoId ) && videoId > 0,
	} );
