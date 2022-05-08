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
	test( 'calls onManage', async () => {
		const user = userEvent.setup();
		const onManage = jest.fn();
		render( <Default onManage={ onManage } /> );
		const actionButton = screen.getByRole( 'button', { name: 'Manage' } );
		await user.click( actionButton );
		expect( onManage ).toHaveBeenCalled();
	} );
} );
