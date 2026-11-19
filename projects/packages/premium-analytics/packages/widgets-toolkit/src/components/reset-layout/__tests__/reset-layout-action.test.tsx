import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResetLayoutAction } from '../reset-layout-action';

describe( 'ResetLayoutAction', () => {
	it( 'asks before resetting, and Cancel changes nothing', async () => {
		const user = userEvent.setup();
		const onReset = jest.fn();
		render( <ResetLayoutAction onReset={ onReset } /> );

		await user.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );
		const dialog = await screen.findByRole( 'alertdialog' );
		expect( dialog ).toBeVisible();

		await user.click( within( dialog ).getByRole( 'button', { name: 'Cancel' } ) );

		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
		expect( onReset ).not.toHaveBeenCalled();
	} );

	it( 'resets on confirmation and closes', async () => {
		const user = userEvent.setup();
		const onReset = jest.fn();
		render( <ResetLayoutAction onReset={ onReset } /> );

		await user.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );
		const dialog = await screen.findByRole( 'alertdialog' );

		await user.click( within( dialog ).getByRole( 'button', { name: 'Reset' } ) );

		expect( onReset ).toHaveBeenCalledTimes( 1 );
		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
	} );
} );
