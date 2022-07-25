import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchForm from '../components/search-form';

describe( 'SearchForm', () => {
	const onChange = jest.fn();
	const onSubmit = jest.fn();
	const ref = {
		current: {
			focus: jest.fn(),
		},
	};
	const defaultProps = {
		onChange,
		onSubmit,
		value: 'Woolloomooloo',
		ref,
	};

	test( 'loads and applies value to input field', () => {
		render( <SearchForm { ...defaultProps } /> );
		expect( screen.getByPlaceholderText( 'Enter search terms, e.g. cat…' ).value ).toBe(
			'Woolloomooloo'
		);
	} );

	test( 'loads and applies passed props to children', async () => {
		const user = userEvent.setup();
		render( <SearchForm { ...defaultProps } value={ '' } /> );
		await user.type( screen.getByPlaceholderText( 'Enter search terms, e.g. cat…' ), 'Hi' );
		expect( onChange ).toHaveBeenCalledTimes( 2 );
	} );

	test( 'calls onSubmit on submit', () => {
		const { container } = render( <SearchForm { ...defaultProps } /> );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		fireEvent.submit( container.querySelector( 'form' ) );
		expect( onSubmit ).toHaveBeenCalled();
	} );
} );
