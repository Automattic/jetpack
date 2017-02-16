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

	it( 'the learn more icon has an informational tooltip', () => {
		expect( settingsGroup.find( 'InfoPopover' ) ).to.have.length( 1 );
		expect( settingsGroup.find( 'ExternalLink' ).get( 0 ).props.href ).to.be.equal( 'https://jetpack.com/support/protect' );
	} );

	it( 'outputs a special CSS class when it adds the hasChild property', () => {
		expect( settingsGroup.find( 'Card' ).props().className ).to.contain( 'jp-form-has-child' );
	} );

} );
