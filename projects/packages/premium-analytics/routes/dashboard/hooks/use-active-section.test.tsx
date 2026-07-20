/**
 * External dependencies
 */
import { useStagedSearch } from '@jetpack-premium-analytics/routing';
import { act, renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useActiveSection } from './use-active-section';
import type { DashboardSection } from '../config';

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useStagedSearch: jest.fn(),
} ) );

const mockUseStagedSearch = useStagedSearch as jest.Mock;

const SECTIONS: DashboardSection[] = [
	{ id: 'analytics/traffic', slug: 'traffic', label: 'Traffic', order: 10 },
	{ id: 'analytics/insights', slug: 'insights', label: 'Insights', order: 20 },
];

/**
 * Mock the staged-search state with a given `?section=` value.
 *
 * @param section - The effective section search param.
 * @return The stage and commit spies.
 */
function mockSearch( section: string | undefined ) {
	const stage = jest.fn();
	const commit = jest.fn();
	mockUseStagedSearch.mockReturnValue( { effective: { section }, stage, commit } );

	return { stage, commit };
}

beforeEach( () => {
	mockUseStagedSearch.mockReset();
} );

describe( 'useActiveSection', () => {
	it( 'keeps a valid section slug and leaves the URL alone', () => {
		const { stage, commit } = mockSearch( 'insights' );

		const { result } = renderHook( () => useActiveSection( SECTIONS ) );

		expect( result.current[ 0 ] ).toBe( 'insights' );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'falls back to the first section and rewrites the URL for a stale slug', () => {
		const { stage, commit } = mockSearch( 'store' );

		const { result } = renderHook( () => useActiveSection( SECTIONS ) );

		expect( result.current[ 0 ] ).toBe( 'traffic' );
		expect( stage ).toHaveBeenCalledWith( { section: 'traffic' } );
		expect( commit ).toHaveBeenCalledWith( { replace: true } );
	} );

	it( 'defaults to the first section without rewriting a clean URL', () => {
		const { stage, commit } = mockSearch( undefined );

		const { result } = renderHook( () => useActiveSection( SECTIONS ) );

		expect( result.current[ 0 ] ).toBe( 'traffic' );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'does not rewrite while the section list is still empty', () => {
		const { stage, commit } = mockSearch( 'traffic' );

		const { result } = renderHook( () => useActiveSection( [] ) );

		expect( result.current[ 0 ] ).toBe( '' );
		expect( stage ).not.toHaveBeenCalled();
		expect( commit ).not.toHaveBeenCalled();
	} );

	it( 'pushes one history entry per explicit section switch', () => {
		const { stage, commit } = mockSearch( 'traffic' );

		const { result } = renderHook( () => useActiveSection( SECTIONS ) );

		act( () => {
			result.current[ 1 ]( 'insights' );
		} );

		expect( stage ).toHaveBeenCalledWith( { section: 'insights' } );
		expect( commit ).toHaveBeenCalledWith( { replace: false } );
	} );
} );
