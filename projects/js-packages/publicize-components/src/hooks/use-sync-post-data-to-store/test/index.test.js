import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { RegistryProvider } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useSyncPostDataToStore } from '../';
import { store as socialStore } from '../../../social-store';
import {
	connections as connectionsList,
	createRegistryWithStores,
	testPost,
} from '../../../utils/test-utils';

const connections = connectionsList.map( connection => ( { ...connection, enabled: true } ) );

const post = {
	jetpack_publicize_connections: [ connections[ 0 ] ],
};

const getMethod = options =>
	options.headers?.[ 'X-HTTP-Method-Override' ] || options.method || 'GET';

describe( 'useSyncPostDataToStore', () => {
	it( 'should do nothing by default', async () => {
		const registry = createRegistryWithStores( post );
		await registry.resolveSelect( socialStore ).getConnections();

		const prevConnections = registry.select( socialStore ).getConnections();

		expect( prevConnections ).not.toEqual( [] );

		renderHook( () => useSyncPostDataToStore(), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>{ children }</RegistryProvider>
			),
		} );

		const freshConnections = registry.select( socialStore ).getConnections();

		expect( freshConnections ).toEqual( prevConnections );
	} );

	it( 'should do nothing when post is not being published', async () => {
		const registry = createRegistryWithStores( post );
		await registry.resolveSelect( socialStore ).getConnections();

		const prevConnections = registry.select( socialStore ).getConnections();

		renderHook( () => useSyncPostDataToStore(), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>{ children }</RegistryProvider>
			),
		} );

		await act( async () => {
			await registry.dispatch( editorStore ).editPost( {
				jetpack_publicize_connections: [],
			} );
		} );

		const freshConnections = registry.select( socialStore ).getConnections();

		expect( freshConnections ).toEqual( prevConnections );
	} );

	it( 'should update connections when post is being published', async () => {
		const registry = createRegistryWithStores( post );
		await registry.resolveSelect( socialStore ).getConnections();

		// Mock apiFetch response.
		apiFetch.setFetchHandler( async options => {
			const method = getMethod( options );
			const { path, data } = options;

			if ( method === 'PUT' && path.startsWith( `/wp/v2/posts/${ testPost.id }` ) ) {
				return { ...post, ...data };
			} else if (
				// This URL is requested by the actions dispatched in this test.
				// They are safe to ignore and are only listed here to avoid triggeringan error.
				method === 'GET' &&
				path.startsWith( '/wp/v2/types/post' )
			) {
				return {};
			}

			throw {
				code: 'unknown_path',
				message: `Unknown path: ${ method } ${ path }`,
			};
		} );

		const prevConnections = registry.select( socialStore ).getConnections();

		renderHook( () => useSyncPostDataToStore(), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>{ children }</RegistryProvider>
			),
		} );

		const updatedConnections = connections.map( () => ( { enabled: false } ) );

		await act( async () => {
			registry.dispatch( editorStore ).editPost( {
				status: 'publish',
				jetpack_publicize_connections: updatedConnections,
			} );
			registry.dispatch( editorStore ).savePost();
		} );

		const freshConnections = registry.select( socialStore ).getConnections();

		expect( freshConnections ).not.toEqual( prevConnections );

		expect( freshConnections.map( ( { enabled } ) => ( { enabled } ) ) ).toEqual(
			updatedConnections
		);
	} );
} );
