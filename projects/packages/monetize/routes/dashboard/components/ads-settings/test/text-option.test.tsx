import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextOption } from '../text-option';

const props = {
	name: 'wordads_custom_adstxt' as const,
	label: 'Additional ads.txt entries',
	disabled: false,
	isSaving: false,
	onSave: jest.fn(),
	multiline: true,
};

describe( 'TextOption', () => {
	it( 'keeps what the user typed when the save fails', async () => {
		const user = userEvent.setup();
		const { rerender } = render( <TextOption { ...props } value="" /> );
		await user.type( screen.getByRole( 'textbox' ), 'typed' );

		// The hook shows the asked-for value while saving, then the stored one again on failure.
		rerender( <TextOption { ...props } value="typed" isSaving /> );
		rerender( <TextOption { ...props } value="" /> );

		expect( screen.getByRole( 'textbox' ) ).toHaveValue( 'typed' );
	} );
} );
