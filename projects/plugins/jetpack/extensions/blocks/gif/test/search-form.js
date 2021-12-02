/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event'

/**
 * Internal dependencies
 */
import SearchForm from '../components/search-form';

describe( 'SearchForm', () => {
	const onChange = jest.fn();
	const onSubmit = jest.fn();
	const ref = {
		current: {
			focus: jest.fn()
		}
	};
	const defaultProps = {
		onChange,
		onSubmit,
		value: 'Woolloomooloo',
		ref,
	};

	test( 'loads and applies value to input field', () => {
		render( <SearchForm { ...defaultProps } /> );
		expect( screen.getByPlaceholderText( 'Enter search terms, e.g. cat…' ).value ).toBe( 'Woolloomooloo' );
	} );

	test( 'loads and applies passed props to children', () => {
		render( <SearchForm { ...defaultProps } value={ '' }/> );
		userEvent.type( screen.getByPlaceholderText( 'Enter search terms, e.g. cat…' ), 'Hi' );
		expect( onChange ).toHaveBeenCalledTimes( 2 );
	} );

	test( 'loads and applies passed props to children', () => {
		const { container } = render( <SearchForm { ...defaultProps } /> );
		fireEvent.submit( container.querySelector( 'form' ) );
		expect( onSubmit ).toHaveBeenCalled();
	} );
} );
