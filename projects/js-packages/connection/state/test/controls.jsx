/**
 * External dependencies
 */
import { expect } from 'chai';
import restApi from '@automattic/jetpack-api';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import controls from '../controls';

const {
	FETCH_CONNECTION_STATUS: fetchSiteConnectionStatus,
	REGISTER_SITE: registerSite,
	CONNECT_USER: connectUser,
	FETCH_AUTHORIZATION_URL: fetchAuthorizationUrl,
} = controls;

const stubFetchSiteConnectionStatus = sinon.stub( restApi, 'fetchSiteConnectionStatus' );
const stubRegisterSite = sinon.stub( restApi, 'registerSite' );
const stubFetchAuthorizationUrl = sinon.stub( restApi, 'fetchAuthorizationUrl' );
const stubAssign = ( window.location.assign = sinon.stub() );

const getAuthorizationUrl = sinon.stub();
const resolveSelect = () => ( { getAuthorizationUrl } );

describe( 'controls', () => {
	beforeEach( () => {
		stubAssign.resetHistory();
		stubRegisterSite.resetHistory();
		stubFetchAuthorizationUrl.resetHistory();
		stubFetchSiteConnectionStatus.resetHistory();
	} );

	describe( 'FETCH_CONNECTION_STATUS', () => {
		it( 'resolves with result', async () => {
			const fakeResult = {};
			stubFetchSiteConnectionStatus.resolves( fakeResult );

			const result = await fetchSiteConnectionStatus();
			expect( result ).to.be.equal( fakeResult );
		} );

		it( 'resolves with error', done => {
			const fakeError = new Error( 'failed' );
			stubFetchSiteConnectionStatus.rejects( fakeError );

			fetchSiteConnectionStatus().catch( error => {
				expect( error ).to.be.equal( fakeError );
				done();
			} );
		} );
	} );

	describe( 'REGISTER_SITE', () => {
		it( 'resolves with result', async () => {
			const registrationNonce = 'REGISTRATION_NONCE';
			const redirectUri = 'REDIRECT_URI';
			const fakeResult = {};
			stubRegisterSite.resolves( fakeResult );

			const result = await registerSite( { registrationNonce, redirectUri } );
			expect( result ).to.be.equal( fakeResult );
			expect( stubRegisterSite.calledWith( registrationNonce, redirectUri ) ).to.be.true;
		} );

		it( 'resolves with error', done => {
			const fakeError = new Error( 'failed' );
			stubRegisterSite.rejects( fakeError );
			registerSite( {} ).catch( error => {
				expect( error ).to.be.equal( fakeError );
				done();
			} );
		} );
	} );

	describe( 'CONNECT_USER', () => {
		const generateUrls = () => {
			const authorizeUrl = new URL( 'https://authorize.url' );

			const authorizeUrlWithFrom = new URL( authorizeUrl );
			authorizeUrlWithFrom.searchParams.set( 'from', 'jetpack' );

			const authorizeUrlWithParam = new URL( authorizeUrl );
			authorizeUrlWithParam.searchParams.set( 'param', 'fake' );

			const authorizeUrlWithParamAndFrom = new URL( authorizeUrlWithParam );
			authorizeUrlWithParamAndFrom.searchParams.set( 'from', 'jetpack' );

			return {
				authorizeUrl: authorizeUrl.toString(),
				authorizeUrlWithParam: authorizeUrlWithParam.toString(),
				authorizeUrlWithFrom: authorizeUrlWithFrom.toString(),
				authorizeUrlWithParamAndFrom: authorizeUrlWithParamAndFrom.toString(),
			};
		};

		it( 'redirects with assign', async () => {
			const { authorizeUrl } = generateUrls();
			getAuthorizationUrl.resolves( authorizeUrl );

			const url = await connectUser( { resolveSelect } )();
			expect( stubAssign.calledWith( authorizeUrl ) ).to.be.true;
			expect( url ).to.be.equal( authorizeUrl );
		} );

		it( 'redirects adding from', async () => {
			const {
				authorizeUrl,
				authorizeUrlWithFrom,
				authorizeUrlWithParam,
				authorizeUrlWithParamAndFrom,
			} = generateUrls();

			// url without param
			getAuthorizationUrl.resolves( authorizeUrl );
			const noParam = await connectUser( { resolveSelect } )( { from: 'jetpack' } );
			expect( stubAssign.calledWith( authorizeUrlWithFrom ) ).to.be.true;
			expect( noParam ).to.be.equal( authorizeUrlWithFrom );

			// url with param
			getAuthorizationUrl.resolves( authorizeUrlWithParam );
			const param = await connectUser( { resolveSelect } )( { from: 'jetpack' } );
			expect( stubAssign.calledWith( authorizeUrlWithParamAndFrom ) ).to.be.true;
			expect( param ).to.be.equal( authorizeUrlWithParamAndFrom );
		} );

		it( 'redirects with custom func', async () => {
			const redirectFunc = sinon.stub();
			const { authorizeUrl } = generateUrls();
			getAuthorizationUrl.resolves( authorizeUrl );
			await connectUser( { resolveSelect } )( { redirectFunc } );
			expect( redirectFunc.calledWith( authorizeUrl ) ).to.be.true;
		} );

		it( 'rejects with error', done => {
			const error = new Error( 'failed' );
			getAuthorizationUrl.rejects( error );
			connectUser( { resolveSelect } )( {} ).catch( err => {
				expect( err ).to.be.equal( error );
				done();
			} );
		} );
	} );

	describe( 'FETCH_AUTHORIZATION_URL', () => {
		it( 'resolves with result', async () => {
			const redirectUri = 'REDIRECT_URI';
			const URL = 'https://authorize.url';
			stubFetchAuthorizationUrl.resolves( URL );

			const result = await fetchAuthorizationUrl( { redirectUri } );
			expect( result ).to.be.equal( URL );
			expect( stubFetchAuthorizationUrl.calledWith( redirectUri ) ).to.be.true;
		} );

		it( 'resolves with error', done => {
			const fakeError = new Error( 'failed' );
			stubFetchAuthorizationUrl.rejects( fakeError );

			fetchAuthorizationUrl( {} ).catch( error => {
				expect( error ).to.be.equal( fakeError );
				done();
			} );
		} );
	} );
} );
