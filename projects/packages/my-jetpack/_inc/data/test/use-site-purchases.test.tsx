import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useSitePurchases from '../use-site-purchases';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../../hooks/use-my-jetpack-connection' );
jest.mock( '../notices/use-fetching-error-notice', () => ( {
	useFetchingErrorNotice: jest.fn(),
} ) );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;
const mockUseMyJetpackConnection = useMyJetpackConnection as jest.MockedFunction<
	typeof useMyJetpackConnection
>;

const wrapper = ( { children }: { children: ReactNode } ) => (
	<QueryClientProvider client={ new QueryClient() }>{ children }</QueryClientProvider>
);

describe( 'useSitePurchases', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockApiFetch.mockResolvedValue( [] );
	} );

	it.each( [
		[ false, true, false ],
		[ true, false, false ],
		[ true, true, true ],
	] )(
		'fetches when connected is %s and enabled is %s: %s',
		async ( isSiteConnected, enabled, fetches ) => {
			mockUseMyJetpackConnection.mockReturnValue( {
				isSiteConnected,
			} as ReturnType< typeof useMyJetpackConnection > );

			const { result } = renderHook( () => useSitePurchases( { enabled } ), { wrapper } );

			await waitFor( () => expect( result.current.fetchStatus ).toBe( 'idle' ) );
			expect( mockApiFetch ).toHaveBeenCalledTimes( fetches ? 1 : 0 );
		}
	);
} );
