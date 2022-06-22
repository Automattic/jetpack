import { jest } from '@jest/globals';
import { select, dispatch } from '@wordpress/data';
import { FETCH_AUTHORIZATION_URL, SET_AUTHORIZATION_URL } from '../actions';
import resolvers from '../resolvers';
import { STORE_ID } from '../store';

const selectors = select( STORE_ID );
const dispatchers = dispatch( STORE_ID );

const stubHasFinishedResolution = jest.spyOn( selectors, 'hasFinishedResolution' ).mockReset();
const spyFinishResolution = jest.spyOn( dispatchers, 'finishResolution' );

describe( 'resolvers', () => {
	beforeEach( () => {
		stubHasFinishedResolution.mockClear();
		stubHasFinishedResolution.mockReturnValue( true );
		spyFinishResolution.mockClear();
	} );

	describe( 'getAuthorizationUrl', () => {
		const store = { authorizationUrl: 'https://authorize.url' };

		it( 'returns expected fulfilled', () => {
			expect( resolvers.getAuthorizationUrl.isFulfilled( store ) ).toBe( true );
			expect( resolvers.getAuthorizationUrl.isFulfilled( {} ) ).toBe( false );
		} );

		it( "calls finishResolution if is fulfilled and didn't finished resolution", () => {
			stubHasFinishedResolution.mockReturnValue( false );
			resolvers.getAuthorizationUrl.isFulfilled( store );
			expect( spyFinishResolution ).toHaveBeenCalledWith( 'getAuthorizationUrl', [] );
		} );

		it( 'does not call finishResolution', () => {
			// already finished resolution
			stubHasFinishedResolution.mockReturnValue( true );
			resolvers.getAuthorizationUrl.isFulfilled( store );
			expect( spyFinishResolution ).not.toHaveBeenCalled();

			// not fulfilled
			stubHasFinishedResolution.mockReturnValue( false );
			resolvers.getAuthorizationUrl.isFulfilled( {} );
			expect( spyFinishResolution ).not.toHaveBeenCalled();
		} );

		it( 'fetch and set authorization url', () => {
			const result = { authorizeUrl: 'https://authorize.url' };
			const redirectUri = 'REDIRECT_URI';
			const authorization = resolvers.getAuthorizationUrl.fulfill( redirectUri );
			expect( authorization.next().value ).toEqual( {
				type: FETCH_AUTHORIZATION_URL,
				redirectUri,
			} );
			expect( authorization.next( result ).value ).toEqual( {
				type: SET_AUTHORIZATION_URL,
				authorizationUrl: result.authorizeUrl,
			} );
		} );
	} );
} );
