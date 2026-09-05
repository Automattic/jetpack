/**
 * External dependencies
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { resetTracksIdentityForTesting } from '../../hooks/use-track-event';
import { DashboardOptionsMenu } from './dashboard-options-menu';

const mockSetUser = jest.fn();
const mockIdentifyUser = jest.fn();
const mockAssignSuperProps = jest.fn();
const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		setUser: ( ...args: unknown[] ) => mockSetUser( ...args ),
		identifyUser: () => mockIdentifyUser(),
		assignSuperProps: ( ...args: unknown[] ) => mockAssignSuperProps( ...args ),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

const mockGetScriptData = jest.fn();
const mockCurrentUserCan = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => mockGetScriptData(),
	isSimpleSite: () => false,
	currentUserCan: ( capability: string ) => mockCurrentUserCan( capability ),
} ) );

const mockReturnToClassicStats = jest.fn();

jest.mock( './return-to-classic-stats', () => ( {
	returnToClassicStats: () => mockReturnToClassicStats(),
} ) );

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

beforeEach( () => {
	jest.clearAllMocks();
	resetTracksIdentityForTesting();
	mockGetScriptData.mockReturnValue( {
		site: { wpcom: { blog_id: 42 } },
		user: { current_user: { wpcom: { ID: 7, login: 'reader' } } },
	} );
	mockApiFetch.mockResolvedValue( 'success' );
	mockCurrentUserCan.mockReturnValue( true );
} );

/**
 * Renders the menu and opens the feedback modal, the way most cases here start.
 *
 * @return The `userEvent` session, for the rest of the interaction.
 */
async function openModal() {
	const user = userEvent.setup();
	render( <DashboardOptionsMenu /> );
	await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
	await user.click( await screen.findByRole( 'menuitem', { name: 'Any feedback?' } ) );
	return user;
}

describe( 'DashboardOptionsMenu', () => {
	it( 'keeps its entries behind the trigger', async () => {
		const user = userEvent.setup();
		render( <DashboardOptionsMenu /> );

		expect( screen.queryByRole( 'menuitem' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );

		await expect(
			screen.findByRole( 'menuitem', { name: 'Any feedback?' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it( 'closes the menu as it opens the modal', async () => {
		await openModal();

		expect( screen.getByRole( 'dialog' ) ).toBeVisible();
		await waitFor( () => expect( screen.queryByRole( 'menuitem' ) ).not.toBeInTheDocument() );
	} );

	it( 'reports the opening as its own event', async () => {
		await openModal();

		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_feedback_open',
			undefined
		);
	} );

	it( 'reports the rating and comment as one event', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: 'A bit better' } ) );
		await user.type( screen.getByRole( 'textbox' ), '  Needs a date picker  ' );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		expect( mockRecordEvent ).toHaveBeenLastCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			{ rating: 4, comment: 'Needs a date picker' }
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

		await user.click( screen.getByRole( 'radio', { name: 'Much worse' } ) );
		await user.click( submit );

		expect( mockRecordEvent ).toHaveBeenLastCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			{ rating: 1, comment: '' }
		);
	} );

	it( 'confirms the send rather than just closing', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: 'About the same' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		// Scoped to the dialog: `Notice` also mirrors the text into the a11y-speak live
		// region on `body`, so an unscoped query matches twice.
		expect(
			within( screen.getByRole( 'dialog' ) ).getByText( 'Thank you. This helps.' )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'radiogroup' ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'sends nothing when the reader backs out', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: 'Much better' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( mockRecordEvent ).not.toHaveBeenCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			expect.anything()
		);
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'caps the comment at the length Tracks will carry', async () => {
		await openModal();

		expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'maxlength', '1000' );
	} );
} );

describe( 'the rating scale', () => {
	it( 'names the group with the question it answers', async () => {
		await openModal();

		expect( screen.getByRole( 'radiogroup' ) ).toHaveAccessibleName(
			'Compared with the existing Traffic tab in Stats, the new Traffic tab is:'
		);
	} );

	it( 'offers the five points worst to best', async () => {
		await openModal();

		const scale = screen.getAllByRole< HTMLInputElement >( 'radio' );

		expect( scale.map( point => point.labels?.[ 0 ]?.textContent ) ).toEqual( [
			'Much worse',
			'A bit worse',
			'About the same',
			'A bit better',
			'Much better',
		] );
		expect( scale.map( point => point.value ) ).toEqual( [ '1', '2', '3', '4', '5' ] );
	} );
} );

