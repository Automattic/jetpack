import apiFetch from '@wordpress/api-fetch';
import { WPDataRegistry } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as socialStore } from '../../';
import { connections, createRegistryWithStores as createRegistry } from '../../../utils/test-utils';
import { setConnections, toggleConnection } from '../connection-data';

const post = {
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
	const registry = createRegistry( post );

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
