/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import ConnectionBanner from '../index';
import ConnectButton from 'components/connect-button';

describe( 'ConnectionBanner', () => {

    let testProps = {
        'title': 'The title',
        'description': 'The description',
    };

    describe( 'Initially', () => {

        const store = {};
        const wrapper = shallow( <ConnectionBanner { ...testProps } /> );

        it( 'does not pass any properties to ConnectButton', () => {
            expect( wrapper.find( ConnectButton ).props().connectUser ).to.not.exist;
            expect( wrapper.find( ConnectButton ).props().from ).to.not.exist;
            expect( wrapper.find( ConnectButton ).props().asLink ).to.not.exist;
            expect( wrapper.find( ConnectButton ).props().connectInPlace ).to.not.exist;
        } );

    } );

    describe( 'When the \'connectUser\' property is set', () => {

        testProps.connectUser = true;

        const wrapper = shallow( <ConnectionBanner { ...testProps } /> );

        it( 'sets the ConnectButton \'connectUser\' property to true', () => {
            expect( wrapper.find( ConnectButton ).props().connectUser ).to.be.true;
        } );

        testProps.connectUser = false;

        const wrapper2 = shallow( <ConnectionBanner { ...testProps } /> );

        it( 'sets the ConnectButton \'connectUser\' property to false', () => {
            expect( wrapper2.find( ConnectButton ).props().connectUser ).to.be.false;
        } );

    } );

    describe( 'When the \'from\' property is set', () => {

        testProps.from = 'from';

        const wrapper = shallow( <ConnectionBanner { ...testProps } /> );

        it( 'sets the ConnectButton \'from\' property', () => {
            expect( wrapper.find( ConnectButton ).props().from ).to.be.equal('from');
        } );

    } );

    describe( 'When the \'asLink\' property is set', () => {

        testProps.asLink = true;

        const wrapper = shallow( <ConnectionBanner { ...testProps } /> );

        it( 'sets the ConnectButton \'asLink\' property to true', () => {
            expect( wrapper.find( ConnectButton ).props().asLink ).to.be.true;
        } );

        testProps.asLink = false;

        const wrapper2 = shallow( <ConnectionBanner { ...testProps } /> );

        it( 'sets the ConnectButton \'asLink\' property to false', () => {
            expect( wrapper2.find( ConnectButton ).props().asLink ).to.be.false;
        } );

    } );

    describe( 'When the \'connectInPlace\' property is set', () => {

        testProps.connectInPlace = true;

        const wrapper = shallow( <ConnectionBanner { ...testProps } /> );

        it( 'sets the ConnectButton \'connectInPlace\' property to true', () => {
            expect( wrapper.find( ConnectButton ).props().connectInPlace ).to.be.true;
        } );

        testProps.connectInPlace = false;

        const wrapper2 = shallow( <ConnectionBanner { ...testProps } /> );

        it( 'sets the ConnectButton \'connectInPlace\' property to false', () => {
            expect( wrapper2.find( ConnectButton ).props().connectInPlace ).to.be.false;
        } );

    } );

} );
