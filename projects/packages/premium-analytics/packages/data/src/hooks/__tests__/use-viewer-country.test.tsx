/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useViewerCountry } from '../use-viewer-country';
import type { ReactNode } from 'react';

describe( 'useViewerCountry', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'does not repeat the geo lookup when a second map mounts later', async () => {
		// eslint-disable-next-line jest/prefer-spy-on
		globalThis.fetch = jest
			.fn()
			.mockResolvedValue( { ok: true, json: async () => ( { country_short: 'IN' } ) } );
		const queryClient = new QueryClient();
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
		);

		const { result: firstMap, unmount } = renderHook( () => useViewerCountry(), { wrapper } );
		await waitFor( () => expect( firstMap.current.data ).toBe( 'IN' ) );
		unmount();

		const { result: secondMap } = renderHook( () => useViewerCountry(), { wrapper } );

		expect( secondMap.current.data ).toBe( 'IN' );
		expect( secondMap.current.isFetching ).toBe( false );
		expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
