import { sanitizeStatsEmailSummaryResponse } from '..';
import { emailSummaryFixture } from '../__fixtures__/email-summary';

describe( 'Stats email summary normalizer', () => {
	it( 'normalizes email summary metrics', () => {
		const [ newsletter ] = emailSummaryFixture.posts;
		const digest = {
			...newsletter,
			id: 72,
			title: 'Digest',
			opens: 12,
			clicks: 1,
			unique_opens: 10,
			unique_clicks: 1,
			total_sends: 50,
		};

		expect(
			sanitizeStatsEmailSummaryResponse(
				{ posts: [ newsletter, digest ] },
				{ period: 'day', date: '2026-06-16' }
			)
		).toEqual(
			expect.objectContaining( {
				summary: expect.objectContaining( {
					total_sends: 150,
					opens: 42,
					clicks: 5,
					unique_opens: 34,
					unique_clicks: 4,
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
							expect.objectContaining( { id: 72, label: 'Digest', value: 12 } ),
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
