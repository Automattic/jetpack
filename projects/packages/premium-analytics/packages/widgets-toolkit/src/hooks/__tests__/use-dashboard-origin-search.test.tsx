let mockSearch: Record< string, unknown > = {};

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch,
} ) );

/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { DashboardSectionProvider, useDashboardOriginSearch } from '../use-dashboard-origin-search';
import type { ReactNode } from 'react';

const onDashboardTab =
	( section: string ) =>
	( { children }: { children: ReactNode } ) => (
		<DashboardSectionProvider section={ section }>{ children }</DashboardSectionProvider>
	);

describe( 'useDashboardOriginSearch', () => {
	beforeEach( () => {
		mockSearch = {};
	} );

	it( 'names the active tab on the dashboard, not the URL section', () => {
		mockSearch = { section: 'traffic', dashboard_section: 'stale' };

		const { result } = renderHook( () => useDashboardOriginSearch(), {
			wrapper: onDashboardTab( 'ads' ),
		} );

		expect( result.current ).toEqual( { dashboard_section: 'ads' } );
	} );

	it( 'forwards the carried origin off the dashboard', () => {
		mockSearch = { section: 'posts-pages', dashboard_section: 'insights' };

		const { result } = renderHook( () => useDashboardOriginSearch() );

		expect( result.current ).toEqual( { dashboard_section: 'insights' } );
	} );

	it( 'ignores the page section when no origin is carried', () => {
		mockSearch = { section: 'posts-pages' };

		const { result } = renderHook( () => useDashboardOriginSearch() );

		expect( result.current ).toEqual( {} );
	} );
} );
