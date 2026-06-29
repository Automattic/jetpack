import {
	fetchTrafficReferrers,
	receiveTrafficReferrers,
	receiveTrafficReferrersError,
	setTrafficInterval,
} from '../../actions/traffic-stats';
import { trafficStats } from '../traffic-stats';
import type { TrafficReferrerDay, TrafficStatsState } from '../../types';

const day = ( total: number ): TrafficReferrerDay => ( {
	groups: [ { url: 'https://facebook.com/', total } ],
} );

describe( 'trafficStats reducer', () => {
	it( 'defaults to a 30-day interval with no cached payloads', () => {
		expect( trafficStats( undefined, { type: 'default' } ) ).toEqual( { interval: 30 } );
	} );

	it( 'sets the active interval and leaves the payload cache untouched', () => {
		const prior: TrafficStatsState = {
			interval: 30,
			byInterval: { 30: { days: { '2026-05-01': day( 5 ) } } },
		};

		const next = trafficStats( prior, setTrafficInterval( 7 ) );

		expect( next.interval ).toBe( 7 );
		expect( next.byInterval ).toBe( prior.byInterval );
	} );

	it( 'marks an interval as loading and clears any prior error', () => {
		const prior: TrafficStatsState = { interval: 30, byInterval: { 7: { error: true } } };

		expect( trafficStats( prior, fetchTrafficReferrers( 7 ) ).byInterval?.[ 7 ] ).toEqual( {
			loading: true,
			error: false,
		} );
	} );

	it( 'stores a received payload and clears loading and error', () => {
		const prior: TrafficStatsState = { interval: 30, byInterval: { 7: { loading: true } } };
		const days = { '2026-05-01': day( 5 ) };

		expect( trafficStats( prior, receiveTrafficReferrers( 7, days ) ).byInterval?.[ 7 ] ).toEqual( {
			loading: false,
			error: false,
			days,
		} );
	} );

	it( 'flags a failed fetch as errored and clears loading', () => {
		const prior: TrafficStatsState = { interval: 30, byInterval: { 7: { loading: true } } };

		expect( trafficStats( prior, receiveTrafficReferrersError( 7 ) ).byInterval?.[ 7 ] ).toEqual( {
			loading: false,
			error: true,
		} );
	} );

	it( 'caches each interval independently — the 7 ↔ 30 ↔ 7 reuse contract', () => {
		let state = trafficStats( undefined, receiveTrafficReferrers( 7, { '2026-05-01': day( 1 ) } ) );
		state = trafficStats( state, receiveTrafficReferrers( 30, { '2026-04-01': day( 9 ) } ) );

		// Fetching 30 must not evict the already-cached 7-day window.
		expect( state.byInterval?.[ 7 ]?.days ).toEqual( { '2026-05-01': day( 1 ) } );
		expect( state.byInterval?.[ 30 ]?.days ).toEqual( { '2026-04-01': day( 9 ) } );
	} );
} );
