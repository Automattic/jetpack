import { composeStories } from '@storybook/testing-react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import * as stories from './stories';

const { Default, Absent } = composeStories( stories );

describe( 'ProductCard', () => {
	describe( 'when the product is active', () => {
		test( 'calls onManage', async () => {
			const user = userEvent.setup();
			const onManage = jest.fn();
			render( <Default onManage={ onManage } /> );
			const actionButton = screen.getByRole( 'button', { name: 'Manage' } );
			await user.click( actionButton );
			expect( onManage ).toHaveBeenCalled();
		} );
	} );

	describe( 'when the plugin is absent', () => {
		test( 'calls onAdd', async () => {
			const user = userEvent.setup();
			const onAdd = jest.fn();
			render( <Absent onAdd={ onAdd } /> );
			const actionButton = screen.getByRole( 'button', { name: 'Add Backup' } );
			await user.click( actionButton );
			expect( onAdd ).toHaveBeenCalled();
		} );
	} );
} );
