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
import SettingsGroup from '../index';

describe( 'SettingsGroup', () => {

	let testProps = {
		learn_more_button: 'https://jetpack.com/support/protect'
	};

	const settingsGroup = shallow( <SettingsGroup support={ testProps.learn_more_button } /> );

	it( 'the learn more icon is linked to the correct URL', () => {
		expect( settingsGroup.find( 'Button' ).get(0).props.href ).to.be.equal( 'https://jetpack.com/support/protect' );
	} );

} );
