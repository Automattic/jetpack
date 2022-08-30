import { render } from '@testing-library/react';
import Spinner from '../index';

describe( 'Spinner', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the Spinner component', () => {
		const { container } = render( <Spinner { ...testProps } /> );

		it( 'validate the class name', () => {
			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveClass( 'sample-classname' );
		} );
	} );
} );
