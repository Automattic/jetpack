/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import { AuthIframe } from '../index';

describe( 'AuthIframe', () => {

    let testProps = {
        fetchingConnectUrl: true,
        connectUrl        : 'https://jetpack.wordpress.com/jetpack.authorize/1/',
        scrollToIframe    : false,
    };

    describe( 'Initially (connect url still fetching)', () => {

        const wrapper = shallow( <AuthIframe { ...testProps } /> );

        it( 'renders a loading... message', () => {
            expect( wrapper.find( 'p' ).text() ).to.be.equal( 'Loading…' );
        } );
    } );

    // Fetching done
    testProps.fetchingConnectUrl = false;

    describe( 'When the connect url is fetched', () => {

        const wrapper = shallow( <AuthIframe { ...testProps } /> );

        it( 'has a link to jetpack.wordpress.com', () => {
            expect( wrapper.find( 'iframe' ).props().src ).to.be.equal( 'https://jetpack.wordpress.com/jetpack.authorize_iframe/1/' );
        } );

        it( 'has 100% width', () => {
            expect( wrapper.find( 'iframe' ).props().width ).to.be.equal( '100%' );
        } );

        it( 'has 220 height', () => {
            expect( wrapper.find( 'iframe' ).props().height ).to.be.equal( '220' );
        } );
    } );

} );
