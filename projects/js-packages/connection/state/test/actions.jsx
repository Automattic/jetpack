import actions, {
	SET_USER_IS_CONNECTING,
	CONNECT_USER,
	CLEAR_REGISTRATION_ERROR,
	SET_SITE_IS_REGISTERING,
	REGISTER_SITE,
	SET_AUTHORIZATION_URL,
	SET_CONNECTION_STATUS,
	SET_REGISTRATION_ERROR,
} from '../actions';

describe( 'actions', () => {
	describe( 'connectUser', () => {
		it( 'set user is connecting then connect', () => {
			const redirectFunc = () => {};
			const from = 'FROM';
			const action = actions.connectUser( { from, redirectFunc } );
			expect( action.next().value ).toEqual( {
				isConnecting: true,
				type: SET_USER_IS_CONNECTING,
			} );
			expect( action.next().value ).toEqual( {
				type: CONNECT_USER,
				from,
				redirectFunc,
				redirectUri: undefined,
			} );
		} );

		it( 'connect user with redirectUri', () => {
			const redirectFunc = () => {};
			const from = 'FROM';
			const redirectUri = 'REDIRECT';
			const action = actions.connectUser( { from, redirectFunc, redirectUri } );
			expect( action.next().value ).toEqual( {
				isConnecting: true,
				type: SET_USER_IS_CONNECTING,
			} );
			expect( action.next().value ).toEqual( {
				type: CONNECT_USER,
				from,
				redirectFunc,
				redirectUri,
			} );
		} );
	} );

	describe( 'registerSite', () => {
		it( 'follows all flow to sucessful register site', () => {
			const response = { authorizeUrl: 'AUTHORIZE_URL' };
			const registrationNonce = 'REGISTRATION_NONCE';
			const redirectUri = 'REDIRECT_URI';
			const action = actions.registerSite( { registrationNonce, redirectUri } );

			expect( action.next().value ).toEqual( { type: CLEAR_REGISTRATION_ERROR } );
			expect( action.next().value ).toEqual( {
				type: SET_SITE_IS_REGISTERING,
				isRegistering: true,
			} );
			expect( action.next().value ).toEqual( {
				type: REGISTER_SITE,
				registrationNonce,
				redirectUri,
			} );

			expect( action.next( response ).value ).toEqual( {
				type: SET_CONNECTION_STATUS,
				connectionStatus: {
					isRegistered: true,
				},
			} );

			expect( action.next().value ).toEqual( {
				type: SET_AUTHORIZATION_URL,
				authorizationUrl: response.authorizeUrl,
			} );
			expect( action.next().value ).toEqual( {
				type: SET_SITE_IS_REGISTERING,
				isRegistering: false,
			} );
		} );

		it( 'follows all flow to unsucessful register site', () => {
			const error = new Error( 'failed' );
			const registrationNonce = 'REGISTRATION_NONCE';
			const redirectUri = 'REDIRECT_URI';
			const action = actions.registerSite( { registrationNonce, redirectUri } );

			expect( action.next().value ).toEqual( { type: CLEAR_REGISTRATION_ERROR } );
			expect( action.next().value ).toEqual( {
				type: SET_SITE_IS_REGISTERING,
				isRegistering: true,
			} );
			expect( action.next().value ).toEqual( {
				type: REGISTER_SITE,
				registrationNonce,
				redirectUri,
			} );

			expect( action.throw( error ).value ).toEqual( {
				type: SET_REGISTRATION_ERROR,
				registrationError: error,
			} );

			expect( action.next().value ).toEqual( {
				type: SET_SITE_IS_REGISTERING,
				isRegistering: false,
			} );
		} );
	} );
} );
