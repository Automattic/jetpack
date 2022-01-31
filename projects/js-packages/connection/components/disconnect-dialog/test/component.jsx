/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import DisconnectDialog from '../index';

describe( 'DisconnectDialog', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		isOpen: true, // render open for tests, nothing renders if this is false
	};

	describe( 'Initially', () => {
		const wrapper = shallow( <DisconnectDialog { ...testProps } /> );

		it( 'renders the Modal', () => {
			expect( wrapper.find( '.jp-connection__disconnect-dialog' ) ).to.have.lengthOf( 1 );
		} );

		it( 'renders the "StepDisconnect" step', () => {
			expect( wrapper.find( 'StepDisconnect' ) ).to.exist;
		} );
	} );
} );
