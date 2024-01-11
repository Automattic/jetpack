import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import TemplatePickerModal from '..';

/**
 * Helper method to set up the user event.
 *
 * @param {ReactElement} jsx - The element to render.
 * @returns {object} An object with the user method and everything from the render method.
 */
const setup = async jsx => ( {
	user: await userEvent.setup(),
	...render( jsx ),
} );

const openTemplatePickerModal = async ( { onSelect = () => {} } = {} ) => {
	const { user } = await setup(
		<TemplatePickerModal
			onSelect={ onSelect }
			render={ ( { open } ) => <button onClick={ open }>Open Template Picker</button> } // eslint-disable-line
		/>
	);
	const openButton = await screen.findByText( /Open Template Picker/i );
	await user.click( openButton );

	return { user };
};

describe( 'TemplatePickerModal', () => {
	it( 'should open the template picker', async () => {
		await openTemplatePickerModal();

		expect( screen.getByText( /Pick a Template/i ) ).toBeInTheDocument();
	} );

	it( 'should close the template picker', async () => {
		const { user } = await openTemplatePickerModal();

		const cancelButton = screen.getByRole( 'button', {
			name: /Cancel/i,
		} );
		await user.click( cancelButton );

		expect( screen.queryByText( /Pick a Template/i ) ).not.toBeInTheDocument();
	} );

	it( 'should render the template picker and pick a template', async () => {
		const handleSelect = jest.fn();
		const { user } = await openTemplatePickerModal( { onSelect: handleSelect } );

		const edgeTemplateButton = screen.getByRole( 'button', {
			name: /Pick the Edge template/i,
		} );
		await user.click( edgeTemplateButton );

		const saveButton = screen.getByRole( 'button', {
			name: /Save/i,
		} );
		await user.click( saveButton );

		expect( handleSelect ).toHaveBeenCalledWith( 'edge' );
		expect( screen.queryByText( /Pick a Template/i ) ).not.toBeInTheDocument();
	} );

	it( 'should not select a template if user presses cancel', async () => {
		const handleSelect = jest.fn();
		const { user } = await openTemplatePickerModal( { onSelect: handleSelect } );

		const edgeTemplateButton = screen.getByRole( 'button', {
			name: /Pick the Edge template/i,
		} );
		await user.click( edgeTemplateButton );

		const cancelButton = screen.getByRole( 'button', {
			name: /Cancel/i,
		} );
		await user.click( cancelButton );

		expect( handleSelect ).not.toHaveBeenCalled();
		expect( screen.queryByText( /Pick a Template/i ) ).not.toBeInTheDocument();
	} );
} );
