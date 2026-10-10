/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../../../tests/js/route-test-utils';
import { DashboardSectionProvider, useDashboardOriginSearch } from '../use-dashboard-origin-search';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../../../../../tests/js/route-test-utils' );

	return mockWordPressRoute;
} );

const onDashboardTab =
	( section: string ) =>
	( { children }: { children: ReactNode } ) => (
		<DashboardSectionProvider section={ section }>{ children }</DashboardSectionProvider>
	);

describe( 'useDashboardOriginSearch', () => {
	beforeEach( () => {
		setMockRouteSearch();
	} );

	it( 'names the active tab on the dashboard, not the URL section', () => {
		setMockRouteSearch( { section: 'traffic', ds: 'stale' } );

		const { result } = renderHook( () => useDashboardOriginSearch(), {
			wrapper: onDashboardTab( 'ads' ),
		} );

		expect( result.current ).toEqual( { ds: 'ads' } );
	} );

	it( 'forwards the carried origin off the dashboard', () => {
		setMockRouteSearch( { section: 'posts-pages', ds: 'insights' } );

		const { result } = renderHook( () => useDashboardOriginSearch() );

		expect( result.current ).toEqual( { ds: 'insights' } );
	} );

	it( 'ignores the page section when no origin is carried', () => {
		setMockRouteSearch( { section: 'posts-pages' } );

		const { result } = renderHook( () => useDashboardOriginSearch() );

		expect( result.current ).toEqual( {} );
	} );
} );
