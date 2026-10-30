import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { store } from '../data/store';
import { useSaveServices } from '../data/use-save-services';
import {
	apiCalls,
	baseSettings,
	baseStatus,
	createTestRegistry,
	notices,
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
		{ id: 'facebook', name: 'Facebook', custom: false, deprecated: false, legacy: false },
		{ id: 'x', name: 'X', custom: false, deprecated: false, legacy: false },
		{ id: 'email', name: 'Email', custom: false, deprecated: false, legacy: false },
	],
};

/**
 * Render the hook in a registry seeded with the services.
 *
 * @return Hook result and registry.
 */
function renderSave() {
	const registry = createTestRegistry( { services } );
	const { result } = renderHook( () => useSaveServices(), { wrapper: wrapperFor( registry ) } );
	return { result, registry };
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
} );

describe( 'useSaveServices', () => {
	it( 'sends both lists and keeps what the server answers', async () => {
		const saved = { ...services, visible: [ 'x', 'facebook' ] };
		mockApiFetch.mockImplementation( ( { method } ) =>
			Promise.resolve( method === 'PUT' ? saved : services )
		);
		const { result, registry } = renderSave();

		await act( () => result.current( { visible: [ 'x', 'facebook' ], hidden: [ 'email' ] } ) );

		expect( apiCalls( 'PUT' ) ).toEqual( [
			{
				path: '/wpcom/v2/sharing-likes/services',
				method: 'PUT',
				data: { visible: [ 'x', 'facebook' ], hidden: [ 'email' ] },
			},
		] );
		expect( registry.select( store ).getServices() ).toEqual( saved );
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
		const { result, registry } = renderSave();

		await act( () => result.current( { visible: [ 'x', 'facebook' ], hidden: [ 'email' ] } ) );

		expect( registry.select( store ).getServices()?.visible ).toEqual( [ 'facebook', 'x' ] );
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
		const { result, registry } = renderSave();

		let saves: Promise< unknown >[] = [];
		act( () => {
			saves = [
				result.current( { visible: [ 'x', 'facebook' ], hidden: [ 'email' ] } ),
				result.current( { visible: [ 'x', 'email', 'facebook' ], hidden: [] } ),
			];
		} );
		await act( async () => first.resolve( { ...services, visible: [ 'x', 'facebook' ] } ) );

		expect( registry.select( store ).getServices()?.visible ).toEqual( [
			'x',
			'email',
			'facebook',
		] );

		await act( async () => {
			second.resolve( { ...services, visible: [ 'x', 'email', 'facebook' ], hidden: [] } );
			await Promise.all( saves );
		} );
	} );

	it( 'sends a queued save once the save before it is refused', async () => {
		let puts = 0;
		mockApiFetch.mockImplementation( ( { method, path } ) => {
			if ( method === 'PUT' ) {
				puts += 1;
				return puts === 1 ? Promise.reject( { message: 'Refused.' } ) : Promise.resolve( services );
			}
			const reads: Record< string, unknown > = {
				status: baseStatus,
				settings: baseSettings,
				services,
			};
			return Promise.resolve( reads[ path?.split( '/' ).pop() ?? '' ] );
		} );
		const { result } = renderSave();

		await act( () =>
			Promise.all( [
				result.current( { visible: [ 'x', 'facebook' ], hidden: [ 'email' ] } ),
				result.current( { visible: [ 'x', 'email', 'facebook' ], hidden: [] } ),
			] )
		);

		expect( apiCalls( 'PUT' ) ).toHaveLength( 2 );
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

	it( 'puts back only the removed service on Undo, keeping changes made since', async () => {
		mockApiFetch.mockImplementation( ( { method, data } ) =>
			Promise.resolve( method === 'PUT' ? { ...services, ...( data as object ) } : services )
		);
		const { result } = renderSave();

		await act( () =>
			result.current(
				{ visible: [ 'facebook' ], hidden: [ 'email' ] },
				{ message: 'X removed.', undo: { id: 'x', row: 'visible', index: 1 } }
			)
		);
		const notice = notices().find( ( { content } ) => content === 'X removed.' );
		await act( () => result.current( { visible: [ 'facebook', 'email' ], hidden: [] } ) );
		await act( async () => notice?.actions?.[ 0 ]?.onClick?.() );

		await waitFor( () =>
			expect( apiCalls( 'PUT' ).at( -1 ) ).toMatchObject( {
				data: { visible: [ 'facebook', 'x', 'email' ], hidden: [] },
			} )
		);
	} );

	it( 'dismisses the previous Undo once another change is saved', async () => {
		mockApiFetch.mockImplementation( ( { method, data } ) =>
			Promise.resolve( method === 'PUT' ? { ...services, ...( data as object ) } : services )
		);
		const { result } = renderSave();

		await act( () =>
			result.current(
				{ visible: [ 'facebook' ], hidden: [ 'email' ] },
				{ message: 'X removed.', undo: { id: 'x', row: 'visible', index: 1 } }
			)
		);
		let next: Promise< unknown > = Promise.resolve();
		act( () => {
			next = result.current( { visible: [ 'facebook', 'email' ], hidden: [] } );
		} );

		expect( snackbarMessages() ).not.toContain( 'X removed.' );
		await act( () => next );
	} );
} );
