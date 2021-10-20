/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import ActionButton from '../index';

describe( 'ActionButton', () => {
	const testProps = {
		label: 'Action!',
	};

	describe( 'Render the ActionButton component', () => {
		const wrapper = shallow( <ActionButton { ...testProps } /> );

		it( 'component exists', () => {
			expect( wrapper.find( 'ActionButton' ) ).to.exist;
		} );

		it( 'renders the register button', () => {
			expect( wrapper.find( 'ActionButton' ).render().text() ).to.be.equal( 'Action!' );
		} );
	} );
} );
