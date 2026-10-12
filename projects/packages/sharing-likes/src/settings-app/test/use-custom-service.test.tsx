import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { queryKeys, useServices } from '../data/queries';
import { useCustomService } from '../data/use-custom-service';
import {
	apiCalls,
	createTestQueryClient,
	resetNotices,
	snackbarMessages,
	wrapperFor,
} from './helpers';
import type { Service, Services } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const hackerNews: Service = {
	id: 'custom-1759830000',
	name: 'Hacker News',
	custom: true,
	deprecated: false,
	url: 'https://news.ycombinator.com/submitlink?u=%post_url%',
	icon: 'https://news.ycombinator.com/favicon.ico',
};

const services: Services = {
	visible: [ 'facebook' ],
	hidden: [ hackerNews.id ],
	services: [ { id: 'facebook', name: 'Facebook', custom: false, deprecated: false }, hackerNews ],
};

const lobsters = {
	name: 'Lobsters',
	url: 'https://l.example/?u=%post_url%',
	icon: 'https://l.example/i.png',
};

/**
 * Answer every route like the server would for this site.
 *
 * @param created - Service the create route answers with, or an error to reject with.
 */
function respond(
	created: Service | { message: string } = {
		...lobsters,
		id: 'custom-1759830001',
		custom: true,
		deprecated: false,
	}
) {
	mockApiFetch.mockImplementation( ( { path, method, data } ) => {
		if ( path?.endsWith( '/services/custom' ) ) {
			return 'id' in created ? Promise.resolve( created ) : Promise.reject( created );
		}
		if ( method === 'DELETE' ) {
			return Promise.resolve( { deleted: true, id: hackerNews.id } );
		}
		if ( method === 'PUT' && path?.endsWith( '/services' ) ) {
			return Promise.resolve( { ...services, ...( data as object ) } );
		}
		return Promise.resolve( services );
	} );
}

/**
 * Render the hook beside an active services query.
 *
 * @return Render result.
 */
function renderCustom() {
	const queryClient = createTestQueryClient();
	queryClient.setQueryData( queryKeys.services, services );
	return renderHook(
		() => {
			useServices( true );
			return useCustomService();
		},
		{ wrapper: wrapperFor( queryClient ) }
	);
}

beforeEach( () => {
	mockApiFetch.mockReset();
	resetNotices();
} );

describe( 'useCustomService', () => {
	it.each( [
		[ 'visible', { visible: [ 'facebook', 'custom-1759830001' ], hidden: [ hackerNews.id ] } ],
		[ 'hidden', { visible: [ 'facebook' ], hidden: [ hackerNews.id, 'custom-1759830001' ] } ],
	] as const )(
		'creates a service, then saves it at the end of the %s row',
		async ( row, lists ) => {
			respond();
			const { result } = renderCustom();

			await act( () => result.current.create( lobsters, row ) );

			expect( apiCalls( 'POST' ) ).toEqual( [
				{ path: '/wpcom/v2/sharing-likes/services/custom', method: 'POST', data: lobsters },
			] );
			expect( apiCalls( 'PUT' ) ).toEqual( [
				{ path: '/wpcom/v2/sharing-likes/services', method: 'PUT', data: lists },
			] );
		}
	);

	it( 'saves no list when the server refuses the new service', async () => {
		respond( { message: 'A custom service needs a name, a sharing URL and an icon URL.' } );
		const { result } = renderCustom();

		let created: boolean | undefined;
		await act( async () => {
			created = await result.current.create( { name: 'x', url: '', icon: '' }, 'visible' );
		} );

		expect( created ).toBe( false );
		expect( apiCalls( 'PUT' ) ).toEqual( [] );
	} );

	it( 'deletes an enabled service, then saves the lists without it', async () => {
		respond();
		const { result } = renderCustom();

		await act( () => result.current.remove( hackerNews.id ) );

		expect( apiCalls( 'DELETE' ) ).toEqual( [
			{ path: `/wpcom/v2/sharing-likes/services/custom/${ hackerNews.id }`, method: 'DELETE' },
		] );
		expect( apiCalls( 'PUT' ) ).toEqual( [
			{
				path: '/wpcom/v2/sharing-likes/services',
				method: 'PUT',
				data: { visible: [ 'facebook' ], hidden: [] },
			},
		] );
	} );

	it( 'says the service could not be deleted when the delete fails', async () => {
		mockApiFetch.mockImplementation( ( { method } ) =>
			method === 'DELETE' ? Promise.reject( {} ) : Promise.resolve( services )
		);
		const { result } = renderCustom();

		await act( () => result.current.remove( hackerNews.id ) );

		expect( snackbarMessages() ).toContain( 'The custom service could not be deleted.' );
	} );
} );
