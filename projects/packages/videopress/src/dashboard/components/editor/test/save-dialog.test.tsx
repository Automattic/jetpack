import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaveVideoDialog from '../save-dialog';

const title = 'A very edited video';

it( 'defaults to updating the current video and explains the chapter impact', async () => {
	const onSave = jest.fn();
	render(
		<SaveVideoDialog title={ title } isBusy={ false } onSave={ onSave } onCancel={ jest.fn() } />
	);
	expect( screen.getByRole( 'radio', { name: 'Update existing video' } ) ).toBeChecked();
	expect( screen.getByText( /Existing chapters may need to be adjusted/ ) ).toBeInTheDocument();
	expect( screen.queryByRole( 'textbox', { name: 'New video title' } ) ).not.toBeInTheDocument();
	await userEvent.setup().click( screen.getByRole( 'button', { name: 'Update video' } ) );
	expect( onSave ).toHaveBeenCalledWith( 'update', `${ title } (edited)` );
} );

it( 'offers a separate video with a default title and trims the submitted title', async () => {
	const onSave = jest.fn();
	const user = userEvent.setup();
	render(
		<SaveVideoDialog title={ title } isBusy={ false } onSave={ onSave } onCancel={ jest.fn() } />
	);
	await user.click( screen.getByRole( 'radio', { name: 'Save as new video' } ) );
	const input = screen.getByRole( 'textbox', { name: 'New video title' } );
	expect( input ).toHaveValue( `${ title } (edited)` );
	expect( screen.getByText( /The current video stays unchanged/ ) ).toBeInTheDocument();
	expect(
		screen.queryByText( /Existing chapters may need to be adjusted/ )
	).not.toBeInTheDocument();
	await user.clear( input );
	await user.type( input, '  A separate version  ' );
	await user.click( screen.getByRole( 'button', { name: 'Save as new video' } ) );
	expect( onSave ).toHaveBeenCalledWith( 'copy', 'A separate version' );
} );

it( 'rejects whitespace titles for copies while allowing the existing video to be updated', async () => {
	const onSave = jest.fn();
	const user = userEvent.setup();
	render(
		<SaveVideoDialog title={ title } isBusy={ false } onSave={ onSave } onCancel={ jest.fn() } />
	);
	await user.click( screen.getByRole( 'radio', { name: 'Save as new video' } ) );
	const input = screen.getByRole( 'textbox', { name: 'New video title' } );
	await user.clear( input );
	await user.type( input, '   ' );
	const saveCopy = screen.getByRole( 'button', { name: 'Save as new video' } );
	expect( saveCopy ).toHaveAttribute( 'aria-disabled', 'true' );
	await user.click( saveCopy );
	expect( onSave ).not.toHaveBeenCalled();
	await user.click( screen.getByRole( 'radio', { name: 'Update existing video' } ) );
	expect( screen.getByRole( 'button', { name: 'Update video' } ) ).not.toHaveAttribute(
		'aria-disabled',
		'true'
	);
} );

it( 'prevents repeated save and cancellation while a request is busy', async () => {
	const onSave = jest.fn();
	const onCancel = jest.fn();
	const user = userEvent.setup();
	const props = { title, onSave, onCancel };
	const { rerender } = render( <SaveVideoDialog { ...props } isBusy={ false } /> );
	await user.click( screen.getByRole( 'radio', { name: 'Save as new video' } ) );
	rerender( <SaveVideoDialog { ...props } isBusy /> );
	expect( screen.getByRole( 'textbox', { name: 'New video title' } ) ).toBeDisabled();
	expect( screen.getByRole( 'radio', { name: 'Update existing video' } ) ).toBeDisabled();
	expect( screen.queryByRole( 'button', { name: 'Close' } ) ).not.toBeInTheDocument();
	const save = screen.getByRole( 'button', { name: 'Save as new video' } );
	const cancel = screen.getByRole( 'button', { name: 'Cancel' } );
	expect( save ).toHaveAttribute( 'aria-disabled', 'true' );
	expect( cancel ).toHaveAttribute( 'aria-disabled', 'true' );
	await user.click( save );
	await user.click( cancel );
	await user.keyboard( '{Escape}' );
	expect( onSave ).not.toHaveBeenCalled();
	expect( onCancel ).not.toHaveBeenCalled();
} );
