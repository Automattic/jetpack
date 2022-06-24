import { render } from '@testing-library/react';
import React from 'react';
import AutomatticBylineLogo from '../index';
import '@testing-library/jest-dom';

describe( 'AutomatticBylineLogo', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the AutomatticBylineLogo component', () => {
		const { container } = render( <AutomatticBylineLogo { ...testProps } /> );

		it( 'validate the class name', () => {
			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveClass( 'sample-classname' );
		} );
	} );
} );
