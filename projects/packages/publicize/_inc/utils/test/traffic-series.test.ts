import { buildSeries } from '../traffic-series';
import type { Connection, TrafficReferrerDay } from '../../social-store/types';

const fbConnection = {
	service_name: 'facebook',
	service_label: 'My Facebook Page',
} as unknown as Connection;

describe( 'buildSeries', () => {
	it( 'returns no series for undefined or empty input', () => {
		expect( buildSeries( undefined, [] ) ).toEqual( [] );
		expect( buildSeries( {}, [] ) ).toEqual( [] );
	} );

	it( 'builds one series per matched social host with the brand stroke', () => {
		const days: Record< string, TrafficReferrerDay > = {
			'2026-05-01': {
				groups: [
					{ name: 'facebook.com', url: 'https://facebook.com/', total: 5 },
					{ name: 'example.com', url: 'https://example.com/', total: 99 },
				],
			},
		};

		const series = buildSeries( days, [] );

		expect( series ).toHaveLength( 1 );
		expect( series[ 0 ].label ).toBe( 'Facebook' );
		expect( series[ 0 ].options?.stroke ).toBe( '#0866ff' );
		expect( series[ 0 ].data ).toEqual( [
			{ date: new Date( '2026-05-01T00:00:00Z' ), value: 5 },
		] );
	} );

	it( 'prefers a connection service_label for the legend when available', () => {
		const days: Record< string, TrafficReferrerDay > = {
			'2026-05-01': { groups: [ { url: 'https://x.facebook.com/', total: 3 } ] },
		};

		expect( buildSeries( days, [ fbConnection ] )[ 0 ].label ).toBe( 'My Facebook Page' );
	} );

	it( 'fills gaps with zero and sorts dates ascending', () => {
		const days: Record< string, TrafficReferrerDay > = {
			'2026-05-02': { groups: [ { url: 'https://facebook.com/', total: 4 } ] },
			'2026-05-01': { groups: [] },
		};

		const series = buildSeries( days, [] );

		expect( series[ 0 ].data ).toEqual( [
			{ date: new Date( '2026-05-01T00:00:00Z' ), value: 0 },
			{ date: new Date( '2026-05-02T00:00:00Z' ), value: 4 },
		] );
	} );

	it( 'drops services whose total over the window is zero', () => {
		const days: Record< string, TrafficReferrerDay > = {
			'2026-05-01': { groups: [ { url: 'https://facebook.com/', total: 0 } ] },
		};

		expect( buildSeries( days, [] ) ).toEqual( [] );
	} );

	it( 'descends into nested results under a non-social container', () => {
		const days: Record< string, TrafficReferrerDay > = {
			'2026-05-01': {
				groups: [
					{
						name: 'Search Engines',
						total: 50,
						results: [
							{ url: 'https://reddit.com/r/x', total: 7 },
							{ url: 'https://google.com/', total: 43 },
						],
					},
				],
			},
		};

		const series = buildSeries( days, [] );

		expect( series ).toHaveLength( 1 );
		expect( series[ 0 ].label ).toBe( 'Reddit' );
		expect( series[ 0 ].data[ 0 ].value ).toBe( 7 );
	} );

	it( 'does not double-count when a matched group also has nested results', () => {
		const days: Record< string, TrafficReferrerDay > = {
			'2026-05-01': {
				groups: [
					{
						url: 'https://facebook.com/',
						total: 10,
						results: [
							{ url: 'https://facebook.com/a', total: 6 },
							{ url: 'https://facebook.com/b', total: 4 },
						],
					},
				],
			},
		};

		// Attribute the group total (10), not group + children (20).
		expect( buildSeries( days, [] )[ 0 ].data[ 0 ].value ).toBe( 10 );
	} );
} );
