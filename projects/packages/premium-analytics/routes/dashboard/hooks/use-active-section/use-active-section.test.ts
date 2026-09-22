/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useActiveSection } from './use-active-section';
import type { DashboardSection } from '../../config';

const mockSearch: { section?: string } = {};
const mockStage = jest.fn();
const mockCommit = jest.fn();

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useStagedSearch: () => ( {
		staged: mockSearch,
		effective: mockSearch,
		stage: mockStage,
		commit: mockCommit,
	} ),
} ) );

/**
 * A section with only the fields the hook reads.
 *
 * @param slug  - The section slug.
 * @param order - The section order.
 * @return The section.
 */
function section( slug: string, order: number ): DashboardSection {
	return { id: `analytics/${ slug }`, slug, label: slug, order, default_layout: [] };
}

const SECTIONS = [ section( 'traffic', 10 ), section( 'insights', 20 ), section( 'store', 30 ) ];

describe( 'useActiveSection', () => {
	beforeEach( () => {
		delete mockSearch.section;
		mockStage.mockClear();
		mockCommit.mockClear();
	} );

	it( 'reads the section from ?section= when the dashboard offers it', () => {
		mockSearch.section = 'insights';

		const { result } = renderHook( () => useActiveSection( SECTIONS ) );

		expect( result.current[ 0 ] ).toBe( 'insights' );
		expect( mockStage ).not.toHaveBeenCalled();
		expect( mockCommit ).not.toHaveBeenCalled();
	} );

	it( 'falls back to the first section without ?section= and leaves the URL alone', () => {
		const { result } = renderHook( () => useActiveSection( SECTIONS ) );

		expect( result.current[ 0 ] ).toBe( 'traffic' );
		expect( mockStage ).not.toHaveBeenCalled();
		expect( mockCommit ).not.toHaveBeenCalled();
	} );

	it( 'rewrites an unknown ?section= to the first section, replacing the history entry', () => {
		mockSearch.section = 'nope';

		const { result } = renderHook( () => useActiveSection( SECTIONS ) );

		expect( result.current[ 0 ] ).toBe( 'traffic' );
		expect( mockStage ).toHaveBeenCalledWith( { section: 'traffic' } );
		expect( mockCommit ).toHaveBeenCalledWith( { replace: true } );
	} );

	it( 'waits for the sections before judging ?section=', () => {
		mockSearch.section = 'insights';

		const { result } = renderHook( () => useActiveSection( [] ) );

		expect( result.current[ 0 ] ).toBe( '' );
		expect( mockStage ).not.toHaveBeenCalled();
		expect( mockCommit ).not.toHaveBeenCalled();
	} );

	it( 'switches sections with one history entry per change', () => {
		const { result } = renderHook( () => useActiveSection( SECTIONS ) );

		act( () => result.current[ 1 ]( 'store' ) );

		expect( mockStage ).toHaveBeenCalledWith( { section: 'store' } );
		expect( mockCommit ).toHaveBeenCalledWith( { replace: false } );
	} );
} );
