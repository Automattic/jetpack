/**
 * External dependencies
 */
import { expect } from 'chai';
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Spinner from '../index';

describe( 'Spinner', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the Spinner component', () => {
		it( 'component exists', () => {
			const { container } = render( <Spinner { ...testProps } /> );

			expect( container ).to.be.an.instanceof( HTMLDivElement );
		} );

		it( 'validate the class name', () => {
			const { container } = render( <Spinner { ...testProps } /> );

			expect( container.firstElementChild.className ).to.include( testProps.className );
		} );
	} );
} );
