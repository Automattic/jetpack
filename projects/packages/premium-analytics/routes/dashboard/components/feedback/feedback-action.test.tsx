/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { FeedbackAction } from './feedback-action';

const mockInitialize = jest.fn();
const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: ( ...args: unknown[] ) => mockInitialize( ...args ),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		site: { wpcom: { blog_id: 42 } },
		user: { current_user: { wpcom: { ID: 7, login: 'reader' } } },
	} ),
} ) );

beforeEach( () => {
	jest.clearAllMocks();
} );

/**
 * Renders the action and opens the modal, the way every case here starts.
 *
 * @return The `userEvent` session, for the rest of the interaction.
 */
async function openModal() {
	const user = userEvent.setup();
	render( <FeedbackAction /> );
	await user.click( screen.getByRole( 'button', { name: 'Any feedback?' } ) );
	return user;
}

describe( 'FeedbackAction', () => {
	it( 'records who is answering before the first event', async () => {
		await openModal();

		expect( mockInitialize ).toHaveBeenCalledWith( 7, 'reader' );
	} );

	it( 'reports the rating and comment as one event', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'button', { name: '4' } ) );
		await user.type( screen.getByRole( 'textbox' ), '  Needs a date picker  ' );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		expect( mockRecordEvent ).toHaveBeenLastCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			{ blog_id: 42, rating: 4, comment: 'Needs a date picker' }
		);
	} );

	it( 'holds the submission until a rating is picked', async () => {
		const user = await openModal();
		const submit = screen.getByRole( 'button', { name: 'Send feedback' } );

		await user.click( submit );

		expect( mockRecordEvent ).not.toHaveBeenCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			expect.anything()
		);

		await user.click( screen.getByRole( 'button', { name: '1' } ) );
		await user.click( submit );

		expect( mockRecordEvent ).toHaveBeenLastCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			{ blog_id: 42, rating: 1, comment: '' }
		);
	} );

	it( 'sends nothing when the reader backs out', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'button', { name: '5' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( mockRecordEvent ).not.toHaveBeenCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			expect.anything()
		);
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );
} );
