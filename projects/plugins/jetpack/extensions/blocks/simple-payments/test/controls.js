/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import { PanelControls } from '../controls';

const setAttributes = jest.fn();

const panelProps = {
	postLinKText: 'Click here to buy',
	setAttributes,
};

beforeEach( () => {
	setAttributes.mockClear();
} );

describe( 'Panel controls', () => {
	test( 'shows purchase text input when settings tab expanded', () => {
		render( <PanelControls { ...panelProps } /> );
		userEvent.click( screen.getByText( 'Settings' ) );
		expect( screen.getByPlaceholderText( 'Click here to purchase' ) ).toBeInTheDocument();
	} );

	test( 'sets postLinkText attribute when post link text field updated', () => {
		render( <PanelControls { ...panelProps } /> );
		userEvent.click( screen.getByText( 'Settings' ) );
		userEvent.type( screen.getByPlaceholderText( 'Click here to purchase' ), 'A' );
		expect( setAttributes ).toHaveBeenCalledWith( { postLinkText: 'A' } );
	} );
} );
