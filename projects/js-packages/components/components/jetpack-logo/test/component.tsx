import { render } from '@testing-library/react';
import { expect } from 'chai';
import JetpackLogo from '../index';

describe( 'JetpackLogo', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackLogo component', () => {
		it( 'component exists', () => {
			const { container } = render( <JetpackLogo { ...testProps } /> );

			expect( container.firstElementChild ).to.be.an.instanceof( SVGSVGElement );
		} );

		it( 'validate the class name', () => {
			const { container } = render( <JetpackLogo { ...testProps } /> );

			expect( container.firstElementChild.getAttribute( 'class' ) ).to.include(
				testProps.className
			);
		} );
	} );
} );
