import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import useProtectSettings from '../../../data/use-protect-settings';
import IpListField from '../ip-list-field';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const Field = () => (
	<IpListField
		data={ useProtectSettings() }
		name="list"
		label="Allowed"
		description="Allowed IPs"
	/>
);

describe( 'IpListField', () => {
	it( 'keeps the typed draft when its save fails', async () => {
		let failSave: ( reason: unknown ) => void;
		mockApiFetch.mockReturnValue( new Promise( ( _resolve, reject ) => ( failSave = reject ) ) );
		const user = userEvent.setup();
		render( <Field /> );
		await user.type( screen.getByRole( 'textbox' ), '12.12.12.1' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await act( async () => failSave( { message: 'Nope' } ) );

		expect( screen.getByRole( 'textbox' ) ).toHaveValue( '12.12.12.1' );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeEnabled();
	} );
} );
