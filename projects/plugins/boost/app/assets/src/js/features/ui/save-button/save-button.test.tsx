/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-class, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import SaveButton from './save-button';

it( 'renders the compact design-system button and ignores clicks while disabled', () => {
	const onClick = jest.fn();
	const { rerender } = render( <SaveButton disabled onClick={ onClick } /> );
	const save = screen.getByRole( 'button', { name: 'Save' } );
	expect( save.getAttribute( 'aria-disabled' ) ).toBe( 'true' );
	expect( save.className ).not.toContain( 'components-button' );
	fireEvent.click( save );
	expect( onClick ).not.toHaveBeenCalled();

	rerender( <SaveButton disabled={ false } onClick={ onClick } /> );
	fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
	expect( onClick ).toHaveBeenCalledTimes( 1 );
} );
