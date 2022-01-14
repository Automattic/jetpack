/**
 * External dependencies
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/testing-react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import * as stories from './stories';

const { Default } = composeStories( stories );

describe( 'ProductCard', () => {
	test( 'calls onActionClick', () => {
		const onActionClick = jest.fn();
		render( <Default onActionClick={ onActionClick } /> );
		const actionButton = screen.getByRole( 'button', { name: 'Manage' } );
		userEvent.click( actionButton );
		expect( onActionClick ).toHaveBeenCalled();
	} );
} );
