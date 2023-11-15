import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry, WPDataRegistry } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as socialStore } from '../../';
import { setConnections, toggleConnection } from '../connection-data';

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
		enabled: false,
		connection_id: '987654321',
		test_success: true,
	},
	{
		id: '234567891',
		service_name: 'tumblr',
		display_name: 'Some name',
		profile_picture: 'https://wordpress.com/some-url-of-another-picture',
		username: 'username',
		enabled: false,
		connection_id: '198765432',
		test_success: false,
	},
	{
		id: '345678912',
		service_name: 'mastodon',
		display_name: 'somename',
		profile_picture: 'https://wordpress.com/some-url-of-one-more-picture',
		username: '@somename@mastodon.social',
		enabled: false,
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
 * @param {boolean} initConnections - Whether to set initial connections.
 *
 * @returns {WPDataRegistry} Registry.
 */
function createRegistryWithStores( initConnections = true ) {
	// Create a registry.
	const registry = createRegistry();

	// Register stores.
	registry.register( coreStore );
	registry.register( editorStore );
	registry.register( socialStore );

	// Register post type entity.
	registry.dispatch( coreStore ).addEntities( [ postTypeConfig ] );

	// Store post type entity.
	registry.dispatch( coreStore ).receiveEntityRecords( 'root', 'postType', [ postTypeEntity ] );

	// Store post.
	registry.dispatch( coreStore ).receiveEntityRecords( 'postType', 'post', post );

	// Setup editor with post.
	registry.dispatch( editorStore ).setupEditor( post );

	if ( initConnections ) {
		// Set connections.
		registry.dispatch( socialStore ).setConnections( connections );
	}

	return registry;
}

describe( 'Social store actions: connectionData', () => {
	describe( 'setConnections', () => {
		it( 'should return the SET_CONNECTIONS action', () => {
			const result = setConnections( [] );
			expect( result ).toEqual( {
				type: 'SET_CONNECTIONS',
				connections: [],
			} );

			const result2 = setConnections( connections );

			expect( result2 ).toEqual( {
				type: 'SET_CONNECTIONS',
				connections,
			} );
		} );
	} );

	describe( 'toggleConnection', () => {
		it( 'should return the TOGGLE_CONNECTION action', () => {
			const result = toggleConnection( '123456789' );
			expect( result ).toEqual( {
				type: 'TOGGLE_CONNECTION',
				connectionId: '123456789',
			} );
		} );
	} );

	describe( 'syncConnectionsToPostMeta', () => {
		it( 'should sync connections to post meta', () => {
			// Create registry.
			const registry = createRegistryWithStores();

			const connectionsBeforeSync = registry
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );

			expect( connectionsBeforeSync ).toEqual( [ connections[ 0 ] ] );

			registry.dispatch( socialStore ).syncConnectionsToPostMeta();

			const connectionsAfterSync = registry
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );

			expect( connectionsAfterSync ).toEqual( connections );
		} );
	} );

	describe( 'toggleConnectionById', () => {
		it( 'should toggle connection by id', () => {
			// Create registry.
			const registry = createRegistryWithStores();

			const connectionsBeforeToggle = registry.select( socialStore ).getConnections();
			const connectionsFromMetaBeforeToggle = registry
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );

			expect( connectionsBeforeToggle ).toEqual( connections );
			expect( connectionsFromMetaBeforeToggle ).toEqual( [ connections[ 0 ] ] );

			registry.dispatch( socialStore ).toggleConnectionById( connections[ 0 ].connection_id );

			const connectionsAfterToggle = registry.select( socialStore ).getConnections();

			expect( connectionsAfterToggle[ 0 ] ).toEqual( {
				...connectionsBeforeToggle[ 0 ],
				enabled: true,
			} );

			// Check that the connections in the post meta are updated.
			const connectionsFromMetaAfterToggle = registry
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );

			expect( connectionsFromMetaAfterToggle ).toEqual( connectionsAfterToggle );
		} );
	} );

	describe( 'mergeConnections', () => {
		it( 'should merge connections', () => {
			// Create registry.
			const registry = createRegistryWithStores();

			const connectionsBeforeMerge = registry.select( socialStore ).getConnections();

			expect( connectionsBeforeMerge ).toEqual( connections );

			const freshConnections = connections.map( connection => ( {
				...connection,
				test_success: false,
			} ) );

			registry.dispatch( socialStore ).mergeConnections( freshConnections );

			const connectionsAfterMerge = registry.select( socialStore ).getConnections();

			expect( connectionsAfterMerge ).toEqual(
				freshConnections.map( connection => ( {
					...connection,
					// These 3 are added while merging
					done: false,
					toggleable: true,
					is_healthy: false,
				} ) )
			);
		} );
	} );

	describe( 'refreshConnectionTestResults', () => {
		it( 'should refresh connection test results', async () => {
			// Mock apiFetch response.
			apiFetch.setFetchHandler( async ( { path } ) => {
				if ( path.startsWith( '/wpcom/v2/publicize/connection-test-results' ) ) {
					return connections.map( connection => ( {
						...connection,
						can_refresh: false,
						refresh_url: '',
						test_message: 'Some message',
						test_success: true,
					} ) );
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			const connectionsFromMetaBeforeRefresh = registry
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );

			expect( connectionsFromMetaBeforeRefresh ).toEqual( [ connections[ 0 ] ] );

			await registry.dispatch( socialStore ).refreshConnectionTestResults();

			const connectionsAfterRefresh = registry.select( socialStore ).getConnections();

			expect( connectionsAfterRefresh ).toEqual(
				connections.map( connection => ( {
					...connection,
					can_refresh: false,
					refresh_url: '',
					test_message: 'Some message',
					test_success: true,
					// These 3 are added while merging
					done: false,
					toggleable: true,
					is_healthy: true,
				} ) )
			);

			// Ensure that the connections in the post meta are not updated by default
			const connectionsFromMetaAfterRefresh = registry
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );
			expect( connectionsFromMetaBeforeRefresh ).toEqual( connectionsFromMetaAfterRefresh );
		} );
	} );
} );