describe( 'the Tracks identity', () => {
	it( 'identifies the reader and pins blog_id once, not per event', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: 'About the same' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		expect( mockRecordEvent ).toHaveBeenCalledTimes( 2 );
		expect( mockSetUser ).toHaveBeenCalledTimes( 1 );
		expect( mockSetUser ).toHaveBeenCalledWith( 7, 'reader' );
		expect( mockIdentifyUser ).toHaveBeenCalledTimes( 1 );
		expect( mockAssignSuperProps ).toHaveBeenCalledTimes( 1 );
		expect( mockAssignSuperProps ).toHaveBeenCalledWith( { blog_id: 42 } );
	} );

	it( 'identifies before the first event reaches Tracks', async () => {
		await openModal();

		expect( mockIdentifyUser.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			mockRecordEvent.mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'still records when the site carries no WPCOM identity', async () => {
		mockGetScriptData.mockReturnValue( {} );

		await openModal();

		expect( mockSetUser ).not.toHaveBeenCalled();
		expect( mockIdentifyUser ).not.toHaveBeenCalled();
		expect( mockAssignSuperProps ).not.toHaveBeenCalled();
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_feedback_open',
			undefined
		);
	} );

	it( 'skips the blog_id super prop when the site is not connected', async () => {
		mockGetScriptData.mockReturnValue( {
			user: { current_user: { wpcom: { ID: 7, login: 'reader' } } },
		} );

		await openModal();

		expect( mockSetUser ).toHaveBeenCalledWith( 7, 'reader' );
		expect( mockAssignSuperProps ).not.toHaveBeenCalled();
	} );
} );

describe( 'the Happiness copy of the feedback', () => {
	it( 'sends the message and the rating to the WPCOM feedback endpoint', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: 'A bit worse' } ) );
		await user.type( screen.getByRole( 'textbox' ), '  Missing the date picker  ' );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/jetpack-premium-analytics/v1/proxy/v2/jetpack-stats/user-feedback',
				method: 'POST',
				data: {
					source_url: window.location.href,
					product_name: 'Jetpack Stats v2',
					feedback: 'Missing the date picker',
					rating: 2,
				},
			} )
		);
	} );

	it( 'keeps a bare rating out of the support queue', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: 'Much better' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		expect( mockRecordEvent ).toHaveBeenLastCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			{ rating: 5, comment: '' }
		);
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'still thanks the reader when the endpoint fails', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'throttled' ) );
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: 'About the same' } ) );
		await user.type( screen.getByRole( 'textbox' ), 'Charts load slowly' );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		expect(
			within( screen.getByRole( 'dialog' ) ).getByText( 'Thank you. This helps.' )
		).toBeInTheDocument();
	} );
} );

describe( 'switching the new Traffic tab off', () => {
	/**
	 * Opens the menu and picks the switch-off entry, so the confirmation is up.
	 *
	 * @return The `userEvent` session, for the rest of the interaction.
	 */
	async function openConfirmation() {
		const user = userEvent.setup();
		render( <DashboardOptionsMenu /> );
		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Switch off the new Traffic tab' } )
		);
		return user;
	}

	it( 'is offered to those who can change site settings', async () => {
		mockCurrentUserCan.mockReturnValue( false );
		const user = userEvent.setup();
		render( <DashboardOptionsMenu /> );

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );

		await expect(
			screen.findByRole( 'menuitem', { name: 'Any feedback?' } )
		).resolves.toBeInTheDocument();
		expect( mockCurrentUserCan ).toHaveBeenCalledWith( 'manage_options' );
		expect(
			screen.queryByRole( 'menuitem', { name: 'Switch off the new Traffic tab' } )
		).not.toBeInTheDocument();
	} );

	it( 'asks before switching off, and Cancel changes nothing', async () => {
		const user = await openConfirmation();

		const dialog = screen.getByRole( 'dialog', { name: 'Switch off the new Traffic tab?' } );
		expect( dialog ).toHaveTextContent(
			"You'll go back to your current Stats. You can switch the new Traffic tab on again from the banner there."
		);
		expect( mockApiFetch ).not.toHaveBeenCalled();

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		expect( mockApiFetch ).not.toHaveBeenCalled();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
		expect( mockReturnToClassicStats ).not.toHaveBeenCalled();
	} );

	it( 'writes the opt-in off, reports it, and returns the reader to classic Stats', async () => {
		const user = await openConfirmation();

		await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

		await waitFor( () => expect( mockReturnToClassicStats ).toHaveBeenCalledTimes( 1 ) );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/settings',
			method: 'POST',
			data: { jetpack_premium_analytics_enabled: false },
		} );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_preview_disable',
			undefined
		);
		// The beacon goes out ahead of the write, so the navigation cannot cut it short.
		expect( mockRecordEvent.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			mockApiFetch.mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'keeps the reader here when the write fails', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'rest_forbidden' ) );
		const user = await openConfirmation();

		await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

		const dialog = screen.getByRole( 'dialog' );
		await expect(
			within( dialog ).findByText( "We couldn't switch it off. Please try again." )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Switch it off' } ) ).toBeEnabled();
		expect( mockReturnToClassicStats ).not.toHaveBeenCalled();
	} );
} );
