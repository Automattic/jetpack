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
import { SettingsGroup } from '../index';

describe( 'SettingsGroup', () => {

	let testProps = {
		learn_more_button: 'https://jetpack.com/support/protect'
	};

	const settingsGroup = shallow( <SettingsGroup support={ testProps.learn_more_button } hasChild /> );

	it( 'outputs a special CSS class when it has the hasChild property', () => {
		expect( settingsGroup.find( 'Card' ).props().className ).to.contain( 'jp-form-has-child' );
	} );

	it( 'the learn more icon has an informational tooltip', () => {
		expect( settingsGroup.find( 'InfoPopover' ) ).to.have.length( 1 );
		expect( settingsGroup.find( 'ExternalLink' ).get( 0 ).props.href ).to.be.equal( 'https://jetpack.com/support/protect' );
	} );

	it( 'if no support link is passed directly, looks for one in the module', () => {
		expect( shallow( <SettingsGroup module={ testProps } /> ).find( 'InfoPopover' ) ).to.have.length( 1 );
	} );

	it( 'does not have a learn more icon if there is no link or module are passed', () => {
		expect( shallow( <SettingsGroup /> ).find( 'InfoPopover' ) ).to.have.length( 0 );
	} );
} );
