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

const READY = "Yes, I'd be happy to switch now";
const ALMOST = 'Almost — there are a few things missing';

// What the settings route echoes once the opt-in is off.
const SETTINGS_OFF = { jetpack_premium_analytics_enabled: false };

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
	mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
		Promise.resolve( path === '/wp/v2/settings' ? SETTINGS_OFF : 'success' )
	);
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

	it( 'reports the readiness answer and comment as one event', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: ALMOST } ) );
		await user.type( screen.getByRole( 'textbox' ), '  Needs a date picker  ' );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		expect( mockRecordEvent ).toHaveBeenLastCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			{ readiness: 'almost', comment: 'Needs a date picker' }
		);
	} );

	it( 'holds the submission until an answer is picked', async () => {
		const user = await openModal();
		const submit = screen.getByRole( 'button', { name: 'Send feedback' } );

		expect( submit ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( submit );

		expect( mockRecordEvent ).not.toHaveBeenCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			expect.anything()
		);

		await user.click( screen.getByRole( 'radio', { name: 'Not yet' } ) );
		await user.click( submit );

		expect( mockRecordEvent ).toHaveBeenLastCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			{ readiness: 'not_yet', comment: '' }
		);
	} );

	it( 'confirms the send rather than just closing', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: 'Not yet' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		// Scoped to the dialog: `Notice` also mirrors the text into the a11y-speak live
		// region on `body`, so an unscoped query matches twice.
		const dialog = within( screen.getByRole( 'dialog' ) );
		expect( dialog.getByText( 'Thanks, your feedback has gone to the team.' ) ).toBeInTheDocument();
		expect(
			dialog.getByText(
				"It'll help us decide what to fix before the new Traffic tab replaces the old one. You can send more any time from the same menu."
			)
		).toBeInTheDocument();
		expect( screen.queryByRole( 'radiogroup' ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'sends nothing when the reader backs out', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: READY } ) );
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

describe( 'the readiness question', () => {
	it( 'names the group with the question it answers', async () => {
		await openModal();

		expect( screen.getByRole( 'radiogroup' ) ).toHaveAccessibleName(
			'Is the new Traffic tab ready to replace the old one?'
		);
	} );

	it( 'offers the three answers, readiest first', async () => {
		await openModal();

		const answers = screen.getAllByRole< HTMLInputElement >( 'radio' );

		expect( answers.map( answer => answer.labels?.[ 0 ]?.textContent ) ).toEqual( [
			READY,
			ALMOST,
			'Not yet',
		] );
		expect( answers.map( answer => answer.value ) ).toEqual( [ 'ready', 'almost', 'not_yet' ] );
	} );

	it( 'asks what is missing under it', async () => {
		await openModal();

		expect( screen.getByRole( 'textbox', { name: "What's missing?" } ) ).toBeInTheDocument();
	} );
} );

