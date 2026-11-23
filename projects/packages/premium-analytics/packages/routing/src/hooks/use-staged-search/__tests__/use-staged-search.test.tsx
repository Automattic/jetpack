const mockNavigate = jest.fn();

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: () => ( {} ),
} ) );

/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { DASHBOARD_PAGE_SLUG } from '../../../dashboard-href';
import { useStagedSearch } from '../use-staged-search';

const shell = ( type: 'page-hidden' | 'page-shown', page: string ) =>
	window.dispatchEvent( new CustomEvent( `jetpack-admin-shell:${ type }`, { detail: { page } } ) );

describe( 'useStagedSearch', () => {
	it( 'holds a commit while the admin shell shows another dashboard, then writes it', () => {
		const { result } = renderHook( () =>
			useStagedSearch< { section?: string }, '/' >( { from: '/' } )
		);
		const commit = ( section: string ) =>
			act( () => {
				result.current.stage( { section } );
				result.current.commit( { replace: true } );
			} );

		commit( 'traffic' );
		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );

		shell( 'page-hidden', 'jetpack-videopress' );
		commit( 'posts' );
		expect( mockNavigate ).toHaveBeenCalledTimes( 2 );

		shell( 'page-hidden', DASHBOARD_PAGE_SLUG );
		commit( 'videos' );
		expect( mockNavigate ).toHaveBeenCalledTimes( 2 );

		shell( 'page-shown', 'jetpack-videopress' );
		expect( mockNavigate ).toHaveBeenCalledTimes( 2 );
		shell( 'page-shown', DASHBOARD_PAGE_SLUG );
		expect( mockNavigate ).toHaveBeenCalledTimes( 3 );
		expect( mockNavigate.mock.calls[ 2 ][ 0 ] ).toMatchObject( { replace: true } );
	} );
} );
