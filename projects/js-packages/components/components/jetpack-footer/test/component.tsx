import { render } from '@testing-library/react';
import JetpackFooter from '../index';

describe( 'JetpackFooter', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackFooter component', () => {
		it( 'validate the class name', () => {
			const { container } = render( <JetpackFooter { ...testProps } /> );
			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveClass( 'sample-classname' );
		} );
	} );
} );
