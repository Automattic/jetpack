import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useFreeTier } from '../free-tier';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn(),
	getSiteData: jest.fn( () => ( { wpcom: { blog_id: 42 } } ) ),
} ) );

const wrapper = ( { children }: { children: ReactNode } ) => (
	<QueryClientProvider
		client={ new QueryClient( { defaultOptions: { queries: { retry: false } } } ) }
	>
		{ children }
	</QueryClientProvider>
);

const OPTIONS = { subscription_options: { free_tier_description: 'Hi', hide_free_tier: 1 } };

describe( 'useFreeTier', () => {
	it.each( [
		[ 'Jetpack’s settings off Simple', false, '/jetpack/v4/settings', OPTIONS, '' ],
		[
			'WordPress.com’s settings on Simple',
			true,
			'/rest/v1.4/sites/42/settings',
			{ settings: { ...OPTIONS, free_tier_description_rendered: '<p>Hi</p>' } },
			'<p>Hi</p>',
		],
	] )( 'reads %s', async ( _name, simple, path, response, descriptionHtml ) => {
		( isSimpleSite as jest.Mock ).mockReturnValue( simple );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( response );
		const { result } = renderHook( () => useFreeTier(), { wrapper } );

		await waitFor( () =>
			expect( result.current.data ).toEqual( { description: 'Hi', descriptionHtml, hidden: true } )
		);
		expect( apiFetch ).toHaveBeenCalledWith( { path } );
	} );

	it( 'fails on Simple without a blog ID, rather than asking for site 0', async () => {
		( isSimpleSite as jest.Mock ).mockReturnValue( true );
		( getSiteData as jest.Mock ).mockReturnValueOnce( {} );
		( apiFetch as unknown as jest.Mock ).mockClear();

		const { result } = renderHook( () => useFreeTier(), { wrapper } );

		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( apiFetch ).not.toHaveBeenCalled();
	} );
} );
