/**
 * External dependencies
 */
import { expect } from 'chai';
import { select, dispatch } from '@wordpress/data';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import resolvers from '../resolvers';
import { STORE_ID } from '../store';
import {
	SET_CONNECTION_STATUS_IS_FETCHING,
	FETCH_CONNECTION_STATUS,
	SET_CONNECTION_STATUS,
	FETCH_AUTHORIZATION_URL,
	SET_AUTHORIZATION_URL,
} from '../actions';

const selectors = select( STORE_ID );
const dispatchers = dispatch( STORE_ID );

const stubHasFinishedResolution = sinon.stub( selectors, 'hasFinishedResolution' );
const spyFinishResolution = sinon.spy( dispatchers, 'finishResolution' );

describe( 'resolvers', () => {
	beforeEach( () => {
		stubHasFinishedResolution.resetHistory();
		stubHasFinishedResolution.returns( true );
		spyFinishResolution.resetHistory();
	} );

	describe( 'getConnectionStatus', () => {
		it( 'fetch and set all states', () => {
			const result = { data: 'FAKE' };
			const connection = resolvers.getConnectionStatus();
			expect( connection.next().value ).to.be.eql( {
				type: SET_CONNECTION_STATUS_IS_FETCHING,
				isFetching: true,
			} );
			expect( connection.next().value ).to.be.eql( { type: FETCH_CONNECTION_STATUS } );
			expect( connection.next( result ).value ).to.be.eql( {
				type: SET_CONNECTION_STATUS_IS_FETCHING,
				isFetching: false,
			} );
			expect( connection.next().value ).to.be.eql( {
				type: SET_CONNECTION_STATUS,
				connectionStatus: result,
			} );
		} );
	} );

	describe( 'getAuthorizationUrl', () => {
		const store = { authorizationUrl: 'https://authorize.url' };

		it( 'returns expected fulfilled', () => {
			expect( resolvers.getAuthorizationUrl.isFulfilled( store ) ).to.be.true;
			expect( resolvers.getAuthorizationUrl.isFulfilled( {} ) ).to.be.false;
		} );

		it( "calls finishResolution if is fulfilled and didn't finished resolution", () => {
			stubHasFinishedResolution.returns( false );
			resolvers.getAuthorizationUrl.isFulfilled( store );
			expect( spyFinishResolution.calledWith( 'getAuthorizationUrl' ) ).to.be.true;
		} );

		it( 'does not call finishResolution', () => {
			// already finished resolution
			stubHasFinishedResolution.returns( true );
			resolvers.getAuthorizationUrl.isFulfilled( store );
			expect( spyFinishResolution.called ).to.be.false;

			// not fulfilled
			stubHasFinishedResolution.returns( false );
			resolvers.getAuthorizationUrl.isFulfilled( {} );
			expect( spyFinishResolution.called ).to.be.false;
		} );

		it( 'fetch and set authorization url', () => {
			const result = { authorizeUrl: 'https://authorize.url' };
			const redirectUri = 'REDIRECT_URI';
			const authorization = resolvers.getAuthorizationUrl.fulfill( redirectUri );
			expect( authorization.next().value ).to.be.eql( {
				type: FETCH_AUTHORIZATION_URL,
				redirectUri,
			} );
			expect( authorization.next( result ).value ).to.be.eql( {
				type: SET_AUTHORIZATION_URL,
				authorizationUrl: result.authorizeUrl,
			} );
		} );
	} );
} );
