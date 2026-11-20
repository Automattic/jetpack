import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useVideoLiveMetadata } from '../use-video-live-metadata';
import type { ReactNode } from 'react';

const mockFetchVideoItem = jest.fn();
jest.mock( '../../../client/lib/fetch-video-item', () => ( {
	fetchVideoItem: ( ...args: unknown[] ) => mockFetchVideoItem( ...args ),
} ) );
jest.mock( '../../../client/block-editor/blocks/playlist/use-live-metadata', () => ( {
	liveMetadataWithSignedPoster: async ( _guid: string, item: { title: string } ) => ( {
		title: item.title,
		poster: 'poster.jpg',
	} ),
} ) );

const wrapper = ( { children }: { children: ReactNode } ) => (
	<QueryClientProvider client={ new QueryClient() }>{ children }</QueryClientProvider>
);

describe( 'useVideoLiveMetadata', () => {
	beforeEach( () => mockFetchVideoItem.mockReset() );

	it( 'reads the title and poster from the videos API', async () => {
		mockFetchVideoItem.mockResolvedValue( { title: 'Sunrise' } );
		const { result } = renderHook( () => useVideoLiveMetadata( 'aaaaaaa1' ), { wrapper } );

		await waitFor( () =>
			expect( result.current ).toEqual( { title: 'Sunrise', poster: 'poster.jpg' } )
		);
	} );

	it( 'marks a video the user cannot authorize as private', async () => {
		mockFetchVideoItem.mockRejectedValue( { cause: { error: 'auth' } } );
		const { result } = renderHook( () => useVideoLiveMetadata( 'bbbbbbb2' ), { wrapper } );

		await waitFor( () =>
			expect( result.current ).toEqual( { title: 'Private video', isPrivateLocked: true } )
		);
	} );

	it( 'falls back to nothing on other failures, and skips a missing GUID', async () => {
		mockFetchVideoItem.mockRejectedValue( new Error( 'down' ) );
		const { result } = renderHook( () => useVideoLiveMetadata( 'ccccccc3' ), { wrapper } );
		await waitFor( () => expect( mockFetchVideoItem ).toHaveBeenCalled() );
		expect( result.current ).toEqual( {} );

		mockFetchVideoItem.mockClear();
		renderHook( () => useVideoLiveMetadata( undefined ), { wrapper } );
		expect( mockFetchVideoItem ).not.toHaveBeenCalled();
	} );
} );
