import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nMenuGroup } from '../index';

describe( 'I18nMenuGroup', () => {
	it( 'renders Greek and passes the formatted language option on click', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render( <I18nMenuGroup onChange={ onChange } /> );

		const greekOption = screen.getByRole( 'menuitem', { name: 'Greek' } );
		expect( greekOption ).toBeInTheDocument();

		await user.click( greekOption );
		expect( onChange ).toHaveBeenCalledWith( 'el (Greek)' );
	} );
} );
