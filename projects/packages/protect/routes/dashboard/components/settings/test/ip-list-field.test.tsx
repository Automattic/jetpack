import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import useProtectSettings from '../../../data/use-protect-settings';
import IpListField from '../ip-list-field';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const Field = () => <IpListField data={ useProtectSettings() } name="list" label="Allowed" />;

// Two fields for one setting, as the Firewall and Login protection cards both edit the allow list.
const TwoFields = () => {
	const data = useProtectSettings();
	return (
		<>
			<IpListField data={ data } name="list" label="Allowed" />
			<IpListField data={ data } name="list" label="Also allowed" />
		</>
	);
};

describe( 'IpListField', () => {
	it( 'keeps the typed draft and says why when its save fails', async () => {
		let failSave: ( reason: unknown ) => void;
		mockApiFetch.mockReturnValue( new Promise( ( _resolve, reject ) => ( failSave = reject ) ) );
		const user = userEvent.setup();
		render( <Field /> );
		await user.type( screen.getByRole( 'textbox' ), '12.12.12.1' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await act( async () => failSave( { message: 'Nope' } ) );

		expect( screen.getByRole( 'textbox' ) ).toHaveValue( '12.12.12.1' );
		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'Nope' );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeEnabled();
	} );

	it( 'shows a failed save only under the field that saved', async () => {
		mockApiFetch.mockRejectedValue( { message: 'Nope' } );
		const user = userEvent.setup();
		render( <TwoFields /> );
		await user.type( screen.getByRole( 'textbox', { name: 'Allowed' } ), '12.12.12.1' );
		await user.click( screen.getAllByRole( 'button', { name: 'Save' } )[ 0 ] );

		await expect( screen.findAllByRole( 'alert' ) ).resolves.toHaveLength( 1 );
	} );
} );
