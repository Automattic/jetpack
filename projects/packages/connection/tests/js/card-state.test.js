const assert = require( 'node:assert/strict' );
const { before, describe, it } = require( 'node:test' );

let decorateAuthUrl, getCardConnection, getProtectedOwnerStatus;

before( async () => {
	( { decorateAuthUrl, getCardConnection, getProtectedOwnerStatus } =
		await import( '../../src/connectors/js/card-state.mjs' ) );
} );

const ownerUser = { id: 1, isMaster: true, wpcomUser: { display_name: 'Owner', login: 'owner' } };
const secondUser = { id: 2, isMaster: false, username: 'second', displayName: 'Second' };
const storeOwner = { id: 1, displayName: 'Owner' };
const connected = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

/**
 * Derive the card's connection state from store values layered over a connected owner's view.
 *
 * @param {object} store - Store values to override.
 * @param {object} data  - Card-only data.
 * @return {object} getCardConnection() result.
 */
const derive = ( store = {}, data = {} ) =>
	getCardConnection(
		{
			connectionStatus: connected,
			userConnectionData: { currentUser: ownerUser },
			owner: storeOwner,
			plugins: [],
			isOfflineMode: false,
			blogId: 123,
			...store,
		},
		data
	);

describe( 'getCardConnection', () => {
	for ( const [ name, store, expected ] of [
		[
			'connected owner viewing',
			{},
			{ isConnected: true, ownerIsViewer: true, viewerConnectionType: 'owner' },
		],
		[
			'connected second admin viewing',
			{ userConnectionData: { currentUser: secondUser } },
			{ isConnected: true, ownerIsViewer: false, viewerConnectionType: 'user' },
		],
		[
			'admin without their own user connection',
			{
				connectionStatus: { ...connected, isUserConnected: false },
				userConnectionData: { currentUser: secondUser },
			},
			{ viewer: null, viewerConnectionType: 'site_only' },
		],
		[
			'owner token broken: owner kept and flagged, not connected',
			{ connectionStatus: { ...connected, hasConnectedOwner: false } },
			{ isConnected: false, isOwnerConnectionBroken: true, ownerIsViewer: true },
		],
		[
			'registered without an owner',
			{ connectionStatus: { isRegistered: true }, owner: null },
			{ isRegistered: true, isConnected: false, owner: null, isOwnerConnectionBroken: false },
		],
		[
			'never connected: first connection',
			{ connectionStatus: {}, blogId: null },
			{ isRegistered: false, isFirstConnection: true, owner: null, viewer: null },
		],
		[
			'disconnected site that kept its blog ID: not a first connection',
			{ connectionStatus: {}, blogId: 123 },
			{ isFirstConnection: false },
		],
		[
			'safe mode only counts while registered',
			{ connectionStatus: { isInSafeMode: true } },
			{ isInSafeMode: false },
		],
	] ) {
		it( name, () => {
			const result = derive( store );
			for ( const [ key, value ] of Object.entries( expected ) ) {
				assert.deepEqual( result[ key ], value, key );
			}
		} );
	}

	it( 'falls back to the owner named in userConnectionData when the store withholds it', () => {
		const result = derive( {
			owner: null,
			userConnectionData: { currentUser: ownerUser, connectionOwner: 'Owner' },
		} );

		assert.equal( result.owner.displayName, 'Owner' );
		assert.equal( result.owner.id, null );
		// Without an id, ownership is read from the viewer's isMaster flag.
		assert.equal( result.ownerIsViewer, true );
	} );

	it( "fills in the viewer row from local values when WordPress.com's are missing", () => {
		const result = derive( {
			userConnectionData: {
				currentUser: { ...secondUser, email: 'local@example.com', wpcomUser: { login: 'wpcom' } },
			},
		} );

		assert.deepEqual( result.viewer, {
			displayName: 'Second',
			login: 'wpcom',
			email: 'local@example.com',
			avatar: '',
			isOwner: false,
		} );
	} );

	it( 'reads a WP_Error plugin list as no plugins', () => {
		const result = derive( { plugins: { errors: { http_request_failed: [ 'Failed' ] } } } );

		assert.deepEqual( result.connectedPlugins, [] );
	} );

	for ( const [ slugs, hasJetpackPlugin, hasWooPlugin ] of [
		[ [ 'jetpack' ], true, false ],
		[ [ 'jetpack-boost' ], true, false ],
		[ [ 'jetpackish' ], false, false ],
		[ [ 'woocommerce-payments' ], false, true ],
		[ [ 'automattic-for-agencies-client' ], false, false ],
	] ) {
		it( `classifies ${ slugs.join( ', ' ) }`, () => {
			const result = derive( { plugins: slugs.map( slug => ( { slug } ) ) } );

			assert.equal( result.hasJetpackPlugin, hasJetpackPlugin );
			assert.equal( result.hasWooPlugin, hasWooPlugin );
		} );
	}

	it( 'names plugins by slug when they have no name and attaches known logos', () => {
		const result = derive(
			{ plugins: [ { slug: 'jetpack', name: 'Jetpack' }, { slug: 'other' } ] },
			{ pluginLogos: { jetpack: 'jetpack.svg' } }
		);

		assert.deepEqual( result.connectedPlugins, [
			{ name: 'Jetpack', slug: 'jetpack', logoUrl: 'jetpack.svg' },
			{ name: 'other', slug: 'other', logoUrl: null },
		] );
	} );
} );

