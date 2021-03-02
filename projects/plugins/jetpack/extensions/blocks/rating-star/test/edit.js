/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import { Rating } from '../edit';

describe( 'Rating', () => {

	const defaultProps = {
		id: 1,
		setRating: jest.fn(),
		children: [ <p>Things are just fine!</p> ]
	};
	test( 'loads and displays children', () => {
		render( <Rating { ...defaultProps } /> );
		expect( screen.getByText( 'Things are just fine!' ) ).toBeInTheDocument();
	} );
} );