describe( 'the Tracks identity', () => {
	it( 'identifies the reader and pins blog_id once, not per event', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: READY } ) );
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
	// The endpoint has no readiness field, so the answer has to survive as message text.
	it.each( [
		[ READY, 'Yes, ready to switch now' ],
		[ ALMOST, 'Almost, a few things missing' ],
		[ 'Not yet', 'Not yet' ],
	] )( 'sends "%s" as message text, and no rating', async ( label, answer ) => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: label } ) );
		await user.type( screen.getByRole( 'textbox' ), '  Missing the date picker  ' );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/jetpack-premium-analytics/v1/proxy/v2/jetpack-stats/user-feedback',
				method: 'POST',
				data: {
					source_url: window.location.href,
					product_name: 'Jetpack Stats v2',
					feedback: `Ready to replace the old Traffic tab? ${ answer }\n\nMissing the date picker`,
				},
			} )
		);
	} );

	it( 'keeps a bare answer out of the support queue', async () => {
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: READY } ) );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		expect( mockRecordEvent ).toHaveBeenLastCalledWith(
			'jetpack_premium_analytics_feedback_submit',
			{ readiness: 'ready', comment: '' }
		);
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'still thanks the reader when the endpoint fails', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'throttled' ) );
		const user = await openModal();

		await user.click( screen.getByRole( 'radio', { name: 'Not yet' } ) );
		await user.type( screen.getByRole( 'textbox' ), 'Charts load slowly' );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		const dialog = within( screen.getByRole( 'dialog' ) );
		expect( dialog.getByText( 'Thanks, your feedback has gone to the team.' ) ).toBeInTheDocument();
		expect(
			dialog.getByText(
				"It'll help us decide what to fix before the new Traffic tab replaces the old one. You can send more any time from the same menu."
			)
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
		await user.click( await screen.findByRole( 'menuitem', { name: 'Switch off the preview' } ) );
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
			screen.queryByRole( 'menuitem', { name: 'Switch off the preview' } )
		).not.toBeInTheDocument();
	} );

	it( 'asks before switching off, and Cancel changes nothing', async () => {
		const user = await openConfirmation();

		const dialog = screen.getByRole( 'dialog', { name: 'Switch off the new Traffic tab?' } );
		expect( dialog ).toHaveTextContent(
			"You'll go back to your current Stats. You can switch the new Traffic tab on again from the banner there."
		);
		// The reason is asked for, never required: the button is live with nothing filled in.
		expect( within( dialog ).getByRole( 'radiogroup' ) ).toBeInTheDocument();
		expect(
			within( dialog ).getByRole( 'textbox', { name: 'What made you switch it off?' } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Switch it off' } ) ).toBeEnabled();
		expect( mockApiFetch ).not.toHaveBeenCalled();

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		expect( mockApiFetch ).not.toHaveBeenCalled();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
		expect( mockReturnToClassicStats ).not.toHaveBeenCalled();
	} );

	it( 'still asks how it compares, on the five points worst to best', async () => {
		await openConfirmation();

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

	it( 'writes the opt-in off, reports it, and returns the reader to classic Stats', async () => {
		const user = await openConfirmation();

		await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

		await waitFor( () => expect( mockReturnToClassicStats ).toHaveBeenCalledTimes( 1 ) );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/settings',
			method: 'POST',
			data: { jetpack_premium_analytics_enabled: false },
		} );
		// Nothing filled in: the event carries no reason, and Happiness hears nothing.
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_preview_disable',
			{}
		);
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		// Reported once the write is through, so a failed attempt is not a disable.
		expect( mockRecordEvent.mock.invocationCallOrder[ 0 ] ).toBeGreaterThan(
			mockApiFetch.mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'carries the reason on the event and hands the comment to Happiness', async () => {
		const user = await openConfirmation();

		await user.click( screen.getByRole( 'radio', { name: 'A bit worse' } ) );
		await user.type( screen.getByRole( 'textbox' ), '  Too slow on my phone  ' );
		await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

		await waitFor( () => expect( mockReturnToClassicStats ).toHaveBeenCalledTimes( 1 ) );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_preview_disable', {
			rating: 2,
			comment: 'Too slow on my phone',
		} );
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/jetpack-premium-analytics/v1/proxy/v2/jetpack-stats/user-feedback',
				method: 'POST',
				data: expect.objectContaining( {
					product_name: 'Jetpack Stats v2 (switched off)',
					feedback: 'Too slow on my phone',
					rating: 2,
				} ),
			} )
		);
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: '/wp/v2/settings' } )
		);
	} );

	it( 'still switches off when Happiness is unreachable', async () => {
		const warn = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			path.includes( 'user-feedback' )
				? Promise.reject( new Error( 'throttled' ) )
				: Promise.resolve( SETTINGS_OFF )
		);
		const user = await openConfirmation();

		await user.type( screen.getByRole( 'textbox' ), 'No comparison on the map' );
		await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

		await waitFor( () => expect( mockReturnToClassicStats ).toHaveBeenCalledTimes( 1 ) );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_preview_disable', {
			comment: 'No comparison on the map',
		} );
		expect( warn ).toHaveBeenCalledTimes( 1 );
		warn.mockRestore();
	} );

	it( 'keeps the reader here when the write fails, and counts a retry once', async () => {
		const error = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		mockApiFetch.mockRejectedValueOnce( { code: 'rest_forbidden' } );
		const user = await openConfirmation();

		await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

		const dialog = screen.getByRole( 'dialog' );
		await expect(
			within( dialog ).findByText( "We couldn't switch it off. Please try again." )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Switch it off' } ) ).toBeEnabled();
		expect( mockReturnToClassicStats ).not.toHaveBeenCalled();
		// A failed attempt is not a disable, and the code is left where a report can find it.
		expect( mockRecordEvent ).not.toHaveBeenCalled();
		expect( error ).toHaveBeenCalledWith( expect.any( String ), 'rest_forbidden' );

		await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

		await waitFor( () => expect( mockReturnToClassicStats ).toHaveBeenCalledTimes( 1 ) );
		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
		error.mockRestore();
	} );

	it( 'ignores Escape while the write is in flight', async () => {
		let finishWrite: ( echo: typeof SETTINGS_OFF ) => void = () => {};
		mockApiFetch.mockImplementationOnce(
			() =>
				new Promise( resolve => {
					finishWrite = resolve;
				} )
		);
		const user = await openConfirmation();

		await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );
		await user.keyboard( '{Escape}' );

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Switching it off…' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( mockReturnToClassicStats ).not.toHaveBeenCalled();

		finishWrite( SETTINGS_OFF );

		await waitFor( () => expect( mockReturnToClassicStats ).toHaveBeenCalledTimes( 1 ) );
	} );

	it( 'starts over after Cancel', async () => {
		const user = await openConfirmation();

		await user.click( screen.getByRole( 'radio', { name: 'A bit worse' } ) );
		await user.type( screen.getByRole( 'textbox' ), 'Too slow' );
		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'Switch off the preview' } ) );

		expect( screen.getByRole( 'radio', { name: 'A bit worse' } ) ).not.toBeChecked();
		expect( screen.getByRole( 'textbox' ) ).toHaveValue( '' );
	} );

	it( 'opens with the focus on Cancel', async () => {
		await openConfirmation();

		await waitFor( () => expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveFocus() );
	} );
} );
