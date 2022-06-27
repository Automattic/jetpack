import { render } from '@testing-library/react';
import React from 'react';
import JetpackFooter from '../index';
import '@testing-library/jest-dom';

describe( 'JetpackFooter', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackFooter component', () => {
		const { container } = render( <JetpackFooter { ...testProps } /> );

		it( 'validate the class name', () => {
			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveClass( 'sample-classname' );
		} );
	} );
} );
