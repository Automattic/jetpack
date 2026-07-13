import { render } from '@testing-library/react';
import { StarIcon } from '../icon';

describe( 'StarIcon', () => {
	const defaultProps = {
		color: 'orange',
		className: 'juice',
	};

	test( 'loads and applies default props to children', () => {
		const { container } = render( <StarIcon /> );
		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstChild ).toHaveAttribute( 'color', 'currentColor' );
		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstChild.firstChild ).toHaveAttribute( 'class', '' );
	} );

	test( 'loads and applies passed props to children', () => {
		const { container } = render( <StarIcon { ...defaultProps } /> );
		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstChild ).toHaveAttribute( 'color', 'orange' );
		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstChild.firstChild ).toHaveClass( 'juice' );
	} );
} );
