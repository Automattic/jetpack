import { sanitizeStatsSearchTermsResponse } from '..';
import { searchTermsFixture, searchTermsSummaryFixture } from '../__fixtures__/search-terms';

describe( 'Stats search terms normalizer', () => {
	it( 'normalizes summarized search terms into range data', () => {
		const result = sanitizeStatsSearchTermsResponse( searchTermsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual(
			expect.objectContaining( {
				total_search_terms: 0,
				encrypted_search_terms: 31,
				other_search_terms: -34,
			} )
		);
		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'delete revisions for wordpress',
				views: 1,
			} )
		);
	} );

	it( 'normalizes search terms into by-date data points', () => {
		const result = sanitizeStatsSearchTermsResponse( searchTermsFixture, {
			end_date: '2026-06-16',
		} );

		expect( result.summary ).toEqual( {} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
				items: [
					expect.objectContaining( {
						label: 'delete revisions for wordpress',
						views: 1,
						className: 'user-selectable',
						children: null,
					} ),
				],
			} )
		);
	} );
} );
