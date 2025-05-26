import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import TemplatePickerModal from '..';

jest.mock( '../../../../media-picker', () => {
	return () => <div>Media Picker</div>;
} );

jest.mock( '../../../../../hooks/use-media-details', () => {
	return jest.fn( () => [ {} ] );
} );

/**
 * Helper method to set up the user event.
 *
 * @param {ReactElement} jsx - The element to render.
 * @return {object} An object with the user method and everything from the render method.
 */
const setup = async jsx => ( {
	user: await userEvent.setup(),
	...render( jsx ),
} );

const openTemplatePickerModal = async ( { onSave = () => {}, imageId = null } = {} ) => {
	const { user } = await setup(
		<TemplatePickerModal
			onSave={ onSave }
			imageId={ imageId }
			render={ ( { open } ) => <button onClick={ open }>Open Template Picker</button> } // eslint-disable-line
		/>
	);
	const openButton = await screen.findByText( /Open Template Picker/i );
	await user.click( openButton );

	return { user };
};

describe( 'TemplatePickerModal', () => {
	beforeEach( () => {
		jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		// eslint-disable-next-line no-console
		console.warn.mockRestore();
	} );

	it( 'should open the template picker', async () => {
		await openTemplatePickerModal();

		expect( screen.getByText( /Set default Template and Image/i ) ).toBeInTheDocument();
	} );

	it( 'should close the template picker', async () => {
		const { user } = await openTemplatePickerModal();

		const cancelButton = screen.getByRole( 'button', {
			name: /Cancel/i,
		} );
		await user.click( cancelButton );

		expect( screen.queryByText( /Set default Template and Image/i ) ).not.toBeInTheDocument();
	} );

	it( 'should render the template picker and pick a template', async () => {
		const handleSave = jest.fn();
		const { user } = await openTemplatePickerModal( { onSave: handleSave } );

		const edgeTemplateButton = screen.getByRole( 'button', {
			name: /Pick the Edge template/i,
		} );
		await user.click( edgeTemplateButton );

		const saveButton = screen.getByRole( 'button', {
			name: /Save/i,
		} );
		await user.click( saveButton );

		expect( handleSave ).toHaveBeenCalledWith( { imageId: null, template: 'edge' } );
		expect( screen.queryByText( /Set default Template and Image/i ) ).not.toBeInTheDocument();
	} );

	it( 'should not select a template if user presses cancel', async () => {
		const handleSave = jest.fn();
		const { user } = await openTemplatePickerModal( { onSave: handleSave } );

		const edgeTemplateButton = screen.getByRole( 'button', {
			name: /Pick the Edge template/i,
		} );
		await user.click( edgeTemplateButton );

		const cancelButton = screen.getByRole( 'button', {
			name: /Cancel/i,
		} );
		await user.click( cancelButton );

		expect( handleSave ).not.toHaveBeenCalled();
		expect( screen.queryByText( /Set default Template and Image/i ) ).not.toBeInTheDocument();
	} );

	it( 'should pick a default image', async () => {
		const handleSave = jest.fn();
		const imageId = 123;
		const { user } = await openTemplatePickerModal( { onSave: handleSave, imageId } );

		const imagePicker = screen.getByText( /Media Picker/i );
		await user.click( imagePicker );

		const saveButton = screen.getByRole( 'button', {
			name: /Save/i,
		} );
		await user.click( saveButton );

		expect( handleSave ).toHaveBeenCalledWith( { imageId, template: null } );
		expect( screen.queryByText( /Set default Template and Image/i ) ).not.toBeInTheDocument();
	} );
} );
