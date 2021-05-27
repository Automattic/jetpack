/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ToolbarControls } from '../controls';

describe( 'Eventbrite block controls', () => {
	const setEditingUrl = jest.fn();
	const defaultProps = {
		setEditingUrl,
	};

	beforeEach( () => {
		setEditingUrl.mockClear();
	} );


	test( 'renders okay', () => {
		render( <ToolbarControls { ...defaultProps } /> );

		expect( screen.getByRole( 'button' ) ).toBeInTheDocument();
	} );

	test( 'fires click handler okay', () => {
		render( <ToolbarControls { ...defaultProps } /> );
		userEvent.click( screen.getByRole( 'button' ) );

		expect( setEditingUrl ).toHaveBeenCalledWith( true );

	} );
} );