describe( 'getProtectedOwnerStatus', () => {
	const none = {
		slot: null,
		anchored: false,
		isPending: false,
		isEstablished: false,
		canRelease: false,
	};

	for ( const [ name, protectedOwner, expected ] of [
		[ 'no protected owner', null, none ],
		[ 'status the card does not act on', { status: 'NOT_ELIGIBLE' }, none ],
		[ 'can establish', { status: 'CAN_ESTABLISH' }, { ...none, slot: 'confirm', isPending: true } ],
		[
			'needs a connection to establish',
			{ status: 'NEEDS_CONNECT_TO_ESTABLISH' },
			{ ...none, slot: 'connect', isPending: true },
		],
		[
			'anchored owner must reconnect: pending, not releasable',
			{ status: 'NEEDS_OWNER_RECONNECT', viewerIsConfirmedOwner: true },
			{ ...none, slot: 'reconnect', anchored: true, isPending: true },
		],
		[
			'anchored owner is someone else',
			{ status: 'NEEDS_DIFFERENT_OWNER' },
			{ ...none, slot: 'other-owner', anchored: true, isPending: true },
		],
		[
			'settled, viewed by another admin',
			{ status: 'RE_EVALUATE', viewerIsConfirmedOwner: false },
			{ ...none, anchored: true, isEstablished: true },
		],
		[
			'settled, viewed by the confirmed owner',
			{ status: 'RE_EVALUATE', viewerIsConfirmedOwner: true },
			{ ...none, anchored: true, isEstablished: true, canRelease: true },
		],
	] ) {
		it( name, () => {
			assert.deepEqual( getProtectedOwnerStatus( protectedOwner ), expected );
		} );
	}
} );

describe( 'decorateAuthUrl', () => {
	it( 'adds the connector params and keeps the existing ones', () => {
		const url = new URL( decorateAuthUrl( 'https://wordpress.com/jetpack/connect?client_id=1' ) );

		assert.equal( url.searchParams.get( 'client_id' ), '1' );
		assert.equal( url.searchParams.get( 'from' ), 'jetpack-connector' );
		assert.equal( url.searchParams.get( 'skip_pricing' ), 'true' );
	} );

	it( 'returns a URL it cannot parse unchanged', () => {
		assert.equal( decorateAuthUrl( '/relative' ), '/relative' );
	} );
} );
