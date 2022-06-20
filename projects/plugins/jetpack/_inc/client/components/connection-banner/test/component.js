import ConnectButton from 'components/connect-button';
import { shallow } from 'enzyme';
import React from 'react';
import { ConnectionBanner } from '../index';

describe( 'ConnectionBanner', () => {
	const testProps = {
		title: 'The title',
		description: 'The description',
	};

	describe( 'Initially', () => {
		const wrapper = shallow( <ConnectionBanner { ...testProps } /> );

		it( 'does not pass any properties to ConnectButton', () => {
			expect( wrapper.find( ConnectButton ).props().connectUser ).toBeFalsy();
			expect( wrapper.find( ConnectButton ).props().from ).toBeFalsy();
			expect( wrapper.find( ConnectButton ).props().asLink ).toBeFalsy();
			expect( wrapper.find( ConnectButton ).props().connectInPlace ).toBeFalsy();
		} );
	} );

	describe( "When the 'connectUser' property is set", () => {
		testProps.connectUser = true;

		const wrapper = shallow( <ConnectionBanner { ...testProps } /> );

		it( "sets the ConnectButton 'connectUser' property to true", () => {
			expect( wrapper.find( ConnectButton ).props().connectUser ).toBe( true );
		} );

		testProps.connectUser = false;

		const wrapper2 = shallow( <ConnectionBanner { ...testProps } /> );

		it( "sets the ConnectButton 'connectUser' property to false", () => {
			expect( wrapper2.find( ConnectButton ).props().connectUser ).toBe( false );
		} );
	} );

	describe( "When the 'from' property is set", () => {
		testProps.from = 'from';

		const wrapper = shallow( <ConnectionBanner { ...testProps } /> );

		it( "sets the ConnectButton 'from' property", () => {
			expect( wrapper.find( ConnectButton ).props().from ).toBe( 'from' );
		} );
	} );

	describe( "When the 'asLink' property is set", () => {
		testProps.asLink = true;

		const wrapper = shallow( <ConnectionBanner { ...testProps } /> );

		it( "sets the ConnectButton 'asLink' property to true", () => {
			expect( wrapper.find( ConnectButton ).props().asLink ).toBe( true );
		} );

		testProps.asLink = false;

		const wrapper2 = shallow( <ConnectionBanner { ...testProps } /> );

		it( "sets the ConnectButton 'asLink' property to false", () => {
			expect( wrapper2.find( ConnectButton ).props().asLink ).toBe( false );
		} );
	} );

	describe( "When the 'connectInPlace' property is set", () => {
		testProps.connectInPlace = true;

		const wrapper = shallow( <ConnectionBanner { ...testProps } /> );

		it( "sets the ConnectButton 'connectInPlace' property to true", () => {
			expect( wrapper.find( ConnectButton ).props().connectInPlace ).toBe( true );
		} );

		testProps.connectInPlace = false;

		const wrapper2 = shallow( <ConnectionBanner { ...testProps } /> );

		it( "sets the ConnectButton 'connectInPlace' property to false", () => {
			expect( wrapper2.find( ConnectButton ).props().connectInPlace ).toBe( false );
		} );
	} );
} );
