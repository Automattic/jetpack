/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import { StarIcon } from '../icon';

describe( 'StarIcon', () => {
	const defaultProps = {
		color: 'orange',
		className: 'juice',
	};

	test( 'loads and applies default props to children', () => {
		const { container } = render( <StarIcon /> );
		expect( container.firstChild.getAttribute( 'color' ) ).toEqual( 'currentColor' );
		expect( container.firstChild.firstChild.getAttribute( 'class' ) ).toEqual( '' )
	} );

	test( 'loads and applies passed props to children', () => {
		const { container } = render( <StarIcon { ...defaultProps } /> );
		expect( container.firstChild.getAttribute( 'color' ) ).toEqual( 'orange' );
		expect( container.firstChild.firstChild ).toHaveClass( 'juice' );
	} );
} );
