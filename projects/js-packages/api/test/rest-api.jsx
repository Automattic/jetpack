/**
 * External dependencies
 */
// import React from 'react';
import chai, { expect } from 'chai';
// import chaiFetch from 'chai-fetch';
import chaiFetchMock from 'chai-fetch-mock';
import fetchMock from 'fetch-mock';
chai.use( chaiFetchMock );
// chai.use(chaiFetch);

// import { shallow } from 'enzyme';
// import ShallowRenderer from 'react-test-renderer/shallow';

/**
 * Internal dependencies
 */
import restApi from '../index';
// import { getLocal } from "mockttp";

// const mockServer = getLocal();

// mock out some values to make testing easier
restApi.setApiRoot( '/fakeApiRoot/' );
restApi.setCacheBusterCallback( route => {
	const parts = route.split( '?' ),
		query = parts.length > 1 ? parts[ 1 ] : '',
		args = query.length ? query.split( '&' ) : [];

	args.push( '_cacheBuster=1234' );

	return parts[ 0 ] + '?' + args.join( '&' );
} );

describe( 'restApi', () => {
	describe( 'GET requests', () => {
		before( () => {
			fetchMock.mock(
				{ method: 'POST', url: /\/jetpack\/v4\/licensing\/attach-licenses/, name: 'attach-licenses' },
				JSON.stringify( [ { activatedProductId: 1 } ] )
			);
			fetchMock.mock(
				{ method: 'GET', url: /\/jetpack\/v4\/connection/, name: 'connection' },
				JSON.stringify( 'the body' )
			);
		} );
		after( () => fetchMock.restore() );

		it( 'returns an object with methods', () => {
			expect( typeof restApi ).to.equal( 'object' );
			expect( restApi ).to.respondTo( 'setApiRoot' );
		} );

		it( 'can fetchSiteConnectionStatus', async () => {
			const connectionStatus = await restApi.fetchSiteConnectionStatus();
			// expect(fetchMock).route('connection').to.have.been.called;
			expect( connectionStatus ).to.equal( 'the body' );
		} );

		it( 'can post attachLicenses', async () => {
			const results = await restApi.attachLicenses();
			expect( results ).to.deep.equal( [ { activatedProductId: 1 } ] );
		} );
	} );
} );
