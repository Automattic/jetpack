import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { RegistryProvider } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useSyncPostDataToStore } from '../';
import { store as socialStore } from '../../../social-store';
import {
	connections as connectionsList,
	createRegistryWithStores,
	postPublishFetchHandler,
} from '../../../utils/test-utils';

const connections = connectionsList.map( connection => ( { ...connection, enabled: true } ) );

const post = {
	jetpack_publicize_connections: [ connections[ 0 ] ],
};

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
		apiFetch.setFetchHandler( postPublishFetchHandler( post ) );

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
