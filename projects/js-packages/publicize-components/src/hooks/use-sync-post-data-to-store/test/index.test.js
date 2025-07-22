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

		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
		const prevConnections = registry.select( socialStore ).getConnections();

		expect( prevConnections ).not.toEqual( [] );

		renderHook( () => useSyncPostDataToStore(), {
			wrapper: ( { children } ) => (
				<RegistryProvider value={ registry }>{ children }</RegistryProvider>
			),
		} );

		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
		const freshConnections = registry.select( socialStore ).getConnections();

		expect( freshConnections ).toEqual( prevConnections );
	} );

	it( 'should do nothing when post is not being published', async () => {
		const registry = createRegistryWithStores( post );
		await registry.resolveSelect( socialStore ).getConnections();

		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
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

		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
		const freshConnections = registry.select( socialStore ).getConnections();

		expect( freshConnections ).toEqual( prevConnections );
	} );

	it( 'should update connections when post is being published', async () => {
		const registry = createRegistryWithStores( post );
		await registry.resolveSelect( socialStore ).getConnections();

		// Mock apiFetch response.
		apiFetch.setFetchHandler( postPublishFetchHandler( post ) );

		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
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
		} );

		// `.savePost()` triggers two state updates before it resolves. If we await it inside a single `act()`, the updates will cancel each other out and therefore `usePostJustPublished()` won't trigger.
		// To work around that with the current implementation of `.savePost()` we can call it without awaiting in one `act()` and then await in a second.
		// @todo Does that mean `usePostJustPublished()` is risky in general? i.e. if the `fetch()` returns too quickly might React batch the updates?
		let p;
		act( () => {
			p = registry.dispatch( editorStore ).savePost();
		} );
		await act( async () => p );

		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
		const freshConnections = registry.select( socialStore ).getConnections();

		expect( freshConnections ).not.toEqual( prevConnections );

		expect( freshConnections.map( ( { enabled } ) => ( { enabled } ) ) ).toEqual(
			updatedConnections
		);
	} );
} );
