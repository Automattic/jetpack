import { sanitizeStatsEmailSummaryResponse } from '..';
import { emailSummaryFixture } from '../__fixtures__/email-summary';

describe( 'Stats email summary normalizer', () => {
	it( 'normalizes email summary metrics', () => {
		expect(
			sanitizeStatsEmailSummaryResponse( emailSummaryFixture, {
				period: 'day',
				date: '2026-06-16',
			} )
		).toEqual(
			expect.objectContaining( {
				summary: expect.objectContaining( {
					total_sends: 100,
					opens: 30,
					clicks: 4,
				} ),
				data: [
					expect.objectContaining( {
						time_interval: '2026-06-16',
						items: [
							expect.objectContaining( {
								id: 71,
								label: 'Newsletter',
								value: 30,
								link: 'https://example.com/newsletter/',
								actions: [ { type: 'link', data: 'https://example.com/newsletter/' } ],
								unique_opens: 24,
								unique_clicks: 3,
							} ),
						],
					} ),
				],
			} )
		);
	} );

	it( 'returns empty data for empty email summaries', () => {
		expect(
			sanitizeStatsEmailSummaryResponse( {}, { period: 'day', date: '2026-06-16' } )
		).toEqual( {
			summary: {
				total_sends: 0,
				opens: 0,
				clicks: 0,
				unique_opens: 0,
				unique_clicks: 0,
			},
			data: [],
		} );
	} );
} );
