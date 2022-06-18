import { render } from '@testing-library/react';
import Spinner from '../index';

describe( 'Spinner', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the Spinner component', () => {
		it( 'component exists', () => {
			const { container } = render( <Spinner { ...testProps } /> );

			expect( container ).toBeInstanceOf( HTMLDivElement );
		} );

		it( 'validate the class name', () => {
			const { container } = render( <Spinner { ...testProps } /> );

			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstElementChild.className ).toContain( testProps.className );
		} );
	} );
} );
