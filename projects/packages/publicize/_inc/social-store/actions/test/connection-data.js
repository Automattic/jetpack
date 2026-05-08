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

		describe( 'single X connection enforcement', () => {
			const xConnections = [
				{
					service_name: 'x',
					display_name: 'X account A',
					profile_picture: '',
					external_handle: 'a',
					enabled: true,
					connection_id: 'x-aaa',
				},
				{
					service_name: 'x',
					display_name: 'X account B',
					profile_picture: '',
					external_handle: 'b',
					enabled: false,
					connection_id: 'x-bbb',
				},
				{
					service_name: 'facebook',
					display_name: 'FB',
					profile_picture: '',
					external_handle: 'fb',
					enabled: true,
					connection_id: 'fb-1',
				},
			];

			const setup = () => {
				const registry = createRegistry( post );
				registry.dispatch( socialStore ).setConnections( xConnections );
				return registry;
			};

			const byId = ( list, id ) => list.find( c => c.connection_id === id );

			it( 'disables other enabled X connections when enabling an X connection', () => {
				const registry = setup();

				registry.dispatch( socialStore ).toggleConnectionById( 'x-bbb' );

				const after = registry.select( socialStore ).getConnections();
				expect( byId( after, 'x-aaa' ).enabled ).toBe( false );
				expect( byId( after, 'x-bbb' ).enabled ).toBe( true );
				// Non-X connections are untouched.
				expect( byId( after, 'fb-1' ).enabled ).toBe( true );
			} );

			it( 'does not touch X connections when enabling a non-X connection', () => {
				const registry = setup();
				// Disable the pre-enabled Facebook connection so we can re-enable it.
				registry.dispatch( socialStore ).toggleConnectionById( 'fb-1' );
				// Toggling off FB should not touch X connections.
				let after = registry.select( socialStore ).getConnections();
				expect( byId( after, 'x-aaa' ).enabled ).toBe( true );

				// Re-enable FB; X connections still untouched.
				registry.dispatch( socialStore ).toggleConnectionById( 'fb-1' );
				after = registry.select( socialStore ).getConnections();
				expect( byId( after, 'x-aaa' ).enabled ).toBe( true );
				expect( byId( after, 'fb-1' ).enabled ).toBe( true );
			} );

			it( 'does not touch other X connections when toggling an X connection OFF', () => {
				const registry = setup();

				// x-aaa is already enabled; toggling it OFF must not auto-enable anything.
				registry.dispatch( socialStore ).toggleConnectionById( 'x-aaa' );

				const after = registry.select( socialStore ).getConnections();
				expect( byId( after, 'x-aaa' ).enabled ).toBe( false );
				expect( byId( after, 'x-bbb' ).enabled ).toBe( false );
			} );
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
				status: 'broken',
			} ) );

			registry.dispatch( socialStore ).mergeConnections( freshConnections );

			const connectionsAfterMerge = registry.select( socialStore ).getConnections();

			expect( connectionsAfterMerge ).toEqual( freshConnections );
		} );
	} );

	describe( 'updateConnectionById', () => {
		const connectionId = connections[ 0 ].connection_id;

		it( 'should track the connection as updating by default', async () => {
			let resolveFetch;

			apiFetch.setFetchHandler(
				() =>
					new Promise( resolve => {
						resolveFetch = resolve;
					} )
			);

			const registry = createRegistryWithStores();

			const updatePromise = registry.dispatch( socialStore ).updateConnectionById( connectionId, {
				shared: true,
			} );

			expect( registry.select( socialStore ).getUpdatingConnections() ).toEqual( [ connectionId ] );

			resolveFetch();
			await updatePromise;

			expect( registry.select( socialStore ).getUpdatingConnections() ).toEqual( [] );
		} );

		it( 'should skip updating tracking when trackUpdating is false', async () => {
			let resolveFetch;

			apiFetch.setFetchHandler(
				() =>
					new Promise( resolve => {
						resolveFetch = resolve;
					} )
			);

			const registry = createRegistryWithStores();

			const updatePromise = registry.dispatch( socialStore ).updateConnectionById(
				connectionId,
				{
					template: 'Custom template',
				},
				{
					trackUpdating: false,
					showSuccessNotice: false,
				}
			);

			expect( registry.select( socialStore ).getUpdatingConnections() ).toEqual( [] );

			resolveFetch();
			await updatePromise;

			expect( registry.select( socialStore ).getUpdatingConnections() ).toEqual( [] );
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

				.select( editorStore )
				.getEditedPostAttribute( 'jetpack_publicize_connections' );

			expect( connectionsFromMetaBeforeRefresh ).toEqual( [ connections[ 0 ] ] );

			await registry.dispatch( socialStore ).refreshConnectionTestResults();

			const connectionsAfterRefresh = registry.select( socialStore ).getConnections();

			expect( connectionsAfterRefresh ).toEqual(
				connections.map( connection => ( {
					...connection,
					status: 'broken',
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
