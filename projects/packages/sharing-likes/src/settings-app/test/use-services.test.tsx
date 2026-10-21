import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useServices } from '../data/queries';
import { createTestRegistry, wrapperFor } from './helpers';
import type { Services } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const services: Services = { visible: [ 'x' ], hidden: [], services: [] };

describe( 'useServices', () => {
	it( 'reads the services again when a list that could not be loaded appears again', async () => {
		mockApiFetch.mockReset();
		mockApiFetch.mockRejectedValueOnce( { message: 'Gone.' } ).mockResolvedValue( services );
		const wrapper = wrapperFor( createTestRegistry() );

		const { result: failed, unmount } = renderHook( () => useServices( true ), { wrapper } );
		await waitFor( () => expect( failed.current.isPending ).toBe( false ) );
		expect( failed.current.data ).toBeUndefined();
		unmount();

		const { result } = renderHook( () => useServices( true ), { wrapper } );
		await waitFor( () => expect( result.current.data ).toEqual( services ) );
	} );
} );
