import { isSimpleSite } from '@automattic/jetpack-script-data';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { getSectionState } from '../state';
import { useWpcomAdsSync } from '../use-wpcom-ads-settings';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../state', () => ( { getSectionState: jest.fn() } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( { isSimpleSite: jest.fn() } ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;
const SYNC = { path: '/jetpack/v4/monetize/ads/sync', method: 'POST' };

/**
 * Render the hook as the dashboard would.
 *
 * @param canUseWpcom    - Whether the user is connected.
 * @param wpcomOutOfDate - What the server printed.
 * @param client         - The page's query client, shared across remounts.
 * @return The hook's result.
 */
function renderSync( canUseWpcom: boolean, wpcomOutOfDate = false, client = new QueryClient() ) {
	( getSectionState as jest.Mock ).mockReturnValue( { wpcomOutOfDate } );
	const wrapper = ( { children }: { children: ReactNode } ) => (
		<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
	);
	return renderHook( () => useWpcomAdsSync( canUseWpcom ), { wrapper } );
}

describe( 'useWpcomAdsSync', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		( isSimpleSite as jest.Mock ).mockReturnValue( false );
		mockedApiFetch.mockReset().mockResolvedValue( { synced: true } );
	} );

	afterEach( () => jest.useRealTimers() );

	it.each( [
		[ 'catches up on load when WordPress.com is behind', true, true, false, 1 ],
		[ 'waits for a connected user', false, true, false, 0 ],
		[ 'leaves an up-to-date copy alone', true, false, false, 0 ],
		[ 'never syncs on Simple, which has no sync route', true, true, true, 0 ],
	] )( '%s', async ( _name, canUseWpcom, outOfDate, simple, requests ) => {
		( isSimpleSite as jest.Mock ).mockReturnValue( simple );
		renderSync( canUseWpcom, outOfDate );
		await act( () => jest.runAllTimersAsync() );

		expect( mockedApiFetch ).toHaveBeenCalledTimes( requests );
	} );

	it( 'sends one catch-up after a burst of changes', async () => {
		const { result } = renderSync( true );

		act( () => {
			result.current();
			result.current();
			result.current();
		} );
		await act( () => jest.runAllTimersAsync() );

		expect( mockedApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( mockedApiFetch ).toHaveBeenCalledWith( SYNC );
	} );

	it( 'catches up once per page, however often the tab remounts', async () => {
		const client = new QueryClient();
		renderSync( true, true, client ).unmount();
		await act( () => jest.runAllTimersAsync() );
		renderSync( true, true, client );
		await act( () => jest.runAllTimersAsync() );

		expect( mockedApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'sends a pending catch-up when the tab unmounts', () => {
		const { result, unmount } = renderSync( true );

		act( () => result.current() );
		unmount();

		expect( mockedApiFetch ).toHaveBeenCalledWith( SYNC );
	} );
} );
