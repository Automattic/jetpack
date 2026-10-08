import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { queryKeys, useServices, useSettings, useStatus } from '../data/queries';
import { useSaveServices } from '../data/use-save-services';
import {
	apiCalls,
	baseSettings,
	baseStatus,
	createTestQueryClient,
	resetNotices,
	snackbarMessages,
	wrapperFor,
} from './helpers';
import type { Services } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const services: Services = {
	visible: [ 'facebook', 'x' ],
	hidden: [ 'email' ],
	services: [
		{ id: 'facebook', name: 'Facebook', custom: false, deprecated: false },
		{ id: 'x', name: 'X', custom: false, deprecated: false },
		{ id: 'email', name: 'Email', custom: false, deprecated: false },
	],
};

/**
 * Render the hook beside active status, settings and services queries, as the screen does.
 *
 * @return Hook result and query client.
 */
function renderSave() {
	const queryClient = createTestQueryClient();
	queryClient.setQueryData( queryKeys.services, services );
	const { result } = renderHook(
		() => {
			useStatus();
			useSettings();
			useServices( true );
			return useSaveServices();
		},
		{ wrapper: wrapperFor( queryClient ) }
	);
	return { result, queryClient };
}

/**
 * A promise and the functions that settle it.
 *
 * @return Deferred.
 */
function deferred< T >() {
	let resolve!: ( value: T ) => void;
	let reject!: ( reason: unknown ) => void;
	const promise = new Promise< T >( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

beforeEach( () => {
	mockApiFetch.mockReset();
	resetNotices();
} );

describe( 'useSaveServices', () => {
	it( 'sends both lists and keeps what the server answers', async () => {
		const saved = { ...services, visible: [ 'x', 'facebook' ] };
		mockApiFetch.mockImplementation( ( { method } ) =>
			Promise.resolve( method === 'PUT' ? saved : services )
		);
		const { result, queryClient } = renderSave();

		await act( () => result.current( { visible: [ 'x', 'facebook' ], hidden: [ 'email' ] } ) );

		expect( apiCalls( 'PUT' ) ).toEqual( [
			{
				path: '/wpcom/v2/sharing-likes/services',
				method: 'PUT',
				data: { visible: [ 'x', 'facebook' ], hidden: [ 'email' ] },
			},
		] );
		expect( queryClient.getQueryData( queryKeys.services ) ).toEqual( saved );
		expect( snackbarMessages() ).toContain( 'Settings have been saved' );
	} );

	it( 'puts the lists back, shows the server message and rereads status when refused', async () => {
		mockApiFetch.mockImplementation( ( { method, path } ) => {
			if ( method === 'PUT' ) {
				return Promise.reject( {
					message: 'Sharing buttons are not available on this site right now.',
				} );
			}
			// A services read that never lands, so only the rollback can restore the order.
			if ( path?.endsWith( '/services' ) ) {
				return new Promise( () => {} );
			}
			return Promise.resolve( path?.endsWith( '/status' ) ? baseStatus : baseSettings );
		} );
		const { result, queryClient } = renderSave();

		await act( () => result.current( { visible: [ 'x', 'facebook' ], hidden: [ 'email' ] } ) );

		expect( queryClient.getQueryData< Services >( queryKeys.services )?.visible ).toEqual( [
			'facebook',
			'x',
		] );
		expect( snackbarMessages() ).toContain(
			'Sharing buttons are not available on this site right now.'
		);
		await waitFor( () =>
			expect( apiCalls() ).toContainEqual( { path: '/wpcom/v2/sharing-likes/status' } )
		);
	} );

	it( "keeps a queued save's order when an earlier save lands", async () => {
		const first = deferred< Services >();
		const second = deferred< Services >();
		let puts = 0;
		mockApiFetch.mockImplementation( ( { method } ) => {
			if ( method !== 'PUT' ) {
				return Promise.resolve( services );
			}
			puts += 1;
			return puts === 1 ? first.promise : second.promise;
		} );
		const { result, queryClient } = renderSave();

		let saves: Promise< unknown >[] = [];
		act( () => {
			saves = [
				result.current( { visible: [ 'x', 'facebook' ], hidden: [ 'email' ] } ),
				result.current( { visible: [ 'x', 'email', 'facebook' ], hidden: [] } ),
			];
		} );
		await act( async () => first.resolve( { ...services, visible: [ 'x', 'facebook' ] } ) );

		expect( queryClient.getQueryData< Services >( queryKeys.services )?.visible ).toEqual( [
			'x',
			'email',
			'facebook',
		] );

		await act( async () => {
			second.resolve( { ...services, visible: [ 'x', 'email', 'facebook' ], hidden: [] } );
			await Promise.all( saves );
		} );
	} );

	it( 'rereads status and settings once no service is left', async () => {
		mockApiFetch.mockImplementation( ( { method } ) =>
			Promise.resolve( method === 'PUT' ? { ...services, visible: [], hidden: [] } : baseStatus )
		);
		const { result } = renderSave();

		await act( () => result.current( { visible: [], hidden: [] } ) );

		await waitFor( () => {
			expect( apiCalls() ).toContainEqual( { path: '/wpcom/v2/sharing-likes/status' } );
		} );
		expect( apiCalls() ).toContainEqual( { path: '/wpcom/v2/sharing-likes/settings' } );
	} );

	it( 'offers an Undo that saves the lists as they were', async () => {
		mockApiFetch.mockImplementation( ( { method, data } ) =>
			Promise.resolve( method === 'PUT' ? { ...services, ...( data as object ) } : services )
		);
		const { result } = renderSave();

		await act( () =>
			result.current(
				{ visible: [ 'facebook' ], hidden: [ 'email' ] },
				{ message: 'X removed.', undoable: true }
			)
		);
		const notice = select( noticesStore )
			.getNotices()
			.find( ( { content } ) => content === 'X removed.' );
		await act( async () => notice?.actions?.[ 0 ]?.onClick?.() );

		await waitFor( () =>
			expect( apiCalls( 'PUT' ).at( -1 ) ).toMatchObject( {
				data: { visible: [ 'facebook', 'x' ], hidden: [ 'email' ] },
			} )
		);
	} );
} );
