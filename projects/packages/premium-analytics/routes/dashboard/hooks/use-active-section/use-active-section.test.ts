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
const mockStaged: { section?: string } = {};
const mockStage = jest.fn();
const mockCommit = jest.fn();

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useStagedSearch: () => ( {
		committed: mockSearch,
		staged: mockStaged,
		effective: { ...mockSearch, ...mockStaged },
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
		delete mockStaged.section;
		mockStage.mockReset();
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

	it( 'keeps a ?section= the stage renders itself instead of rewriting it', () => {
		mockSearch.section = 'settings';
		const { result } = renderHook( () => useActiveSection( SECTIONS, [ 'settings' ] ) );

		expect( result.current[ 0 ] ).toBe( 'settings' );
		expect( mockStage ).not.toHaveBeenCalled();
	} );

	it( 'waits for the sections before judging ?section=', () => {
		mockSearch.section = 'insights';

		const { result } = renderHook( () => useActiveSection( [] ) );

		expect( result.current[ 0 ] ).toBe( '' );
		expect( mockStage ).not.toHaveBeenCalled();
		expect( mockCommit ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'alone', undefined, { section: 'store' } ],
		[
			'with the search the caller adds',
			() => ( { preset: 'all-time' } ),
			{ preset: 'all-time', section: 'store' },
		],
	] )(
		'switches sections %s, with one history entry per change',
		( _case, switchSearch, staged ) => {
			const { result } = renderHook( () => useActiveSection( SECTIONS, [], switchSearch ) );

			act( () => result.current[ 1 ]( 'store' ) );

			expect( mockStage ).toHaveBeenCalledTimes( 1 );
			expect( mockStage ).toHaveBeenCalledWith( staged );
			expect( mockCommit ).toHaveBeenCalledTimes( 1 );
			expect( mockCommit ).toHaveBeenCalledWith( { replace: false } );
		}
	);

	it( 'switches the active section at once and reports it committed when the router lands', () => {
		mockSearch.section = 'traffic';
		mockStage.mockImplementation( patch => Object.assign( mockStaged, patch ) );
		const { result, rerender } = renderHook( () => useActiveSection( SECTIONS ) );

		act( () => result.current[ 1 ]( 'store' ) );
		rerender();

		expect( result.current[ 0 ] ).toBe( 'store' );
		expect( result.current[ 2 ] ).toBe( false );

		mockSearch.section = 'store';
		rerender();

		expect( result.current[ 2 ] ).toBe( true );
	} );
} );
