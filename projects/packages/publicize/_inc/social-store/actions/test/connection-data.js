import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { select as defaultSelect, dispatch as defaultDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';
import { store as socialStore } from '../../';
import { SUPPORTED_SERVICES_MOCK } from '../../../utils/test-constants';
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

		it( 'should skip updating tracking when silent is true', async () => {
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
					silent: true,
				}
			);

			expect( registry.select( socialStore ).getUpdatingConnections() ).toEqual( [] );

			resolveFetch();
			await updatePromise;

			expect( registry.select( socialStore ).getUpdatingConnections() ).toEqual( [] );
		} );
	} );

	describe( 'refreshConnectionTestResults', () => {
		const connectionsPath = '/wpcom/v2/publicize/connections';

		it( 'should refresh connection test results', async () => {
			// Mock apiFetch response.
			apiFetch.setFetchHandler( async ( { path } ) => {
				if ( path.startsWith( connectionsPath ) ) {
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

	describe( 'reconnect', () => {
		const connectionsPath = '/wpcom/v2/publicize/connections';
		const connectionId = connections[ 0 ].connection_id;

		const keyringResult = {
			ID: 1234,
			service: 'facebook',
			external_ID: 'fb-user-1',
			external_name: 'FB User',
			additional_external_users: [
				{ external_ID: 'page-1', external_name: 'Page 1', external_profile_picture: '' },
			],
		};

		let fetchRequests;

		/**
		 * Create a registry with the services list and the Facebook connection being reconnected.
		 *
		 * @param {string} externalId - External ID saved on the Facebook connection.
		 * @param {string} status     - Status the connections refresh reports.
		 * @return {import('@wordpress/data').WPDataRegistry} Registry.
		 */
		async function setupReconnect( externalId, status = 'ok' ) {
			fetchRequests = [];

			apiFetch.setFetchHandler( async request => {
				fetchRequests.push( request );

				if ( request.method === 'POST' && request.path.startsWith( connectionsPath ) ) {
					return { connection_id: connectionId };
				}

				if ( request.path.startsWith( connectionsPath ) ) {
					return [ { ...connections[ 0 ], external_id: 'page-1', status } ];
				}

				throw { code: 'unknown_path', message: `Unknown path: ${ request.path }` };
			} );

			const registry = createRegistryWithStores();
			const core = registry.dispatch( coreStore );

			await core.addEntities( [
				{ kind: 'wpcom/v2', name: 'publicize/services', baseURL: '/wpcom/v2/publicize/services' },
			] );
			await core.receiveEntityRecords(
				'wpcom/v2',
				'publicize/services',
				SUPPORTED_SERVICES_MOCK,
				true
			);
			await core.finishResolution( 'getEntityRecords', [ 'wpcom/v2', 'publicize/services' ] );

			registry
				.dispatch( socialStore )
				.setReconnectingAccount( { ...connections[ 0 ], external_id: externalId } );

			return registry;
		}

		const lastNotice = () => defaultSelect( noticesStore ).getNotices().at( -1 );

		beforeEach( () => {
			defaultSelect( noticesStore )
				.getNotices()
				.forEach( notice => defaultDispatch( noticesStore ).removeNotice( notice.id ) );
		} );

		it( 'hands a connection with no Page saved to the account picker', async () => {
			const registry = await setupReconnect( 'fb-user-1', 'broken' );

			const handled = await registry.dispatch( socialStore ).completeReconnect( keyringResult );

			expect( handled ).toBe( false );
			expect( fetchRequests ).toEqual( [] );
			expect( registry.select( socialStore ).getReconnectingAccount() ).toBeDefined();
			expect( registry.select( socialStore ).reconnectNeedsAccountSelection( keyringResult ) ).toBe(
				true
			);
		} );

		it( 'saves the selected Page on the existing connection', async () => {
			const registry = await setupReconnect( 'fb-user-1' );

			await registry.dispatch( socialStore ).reconnectWithAccount( connectionId, 'page-1' );

			expect( fetchRequests[ 0 ] ).toMatchObject( {
				method: 'POST',
				path: expect.stringContaining( `${ connectionsPath }/${ connectionId }` ),
				data: { external_user_ID: 'page-1' },
			} );
			expect( registry.select( socialStore ).getConnections() ).toEqual( [
				expect.objectContaining( { connection_id: connectionId, external_id: 'page-1' } ),
			] );
			expect( registry.select( socialStore ).getReconnectingAccount() ).toBeUndefined();
			expect( lastNotice().content ).toBe( 'Account reconnected successfully.' );
		} );

		it( 'reports an error when saving the selected Page fails', async () => {
			const registry = await setupReconnect( 'fb-user-1' );

			apiFetch.setFetchHandler( async () => {
				throw { code: 'insert_error', message: 'Not your Page.' };
			} );

			await registry.dispatch( socialStore ).reconnectWithAccount( connectionId, 'page-2' );

			expect( registry.select( socialStore ).getReconnectingAccount() ).toBeUndefined();
			expect( registry.select( socialStore ).getUpdatingConnections() ).toEqual( [] );
			expect( lastNotice().content ).toBe( 'Error updating account. Not your Page.' );
		} );

		it( 'reconnects a connection with a Page saved in place', async () => {
			const registry = await setupReconnect( 'page-1' );

			const handled = await registry.dispatch( socialStore ).completeReconnect( keyringResult );

			expect( handled ).toBe( true );
			expect( registry.select( socialStore ).getReconnectingAccount() ).toBeUndefined();
			expect( lastNotice().content ).toBe( 'Account reconnected successfully.' );
		} );

		it( 'does not handle a different account', async () => {
			const registry = await setupReconnect( 'page-9' );

			const handled = await registry.dispatch( socialStore ).completeReconnect( keyringResult );

			expect( handled ).toBe( false );
			expect( fetchRequests ).toEqual( [] );
		} );
	} );
} );
