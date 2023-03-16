import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import TemplatePicker from '..';

/**
 * Helper method to set up the user event.
 *
 * @param {ReactElement} jsx - The element to render.
 * @returns {object} An object with the user method and everything from the render method.
 */
const setup = jsx => ( {
	user: userEvent.setup(),
	...render( jsx ),
} );

describe( 'TemplatePicker', () => {
	it( 'should render the template picker and pick a template', async () => {
		const handleSelect = jest.fn();
		const { user } = setup(
			<TemplatePicker
				onSelect={ handleSelect }
				render={ ( { open } ) => <button onClick={ open }>Open Template Picker</button> } // eslint-disable-line
			/>
		);
		const openButton = await screen.findByText( /Open Template Picker/i );
		await user.click( openButton );
		expect( screen.getByText( /Pick a Template/i ) ).toBeInTheDocument();

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
		const { user } = setup(
			<TemplatePicker
				onSelect={ handleSelect }
				render={ ( { open } ) => <button onClick={ open }>Open Template Picker</button> } // eslint-disable-line
			/>
		);
		const openButton = await screen.findByText( /Open Template Picker/i );
		await user.click( openButton );
		expect( screen.getByText( /Pick a Template/i ) ).toBeInTheDocument();

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
