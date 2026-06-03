import {
	getTrafficInterval,
	getTrafficReferrers,
	getTrafficReferrersError,
	isTrafficReferrersLoading,
} from '../traffic-stats';
import type { SocialStoreState, TrafficStatsState } from '../../types';

const stateWith = ( trafficStats?: TrafficStatsState ): SocialStoreState =>
	( { connectionData: { connections: [] }, trafficStats } ) as SocialStoreState;

const days = { '2026-05-01': { groups: [] } };

describe( 'getTrafficInterval', () => {
	it( 'defaults to 30 when the slice is empty', () => {
		expect( getTrafficInterval( stateWith() ) ).toBe( 30 );
	} );

	it( 'returns the selected interval', () => {
		expect( getTrafficInterval( stateWith( { interval: 7 } ) ) ).toBe( 7 );
	} );
} );

describe( 'getTrafficReferrers', () => {
	it( 'reads the payload for the active interval when none is passed', () => {
		const state = stateWith( { interval: 7, byInterval: { 7: { days } } } );
		expect( getTrafficReferrers( state ) ).toBe( days );
	} );

	it( 'reads the payload for an explicitly requested interval', () => {
		const state = stateWith( { interval: 30, byInterval: { 7: { days } } } );
		expect( getTrafficReferrers( state, 7 ) ).toBe( days );
		expect( getTrafficReferrers( state, 30 ) ).toBeUndefined();
	} );

	it( 'returns undefined while the first fetch is unresolved', () => {
		expect( getTrafficReferrers( stateWith( { interval: 7 } ), 7 ) ).toBeUndefined();
	} );
} );

describe( 'isTrafficReferrersLoading', () => {
	it( 'is false for an untouched interval', () => {
		expect( isTrafficReferrersLoading( stateWith( { interval: 7 } ), 7 ) ).toBe( false );
	} );

	it( 'reflects the per-interval loading flag', () => {
		const state = stateWith( { interval: 30, byInterval: { 7: { loading: true } } } );
		expect( isTrafficReferrersLoading( state, 7 ) ).toBe( true );
		expect( isTrafficReferrersLoading( state, 30 ) ).toBe( false );
	} );
} );

describe( 'getTrafficReferrersError', () => {
	it( 'is false for an untouched interval', () => {
		expect( getTrafficReferrersError( stateWith( { interval: 7 } ), 7 ) ).toBe( false );
	} );

	it( 'reflects the per-interval error flag — distinct from a loaded-but-empty window', () => {
		const state = stateWith( { interval: 30, byInterval: { 90: { error: true } } } );
		expect( getTrafficReferrersError( state, 90 ) ).toBe( true );
		expect( getTrafficReferrersError( state, 30 ) ).toBe( false );
	} );
} );
