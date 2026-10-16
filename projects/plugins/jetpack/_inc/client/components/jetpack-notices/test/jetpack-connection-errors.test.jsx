import { render, screen } from 'test/test-utils';
import JetpackConnectionErrors from '../jetpack-connection-errors';

// The 'reconnect' action reaches a connected NoticeActionReconnect, which reads
// the site reconnection request state.
const initialState = {
	jetpack: { connection: { requests: { reconnectingSite: false } } },
};

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

	it( "should render an informational notice with no action for the 'none' action", () => {
		const errors = [
			{
				code: 'no_valid_user_token',
				message: 'The connection owner needs to reconnect their account.',
				action: 'none',
				data: {},
			},
		];

		render( <JetpackConnectionErrors errors={ errors } />, { initialState } );

		expect(
			screen.getByText( 'The connection owner needs to reconnect their account.' )
		).toBeInTheDocument();
		// Matched by label, not by role: NoticeAction renders an <a> with no href, which
		// has no implicit link role, so queryByRole( 'link' ) can never fail here.
		expect( screen.queryByText( 'Restore Connection' ) ).not.toBeInTheDocument();
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

		render( <JetpackConnectionErrors errors={ errors } />, { initialState } );

		expect( screen.getByText( 'First error' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Second error' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Fix Issue' ) ).toBeInTheDocument();
		// Positive control for the 'none' case above: proves this query can see the CTA.
		expect( screen.getByText( 'Restore Connection' ) ).toBeInTheDocument();
	} );
} );
