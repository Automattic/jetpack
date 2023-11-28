import { renderHook, act } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry, RegistryProvider, WPDataRegistry } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';
import { store as socialStore } from '../../../social-store';
import { useSyncPostDataToStore } from '../use-sync-post-data-to-store';

const postId = 44;

const postTypeConfig = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
	transientEdits: { blocks: true, selection: true },
	mergedEdits: { meta: true },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
};

const postTypeEntity = {
	slug: 'post',
	rest_base: 'posts',
	labels: {},
};

const connections = [
	{
		id: '123456789',
		service_name: 'facebook',
		display_name: 'Some name',
		profile_picture: 'https://wordpress.com/some-url-of-a-picture',
		username: 'username',
		enabled: true,
		connection_id: '987654321',
		test_success: true,
	},
	{
		id: '234567891',
		service_name: 'tumblr',
		display_name: 'Some name',
		profile_picture: 'https://wordpress.com/some-url-of-another-picture',
		username: 'username',
		enabled: true,
		connection_id: '198765432',
		test_success: false,
	},
	{
		id: '345678912',
		service_name: 'mastodon',
		display_name: 'somename',
		profile_picture: 'https://wordpress.com/some-url-of-one-more-picture',
		username: '@somename@mastodon.social',
		enabled: true,
		connection_id: '219876543',
		test_success: 'must_reauth',
	},
];

const post = {
	id: postId,
	type: 'post',
	title: 'bar',
	content: 'bar',
	excerpt: 'crackers',
	status: 'draft',
	jetpack_publicize_connections: [ connections[ 0 ] ],
};

/**
 * Create a registry with stores.
 *
 * @returns {WPDataRegistry} Registry.
 */
async function createRegistryWithStores() {
	// Create a registry.
	const registry = createRegistry();

	// Register stores.
	registry.register( coreStore );
	registry.register( blockEditorStore );
	registry.register( editorStore );
	registry.register( socialStore );
	registry.register( noticesStore );

	// Register post type entity.
	registry.dispatch( coreStore ).addEntities( [ postTypeConfig ] );

	// Store post type entity.
	registry.dispatch( coreStore ).receiveEntityRecords( 'root', 'postType', [ postTypeEntity ] );

	// Store post.
	registry.dispatch( coreStore ).receiveEntityRecords( 'postType', 'post', post );

	// Setup editor with post.
	registry.dispatch( editorStore ).setupEditor( post );

	await registry.resolveSelect( socialStore ).getConnections();

	return registry;
}

const getMethod = options =>
	options.headers?.[ 'X-HTTP-Method-Override' ] || options.method || 'GET';

describe( 'useSyncPostDataToStore', () => {
	it( 'should do nothing by default', async () => {
		const registry = await createRegistryWithStores();
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
		const registry = await createRegistryWithStores();

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
		const registry = await createRegistryWithStores();

		// Mock apiFetch response.
		apiFetch.setFetchHandler( async options => {
			const method = getMethod( options );
			const { path, data } = options;

			if ( method === 'PUT' && path.startsWith( `/wp/v2/posts/${ postId }` ) ) {
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
