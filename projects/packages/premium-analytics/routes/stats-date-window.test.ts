/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { DASHBOARD_PREFERENCES_SCOPE, getStatsDatePolicy } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { planGatesScriptData } from '../tests/js/plan-gates-test-utils';
import { dashboardSectionOf, limitStatsDateSearch } from './stats-date-window';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

const setLocks = ( locked: string[], sections = [ 'traffic', 'store' ] ) =>
	( getScriptData as jest.Mock ).mockReturnValue( planGatesScriptData( locked, sections ) );

beforeEach( () => {
	jest.useFakeTimers().setSystemTime( new Date( '2026-10-15T12:00:00Z' ) );
	setLocks( [ 'recent-7-days' ] );
} );

afterEach( () => {
	jest.useRealTimers();
	dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', undefined );
} );

describe( 'limitStatsDateSearch', () => {
	it( 'opens a window the reader did not ask for on their default preset', () => {
		dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', 'yesterday' );
		const seeded = {
			preset: 'all-time',
			from: '2005-01-01',
			to: '2026-10-15',
			interval: 'month',
		};

		const limited = limitStatsDateSearch( seeded, getStatsDatePolicy() );

		expect( limited ).toMatchObject( { preset: 'yesterday' } );
	} );
} );

describe( 'dashboardSectionOf', () => {
	it.each( [
		[ 'traffic', [ 'traffic', 'store' ], 'traffic' ],
		[ 'store', [ 'traffic', 'store' ], 'store' ],
		[ undefined, [ 'traffic', 'store' ], 'traffic' ],
		[ undefined, [ 'store' ], 'store' ],
		[ 'unknown-tab', [ 'traffic' ], 'traffic' ],
	] )( 'resolves %p among %p to %p', ( section, sections, expected ) => {
		setLocks( [ 'recent-7-days' ], sections );

		expect( dashboardSectionOf( section ) ).toBe( expected );
	} );
} );
