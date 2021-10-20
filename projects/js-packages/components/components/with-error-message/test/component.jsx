/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import withErrorMessage from '../index';

describe( 'withErrorMessage', () => {
	const testProps = {
		errorMessage: 'Sample error',
		displayError: true,
	};

	describe( 'Render the input component wrapped in withErrorMessage HOC', () => {
		const WrappedButton = withErrorMessage( Button );
		const wrapper = shallow( <WrappedButton { ...testProps } /> );

		it( 'renders the error message', () => {
			expect(
				wrapper.find( '.jp-components-error-message--error-message ErrorGridicon' ).text()
			).to.be.equal( '<ErrorGridicon />' );
			expect(
				wrapper.find( '.jp-components-error-message--error-message span' ).text()
			).to.be.equal( testProps.errorMessage );
		} );
	} );
} );
