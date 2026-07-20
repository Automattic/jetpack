/**
 * Internal dependencies
 */
import { buildEmailTimelineResponse } from './email-timeline';

type EmailTimelineResponse = {
	timeline: {
		unit: string;
		data: Array< [ string, number ] | [ string, number, number ] >;
	};
};

describe( 'buildEmailTimelineResponse', () => {
	it( 'generates daily buckets forward from the requested start date', () => {
		const response = buildEmailTimelineResponse(
			'opens',
			'/stats/opens/emails/1234?period=day&quantity=3&date=2026-06-17&stats_fields=timeline'
		) as EmailTimelineResponse;

		expect( response.timeline.unit ).toBe( 'day' );
		expect( response.timeline.data.map( row => row[ 0 ] ) ).toEqual( [
			'2026-06-17',
			'2026-06-18',
			'2026-06-19',
		] );
	} );

	it( 'generates hourly buckets forward from the requested start date', () => {
		const response = buildEmailTimelineResponse(
			'clicks',
			'/stats/clicks/emails/1234?period=hour&quantity=3&date=2026-06-17&stats_fields=timeline'
		) as EmailTimelineResponse;

		expect( response.timeline.unit ).toBe( 'hour' );
		expect( response.timeline.data ).toEqual(
			expect.arrayContaining( [
				expect.arrayContaining( [ '2026-06-17', 0 ] ),
				expect.arrayContaining( [ '2026-06-17', 1 ] ),
				expect.arrayContaining( [ '2026-06-17', 2 ] ),
			] )
		);
	} );
} );
