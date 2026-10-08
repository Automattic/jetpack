const mockNavigate = jest.fn();
let mockSearch: Record< string, unknown > = {};

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: () => mockSearch,
} ) );

/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useSectionTab } from '../use-section-tab';

type Tab = 'posts' | 'archives';

const resolveTab = ( value: string | undefined ): Tab =>
	value === 'archives' ? 'archives' : 'posts';

describe( 'useSectionTab', () => {
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

	it( 'switches tabs as one history entry and keeps the other search params', () => {
		mockSearch = { from: '2026-09-01', section: 'posts' };
		const { result, rerender } = renderHook( () => useSectionTab( '/reports/posts', resolveTab ) );

		act( () => result.current[ 1 ]( 'archives' ) );
		rerender();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockNavigate.mock.calls[ 0 ][ 0 ] ).toMatchObject( { replace: false } );
		expect( mockSearch ).toEqual( { from: '2026-09-01', section: 'archives' } );
		expect( result.current[ 0 ] ).toBe( 'archives' );
	} );
} );
