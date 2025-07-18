import apiFetch from '@wordpress/api-fetch';
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
 * @return {import('@wordpress/data').WPDataRegistry} Registry.
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
				// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );

			expect( connectionsBeforeSync ).toEqual( [ connections[ 0 ] ] );

			registry.dispatch( socialStore ).syncConnectionsToPostMeta();

			const connectionsAfterSync = registry
				// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );

			expect( connectionsAfterSync ).toEqual( connections );
		} );
	} );

	describe( 'toggleConnectionById', () => {
		it( 'should toggle connection by id', () => {
			// Create registry.
			const registry = createRegistryWithStores();

			// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
			const connectionsBeforeToggle = registry.select( socialStore ).getConnections();
			const connectionsFromMetaBeforeToggle = registry
				// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );

			expect( connectionsBeforeToggle ).toEqual( connections );
			expect( connectionsFromMetaBeforeToggle ).toEqual( [ connections[ 0 ] ] );

			registry.dispatch( socialStore ).toggleConnectionById( connections[ 0 ].connection_id );

			// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
			const connectionsAfterToggle = registry.select( socialStore ).getConnections();

			expect( connectionsAfterToggle[ 0 ] ).toEqual( {
				...connectionsBeforeToggle[ 0 ],
				enabled: true,
			} );

			// Check that the connections in the post meta are updated.
			const connectionsFromMetaAfterToggle = registry
				// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );

			expect( connectionsFromMetaAfterToggle ).toEqual( connectionsAfterToggle );
		} );
	} );

	describe( 'mergeConnections', () => {
		it( 'should merge connections', () => {
			// Create registry.
			const registry = createRegistryWithStores();

			// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
			const connectionsBeforeMerge = registry.select( socialStore ).getConnections();

			expect( connectionsBeforeMerge ).toEqual( connections );

			const freshConnections = connections.map( connection => ( {
				...connection,
				status: 'broken',
			} ) );

			registry.dispatch( socialStore ).mergeConnections( freshConnections );

			// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
			const connectionsAfterMerge = registry.select( socialStore ).getConnections();

			expect( connectionsAfterMerge ).toEqual( freshConnections );
		} );
	} );

	describe( 'refreshConnectionTestResults', () => {
		const refreshConnections = '/wpcom/v2/publicize/connection-test-results';
		beforeAll( () => {
			global.JetpackScriptData = {
				social: {
					api_paths: {
						refreshConnections,
					},
				},
			};
		} );

		it( 'should refresh connection test results', async () => {
			// Mock apiFetch response.
			apiFetch.setFetchHandler( async ( { path } ) => {
				if ( path.startsWith( refreshConnections ) ) {
					return connections.map( connection => ( {
						...connection,
						status: 'broken',
					} ) );
				}

				throw {
					code: 'unknown_path',
					message: `Unknown path: ${ path }`,
				};
			} );

			const registry = createRegistryWithStores();

			const connectionsFromMetaBeforeRefresh = registry
				// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );

			expect( connectionsFromMetaBeforeRefresh ).toEqual( [ connections[ 0 ] ] );

			await registry.dispatch( socialStore ).refreshConnectionTestResults();

			// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
			const connectionsAfterRefresh = registry.select( socialStore ).getConnections();

			expect( connectionsAfterRefresh ).toEqual(
				connections.map( connection => ( {
					...connection,
					status: 'broken',
				} ) )
			);

			// Ensure that the connections in the post meta are not updated by default
			const connectionsFromMetaAfterRefresh = registry
				// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );
			expect( connectionsFromMetaBeforeRefresh ).toEqual( connectionsFromMetaAfterRefresh );
		} );
	} );
} );
