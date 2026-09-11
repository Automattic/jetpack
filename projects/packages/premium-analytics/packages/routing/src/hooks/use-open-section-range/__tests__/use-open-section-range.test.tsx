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

/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { act, renderHook } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { useOpenSectionRange } from '../use-open-section-range';

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

	it( 'keeps the range ends exactly as given', () => {
		mockSearch = {};
		const to = new TZDate( '2026-03-15T12:00:00.000+00:00', 'UTC' );
		const { result } = renderHook( () => useOpenSectionRange() );

		act( () => result.current( 'traffic', { from: NOVEMBER.from, to } ) );

		expect( mockSearch.to ).toBe( '2026-03-15T12:00:00.000+00:00' );
	} );
} );
