/**
 * The router boundary: `useSearch` reads the in-memory search state and
 * `useNavigate` applies the committed patch to it.
 */
const mockNavigate = jest.fn();
let mockSearch: Record< string, unknown > = {};

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: () => mockSearch,
} ) );

jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { TZDate } from '@date-fns/tz';
import { PeriodChangeSignalProvider, useSettlePeriodChange } from '@jetpack-premium-analytics/data';
import { act, renderHook } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { planGatesScriptData } from '../../../../../../tests/js/plan-gates-test-utils';
import { useOpenSectionRange } from '../use-open-section-range';
import type { ReactNode } from 'react';

setSettings( {
	...getSettings(),
	timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
} );

const NOVEMBER = {
	from: new TZDate( '2025-11-01T00:00:00.000+00:00', 'UTC' ),
	to: new TZDate( '2025-11-30T23:59:59.999+00:00', 'UTC' ),
};

describe( 'useOpenSectionRange', () => {
	beforeEach( () => {
		( getScriptData as jest.Mock ).mockReturnValue( undefined );
		mockNavigate.mockReset();
		mockNavigate.mockImplementation(
			( {
				search,
			}: {
				search: ( prev: Record< string, unknown > ) => Record< string, unknown >;
			} ) => {
				mockSearch = search( mockSearch );
			}
		);
	} );

	it( 'commits the section and the range together, as one history entry', () => {
		mockSearch = { section: 'insights', preset: 'year-2026', from: 'x', to: 'y' };
		const { result } = renderHook( () => useOpenSectionRange() );

		act( () => result.current( 'traffic', NOVEMBER ) );

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockNavigate.mock.calls[ 0 ][ 0 ] ).toMatchObject( { replace: false } );
		expect( mockSearch ).toEqual( {
			section: 'traffic',
			preset: 'custom',
			from: '2025-11-01T00:00:00.000+00:00',
			to: '2025-11-30T23:59:59.999+00:00',
			interval: 'day',
		} );
	} );

	it( 'signals the period change to the section it opens', () => {
		mockSearch = { section: 'insights' };
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<PeriodChangeSignalProvider>{ children }</PeriodChangeSignalProvider>
		);
		const { result } = renderHook(
			() => ( {
				open: useOpenSectionRange(),
				traffic: useSettlePeriodChange( 'traffic', NOVEMBER, true ),
			} ),
			{ wrapper }
		);

		act( () => result.current.open( 'traffic', NOVEMBER ) );

		expect( result.current.traffic ).toEqual( expect.any( Number ) );
	} );

	it.each( [
		[ 'traffic', 'day' ],
		[ 'store', 'month' ],
	] )( 'opens a long range on %s within its plan buckets: %s', ( section, interval ) => {
		( getScriptData as jest.Mock ).mockReturnValue( planGatesScriptData( [ 'intervals' ] ) );
		mockSearch = {};
		const { result } = renderHook( () => useOpenSectionRange() );

		act( () =>
			result.current( section, {
				from: new TZDate( '2025-01-01T00:00:00.000+00:00', 'UTC' ),
				to: new TZDate( '2025-12-31T23:59:59.999+00:00', 'UTC' ),
			} )
		);

		expect( mockSearch.interval ).toBe( interval );
	} );

	it( 'keeps the range ends exactly as given', () => {
		mockSearch = {};
		const to = new TZDate( '2026-03-15T12:00:00.000+00:00', 'UTC' );
		const { result } = renderHook( () => useOpenSectionRange() );

		act( () => result.current( 'traffic', { from: NOVEMBER.from, to } ) );

		expect( mockSearch.to ).toBe( '2026-03-15T12:00:00.000+00:00' );
	} );
} );
