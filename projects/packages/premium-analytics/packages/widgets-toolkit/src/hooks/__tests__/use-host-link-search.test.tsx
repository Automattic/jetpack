/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../../../tests/js/route-test-utils';
import { DashboardSectionProvider } from '../use-dashboard-origin-search';
import { useHostLinkSearch } from '../use-host-link-search';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../../../../../tests/js/route-test-utils' );

	return mockWordPressRoute;
} );

describe( 'useHostLinkSearch', () => {
	afterEach( () => {
		setMockRouteSearch();
	} );

	it( 'carries the report window from the URL and the dashboard tab from its section', () => {
		setMockRouteSearch( { from: '2026-03-01', to: '2026-03-10', interval: 'day', foo: 'bar' } );

		const { result } = renderHook( () => useHostLinkSearch(), {
			wrapper: ( { children }: { children: ReactNode } ) => (
				<DashboardSectionProvider section="traffic">{ children }</DashboardSectionProvider>
			),
		} );

		expect( result.current ).toMatchObject( {
			from: '2026-03-01',
			to: '2026-03-10',
			interval: 'day',
			ds: 'traffic',
		} );
		expect( result.current ).not.toHaveProperty( 'foo' );
	} );
} );
