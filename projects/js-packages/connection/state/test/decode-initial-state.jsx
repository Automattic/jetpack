import decodeInitialState from '../decode-initial-state';

describe( 'decodeInitialState', () => {
	const encoded = 'O&#039;Neil &amp; Sons &lt;3';
	const decoded = "O'Neil & Sons <3";

	it.each( [
		[
			'the current user',
			{ userConnectionData: { currentUser: { id: 1, displayName: encoded } } },
			state => state.userConnectionData.currentUser.displayName,
		],
		[
			'the current user on WordPress.com',
			{ userConnectionData: { currentUser: { id: 1, wpcomUser: { display_name: encoded } } } },
			state => state.userConnectionData.currentUser.wpcomUser.display_name,
		],
		[
			'the connected owner',
			{ userConnectionData: { connectionOwner: encoded } },
			state => state.userConnectionData.connectionOwner,
		],
		[
			'the owner of record',
			{ connectionOwner: { id: 1, displayName: encoded } },
			state => state.connectionOwner.displayName,
		],
		[
			'an error keyed by user ID',
			{ connectionErrors: { invalid_connection_owner: { 1: { error_message: encoded } } } },
			state => state.connectionErrors.invalid_connection_owner[ 1 ].error_message,
		],
		[
			'an error PHP sent as a list',
			{ connectionErrors: { invalid_connection_owner: [ { error_message: encoded } ] } },
			state => state.connectionErrors.invalid_connection_owner[ 0 ].error_message,
		],
	] )( 'decodes the name of %s', ( _, state, read ) => {
		expect( read( decodeInitialState( state ) ) ).toBe( decoded );
	} );

	// Consumers reading the store may index the per-user errors as a list.
	it( 'keeps an error list a list', () => {
		const state = {
			connectionErrors: { invalid_connection_owner: [ { error_message: encoded } ] },
		};

		expect(
			Array.isArray( decodeInitialState( state ).connectionErrors.invalid_connection_owner )
		).toBe( true );
	} );

	it( 'leaves a state without names as it was', () => {
		const state = {
			apiRoot: 'https://example.org/wp-json/',
			userConnectionData: { currentUser: { id: 1 }, connectionOwner: null },
			connectionOwner: null,
			connectionErrors: [],
		};

		expect( decodeInitialState( state ) ).toEqual( state );
	} );
} );
