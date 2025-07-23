import { render, screen } from '@testing-library/react';
import JetpackConnectionErrors from '../jetpack-connection-errors';

describe( 'JetpackConnectionErrors', () => {
	it( 'should render error with URL action', () => {
		const errors = [
			{
				code: 'custom_error',
				message: 'A custom error occurred',
				action: 'custom',
				data: {
					action_url: 'https://example.com/fix',
					action_label: 'Fix Issue',
				},
			},
		];

		render( <JetpackConnectionErrors errors={ errors } /> );

		expect( screen.getByText( 'A custom error occurred' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Fix Issue' ) ).toBeInTheDocument();
	} );

	it( 'should render error with secondary URL action', () => {
		const errors = [
			{
				code: 'custom_error',
				message: 'A custom error with secondary action',
				action: 'custom',
				data: {
					action_url: 'https://example.com/primary',
					action_label: 'Primary Action',
					secondary_action_url: 'https://example.com/secondary',
					secondary_action_label: 'Secondary Action',
				},
			},
		];

		render( <JetpackConnectionErrors errors={ errors } /> );

		expect( screen.getByText( 'A custom error with secondary action' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Primary Action' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Secondary Action' ) ).toBeInTheDocument();
	} );

	it( 'should render only primary action when secondary action is incomplete', () => {
		const errors = [
			{
				code: 'custom_error',
				message: 'A custom error with incomplete secondary action',
				action: 'custom',
				data: {
					action_url: 'https://example.com/primary',
					action_label: 'Primary Action',
					secondary_action_url: 'https://example.com/secondary',
					// Missing secondary_action_label
				},
			},
		];

		render( <JetpackConnectionErrors errors={ errors } /> );

		expect(
			screen.getByText( 'A custom error with incomplete secondary action' )
		).toBeInTheDocument();
		expect( screen.getByText( 'Primary Action' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Secondary Action' ) ).not.toBeInTheDocument();
	} );

	it( 'should handle multiple errors correctly', () => {
		const errors = [
			{
				code: 'error1',
				message: 'First error',
				action: 'reconnect',
			},
			{
				code: 'error2',
				message: 'Second error',
				action: 'custom',
				data: {
					action_url: 'https://example.com/fix',
					action_label: 'Fix Issue',
				},
			},
		];

		render( <JetpackConnectionErrors errors={ errors } /> );

		expect( screen.getByText( 'First error' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Second error' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Fix Issue' ) ).toBeInTheDocument();
	} );
} );
