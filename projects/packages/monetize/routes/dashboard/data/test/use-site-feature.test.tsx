import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useSiteHasFeature } from '../use-site-feature';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( { isWpcomPlatformSite: jest.fn() } ) );

describe( 'useSiteHasFeature', () => {
	it( 'trusts the server’s answer on WordPress.com sites, which cannot reach Jetpack’s endpoint', () => {
		( isWpcomPlatformSite as jest.Mock ).mockReturnValue( true );
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<QueryClientProvider client={ new QueryClient() }>{ children }</QueryClientProvider>
		);

		const { result } = renderHook( () => useSiteHasFeature( 'wordads', false ), { wrapper } );

		expect( result.current ).toBe( false );
		expect( apiFetch ).not.toHaveBeenCalled();
	} );
} );
