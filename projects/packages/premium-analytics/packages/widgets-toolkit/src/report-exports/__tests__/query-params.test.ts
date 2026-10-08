/**
 * Internal dependencies
 */
import { getAuthorsReportQueryParams } from '../authors';
import { getLocationsReportQueryParams } from '../locations';
import { getPostsReportQueryParams } from '../posts';
import { getSummarizedReportQueryParams } from '../query-params';
import { getUtmReportQueryParams } from '../utm';
import { getVideosReportQueryParams } from '../videos';
import type { ReportParams } from '@jetpack-premium-analytics/data';

const ALL_TIME = {
	preset: 'all-time',
	from: '2020-01-01T00:00:00.000+00:00',
	to: '2026-10-07T23:59:59.999+00:00',
	interval: 'day',
} as ReportParams;

describe( 'report query params', () => {
	it.each( [
		[ 'summarized', getSummarizedReportQueryParams ],
		[ 'Posts', getPostsReportQueryParams ],
		[ 'Authors', getAuthorsReportQueryParams ],
		[ 'Videos', getVideosReportQueryParams ],
		[
			'Locations',
			( params: ReportParams ) => getLocationsReportQueryParams( params, 'countries' ),
		],
		[ 'UTM', ( params: ReportParams ) => getUtmReportQueryParams( params, 'source' ) ],
	] )( 'leaves the %s all-time start to WPCOM', ( _, build ) => {
		expect( build( ALL_TIME ) ).toMatchObject( { num: -1 } );
		expect( build( { ...ALL_TIME, preset: 'last-7-days' } as ReportParams ) ).not.toHaveProperty(
			'num'
		);
	} );
} );
