import { render } from '@testing-library/react';
import AutomatticBylineLogo from '../index';
import '@testing-library/jest-dom';

describe( 'AutomatticBylineLogo', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the AutomatticBylineLogo component', () => {
		it( 'validate the class name', () => {
			const { container } = render( <AutomatticBylineLogo { ...testProps } /> );
			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveClass( 'sample-classname' );
		} );
	} );
} );
