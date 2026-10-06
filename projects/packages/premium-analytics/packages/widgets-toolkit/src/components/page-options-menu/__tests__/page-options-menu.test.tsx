/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { currentUserCan, getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { resetTracksIdentityForTesting } from '../../../hooks/use-track-event';
import { readinessSummary } from '../feedback-fields';
import { FeedbackModal } from '../feedback-modal';
import { PageOptionsMenu } from '../page-options-menu';
import * as classicStats from '../return-to-classic-stats';
import { SwitchOffDialog } from '../switch-off-dialog';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const recordEvent = jest.mocked( analytics.tracks.recordEvent );

const DASHBOARD_SCOPE = 'jetpack-premium-analytics/dashboard';
const DASHBOARD_LAYOUTS_KEY = 'dashboardSectionLayouts';
const FEEDBACK_PATH = '/jetpack-premium-analytics/v1/proxy/v2/jetpack-stats/user-feedback';

const READY = "Yes, I'd be happy to switch now";
const ALMOST = 'Almost — there are a few things missing';
const THANKS = 'Thanks, your feedback has gone to the team.';

// What the settings route echoes once the opt-in is off.
const SETTINGS_OFF = { jetpack_premium_analytics_enabled: false };

const setupUser = () => userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

/**
 * Types into the comment box in one paste, which is all the trimming cares about.
 *
 * @param user - The `userEvent` session.
 * @param text - The comment.
 */
async function enterComment( user: ReturnType< typeof setupUser >, text: string ) {
	await user.click( screen.getByRole( 'textbox' ) );
	await user.paste( text );
}

/**
 * Renders the menu and picks one of its entries.
 *
 * @param entry - The menu item to pick.
 * @return The `userEvent` session, for the rest of the interaction.
 */
async function pickFromMenu( entry: string ) {
	const user = setupUser();
	render( <PageOptionsMenu /> );
	await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
	await user.click( await screen.findByRole( 'menuitem', { name: entry } ) );
	return user;
}

describe( 'page-options-menu', () => {
	let returnToClassicStats: jest.SpiedFunction< typeof classicStats.returnToClassicStats >;

	beforeEach( () => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		resetTracksIdentityForTesting();
		dispatch( preferencesStore ).set( DASHBOARD_SCOPE, DASHBOARD_LAYOUTS_KEY, {} );
		jest.mocked( getScriptData ).mockReturnValue( {} as ReturnType< typeof getScriptData > );
		jest.mocked( isSimpleSite ).mockReturnValue( false );
		jest.mocked( currentUserCan ).mockReturnValue( true );
		jest
			.mocked( apiFetch )
			.mockImplementation( ( { path } ) =>
				Promise.resolve( path === '/wp/v2/settings' ? SETTINGS_OFF : 'success' )
			);
		returnToClassicStats = jest
			.spyOn( classicStats, 'returnToClassicStats' )
			.mockImplementation( () => {} );
	} );

	afterEach( () => {
		returnToClassicStats.mockRestore();
		jest.useRealTimers();
	} );

	describe( 'PageOptionsMenu', () => {
		it( 'offers switching off only to those who can change site settings', async () => {
			jest.mocked( currentUserCan ).mockReturnValue( false );
			const user = setupUser();
			render( <PageOptionsMenu /> );

			await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );

			await expect(
				screen.findByRole( 'menuitem', { name: 'Any feedback?' } )
			).resolves.toBeInTheDocument();
			expect( currentUserCan ).toHaveBeenCalledWith( 'manage_options' );
			expect(
				screen.queryByRole( 'menuitem', { name: 'Switch off the preview' } )
			).not.toBeInTheDocument();
		} );

		it( 'puts Customize first where the page has a layout to arrange', async () => {
			const user = setupUser();
			const onCustomize = jest.fn();
			render( <PageOptionsMenu onCustomize={ onCustomize } /> );

			await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
			const items = await screen.findAllByRole( 'menuitem' );

			expect( items.map( item => item.textContent ) ).toEqual( [
				'Customize',
				'Any feedback?',
				'Switch off the preview',
			] );
			// The layout action sits apart from the rest.
			expect( screen.getByRole( 'separator' ) ).toBeInTheDocument();

			await user.click( items[ 0 ] );

			expect( onCustomize ).toHaveBeenCalledTimes( 1 );
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );

		it( 'leaves Customize out where there is nothing to arrange', async () => {
			const user = setupUser();
			render( <PageOptionsMenu /> );

			await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );

			await expect(
				screen.findByRole( 'menuitem', { name: 'Any feedback?' } )
			).resolves.toBeInTheDocument();
			expect( screen.queryByRole( 'menuitem', { name: 'Customize' } ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'separator' ) ).not.toBeInTheDocument();
		} );

		it( 'opens the feedback modal, reporting the opening and the answer as from the menu', async () => {
			const user = await pickFromMenu( 'Any feedback?' );

			expect( screen.getByRole( 'dialog' ) ).toBeVisible();
			expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_feedback_open', {
				source: 'menu',
			} );

			await user.click( screen.getByRole( 'radio', { name: READY } ) );
			await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

			expect( recordEvent ).toHaveBeenLastCalledWith(
				'jetpack_premium_analytics_feedback_submit',
				expect.objectContaining( { source: 'menu' } )
			);
		} );

		it( 'opens the switch-off confirmation on Cancel, reporting nothing', async () => {
			await pickFromMenu( 'Switch off the preview' );

			expect( screen.getByRole( 'dialog', { name: 'Switch off the new Stats?' } ) ).toBeVisible();
			await waitFor( () =>
				expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveFocus()
			);
			expect( recordEvent ).not.toHaveBeenCalled();
		} );

		it( 'starts the switch-off confirmation over after Cancel', async () => {
			const user = await pickFromMenu( 'Switch off the preview' );

			await user.click( screen.getByRole( 'radio', { name: 'Not yet' } ) );
			await enterComment( user, 'Too slow' );
			await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
			await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );

			await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
			await user.click( await screen.findByRole( 'menuitem', { name: 'Switch off the preview' } ) );

			expect( screen.getByRole( 'radio', { name: 'Not yet' } ) ).not.toBeChecked();
			expect( screen.getByRole( 'textbox' ) ).toHaveValue( '' );
		} );
	} );

	describe( 'FeedbackModal', () => {
		/**
		 * Renders the modal as the menu opens it.
		 *
		 * @param props          - Optional callbacks.
		 * @param props.onClose  - Called once the reader dismisses the modal.
		 * @param props.onSubmit - Called once the answer is on its way.
		 * @return The `userEvent` session, for the rest of the interaction.
		 */
		function showModal( {
			onClose = jest.fn(),
			onSubmit,
		}: { onClose?: () => void; onSubmit?: () => void } = {} ) {
			const user = setupUser();
			render( <FeedbackModal source="menu" onClose={ onClose } onSubmit={ onSubmit } /> );
			return user;
		}

		it( 'reports the readiness answer and comment as one event', async () => {
			const user = showModal();

			await user.click( screen.getByRole( 'radio', { name: ALMOST } ) );
			await enterComment( user, '  Needs a date picker  ' );
			await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

			expect( recordEvent ).toHaveBeenLastCalledWith( 'jetpack_premium_analytics_feedback_submit', {
				readiness: 'almost',
				comment: 'Needs a date picker',
				source: 'menu',
				has_customized: false,
			} );
		} );

		it( 'holds the submission until an answer is picked', async () => {
			const user = showModal();
			const submit = screen.getByRole( 'button', { name: 'Send feedback' } );

			expect( submit ).toHaveAttribute( 'aria-disabled', 'true' );

			await user.click( submit );

			expect( recordEvent ).not.toHaveBeenCalled();

			await user.click( screen.getByRole( 'radio', { name: 'Not yet' } ) );
			await user.click( submit );

			expect( recordEvent ).toHaveBeenLastCalledWith( 'jetpack_premium_analytics_feedback_submit', {
				readiness: 'not_yet',
				comment: '',
				source: 'menu',
				has_customized: false,
			} );
		} );

		it( 'confirms the send rather than just closing', async () => {
			const onClose = jest.fn();
			const user = showModal( { onClose } );

			await user.click( screen.getByRole( 'radio', { name: 'Not yet' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

			// Scoped to the dialog: `Notice` also mirrors the text into the a11y-speak live
			// region on `body`, so an unscoped query matches twice.
			const dialog = within( screen.getByRole( 'dialog' ) );
			expect( dialog.getByText( THANKS ) ).toBeInTheDocument();
			expect(
				dialog.getByText(
					"It'll help us decide what to fix before the new Stats replaces the old one. You can send more any time from the page options menu."
				)
			).toBeInTheDocument();
			expect( screen.queryByRole( 'radiogroup' ) ).not.toBeInTheDocument();
			expect( onClose ).not.toHaveBeenCalled();

			await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

			expect( onClose ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'sends nothing when the reader backs out', async () => {
			const onClose = jest.fn();
			const user = showModal( { onClose } );

			await user.click( screen.getByRole( 'radio', { name: READY } ) );
			await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

			expect( recordEvent ).not.toHaveBeenCalled();
			expect( onClose ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'calls back once the answer is sent, not when the reader backs out', async () => {
			const onSubmit = jest.fn();
			const user = showModal( { onSubmit } );

			await user.click( screen.getByRole( 'radio', { name: READY } ) );
			await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
			expect( onSubmit ).not.toHaveBeenCalled();

			await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );
			expect( onSubmit ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'caps the comment at the length Tracks will carry', () => {
			showModal();

			expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'maxlength', '1000' );
		} );

		it( 'names the readiness question after the question it answers', () => {
			showModal();

			expect( screen.getByRole( 'radiogroup' ) ).toHaveAccessibleName(
				'Is the new Stats ready to replace the old one?'
			);
		} );

		it( 'offers the three answers, readiest first', () => {
			showModal();

			const answers = screen.getAllByRole< HTMLInputElement >( 'radio' );

			expect( answers.map( answer => answer.labels?.[ 0 ]?.textContent ) ).toEqual( [
				READY,
				ALMOST,
				'Not yet',
			] );
			expect( answers.map( answer => answer.value ) ).toEqual( [ 'ready', 'almost', 'not_yet' ] );
		} );

		it( 'asks for anything else instead once the answer is that nothing is missing', async () => {
			const user = showModal();

			expect( screen.getByRole( 'textbox', { name: "What's missing?" } ) ).toBeInTheDocument();

			await user.click( screen.getByRole( 'radio', { name: READY } ) );

			expect(
				screen.getByRole( 'textbox', { name: "Any other feedback you'd like to share?" } )
			).toBeInTheDocument();
		} );

		it( 'sends the answer to Happiness as message text, and no rating', async () => {
			const user = showModal();

			await user.click( screen.getByRole( 'radio', { name: 'Not yet' } ) );
			await enterComment( user, '  Missing the date picker  ' );
			await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: FEEDBACK_PATH,
					data: {
						source_url: window.location.href,
						product_name: 'Jetpack Stats v2',
						feedback: '[Ready to replace the old Stats? Not yet] Missing the date picker',
					},
				} )
			);
		} );

		it( 'keeps a bare answer out of the support queue', async () => {
			const user = showModal();

			await user.click( screen.getByRole( 'radio', { name: READY } ) );
			await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

			expect( recordEvent ).toHaveBeenLastCalledWith( 'jetpack_premium_analytics_feedback_submit', {
				readiness: 'ready',
				comment: '',
				source: 'menu',
				has_customized: false,
			} );
			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		it( 'says whether the reader has a customized dashboard layout', async () => {
			dispatch( preferencesStore ).set( DASHBOARD_SCOPE, DASHBOARD_LAYOUTS_KEY, {
				traffic: [ { uuid: 'card', type: 'jpa/card' } ],
			} );
			const user = showModal();

			await user.click( screen.getByRole( 'radio', { name: READY } ) );
			await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

			expect( recordEvent ).toHaveBeenLastCalledWith(
				'jetpack_premium_analytics_feedback_submit',
				expect.objectContaining( { has_customized: true } )
			);
		} );

		it( 'still thanks the reader, and leaves no rejection unhandled, when the endpoint fails', async () => {
			// The package's own `process` type declares only `env`.
			type Listen = ( event: 'unhandledRejection', listener: () => void ) => void;
			const nodeProcess = process as unknown as { on: Listen; off: Listen };
			const unhandled = jest.fn();
			nodeProcess.on( 'unhandledRejection', unhandled );
			jest.mocked( apiFetch ).mockRejectedValue( new Error( 'throttled' ) );
			const user = showModal();

			try {
				await user.click( screen.getByRole( 'radio', { name: 'Not yet' } ) );
				await enterComment( user, 'Charts load slowly' );
				await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

				expect( within( screen.getByRole( 'dialog' ) ).getByText( THANKS ) ).toBeInTheDocument();
				// Node reports an unhandled rejection only once the current macrotask is over.
				await new Promise( resolve => jest.requireActual( 'timers' ).setImmediate( resolve ) );
				expect( unhandled ).not.toHaveBeenCalled();
			} finally {
				nodeProcess.off( 'unhandledRejection', unhandled );
			}
		} );
	} );

	describe( 'readinessSummary', () => {
		// The endpoint has no readiness field, so the answer has to survive as message text.
		it.each( [
			[ 'ready', '[Ready to replace the old Stats? Yes, ready to switch now]' ],
			[ 'almost', '[Ready to replace the old Stats? Almost, a few things missing]' ],
			[ 'not_yet', '[Ready to replace the old Stats? Not yet]' ],
		] as const )( 'words "%s" for the Happiness ticket', ( readiness, summary ) => {
			expect( readinessSummary( readiness ) ).toBe( summary );
		} );
	} );

	describe( 'SwitchOffDialog', () => {
		/**
		 * Renders the confirmation as the menu opens it.
		 *
		 * @param onClose - Called once the reader dismisses the dialog.
		 * @return The `userEvent` session, for the rest of the interaction.
		 */
		function showDialog( onClose: () => void = jest.fn() ) {
			const user = setupUser();
			render( <SwitchOffDialog onClose={ onClose } /> );
			return user;
		}

		it( 'asks before switching off, and Cancel changes nothing', async () => {
			const onClose = jest.fn();
			const user = showDialog( onClose );

			const dialog = screen.getByRole( 'dialog', { name: 'Switch off the new Stats?' } );
			expect( dialog ).toHaveTextContent(
				"You'll go back to your current Stats. You can switch the new Stats on again from the Modules Visibility setting."
			);
			// The reason is asked for, never required: the button is live with nothing filled in.
			expect( within( dialog ).getByRole( 'radiogroup' ) ).toHaveAccessibleName(
				'Before you go — is the new Stats ready to replace the old one?'
			);
			expect(
				within( dialog ).getByRole( 'textbox', { name: "What's missing?" } )
			).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Switch it off' } ) ).toBeEnabled();

			await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

			expect( onClose ).toHaveBeenCalledTimes( 1 );
			expect( apiFetch ).not.toHaveBeenCalled();
			expect( recordEvent ).not.toHaveBeenCalled();
			expect( returnToClassicStats ).not.toHaveBeenCalled();
		} );

		it( 'writes the opt-in off, reports it, and returns the reader to classic Stats', async () => {
			const user = showDialog();

			await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

			await waitFor( () => expect( returnToClassicStats ).toHaveBeenCalledTimes( 1 ) );
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/settings',
				method: 'POST',
				data: { jetpack_premium_analytics_enabled: false },
			} );
			// Nothing filled in: the event carries no reason, and Happiness hears nothing.
			expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_preview_disable', {} );
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );
			// Reported once the write is through, so a failed attempt is not a disable.
			expect( recordEvent.mock.invocationCallOrder[ 0 ] ).toBeGreaterThan(
				jest.mocked( apiFetch ).mock.invocationCallOrder[ 0 ]
			);
		} );

		it( 'carries the reason on the event and hands the comment to Happiness', async () => {
			const user = showDialog();

			await user.click( screen.getByRole( 'radio', { name: ALMOST } ) );
			await enterComment( user, '  Too slow on my phone  ' );
			await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

			await waitFor( () => expect( returnToClassicStats ).toHaveBeenCalledTimes( 1 ) );
			expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_preview_disable', {
				readiness: 'almost',
				comment: 'Too slow on my phone',
			} );
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: FEEDBACK_PATH,
					data: {
						source_url: window.location.href,
						product_name: 'Jetpack Stats v2 (switched off)',
						feedback:
							'[Ready to replace the old Stats? Almost, a few things missing] Too slow on my phone',
					},
				} )
			);
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: '/wp/v2/settings' } )
			);
		} );

		it( 'still switches off when Happiness is unreachable', async () => {
			const warn = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
			jest
				.mocked( apiFetch )
				.mockImplementation( ( { path }: { path: string } ) =>
					path.includes( 'user-feedback' )
						? Promise.reject( new Error( 'throttled' ) )
						: Promise.resolve( SETTINGS_OFF )
				);
			const user = showDialog();

			await enterComment( user, 'No comparison on the map' );
			await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

			await waitFor( () => expect( returnToClassicStats ).toHaveBeenCalledTimes( 1 ) );
			expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_preview_disable', {
				comment: 'No comparison on the map',
			} );
			// No answer picked, so the comment goes to Happiness without a readiness prefix.
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					data: expect.objectContaining( { feedback: 'No comparison on the map' } ),
				} )
			);
			expect( warn ).toHaveBeenCalledTimes( 1 );
			warn.mockRestore();
		} );

		it( 'keeps the reader here when the write fails, and counts a retry once', async () => {
			const error = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
			jest.mocked( apiFetch ).mockRejectedValueOnce( { code: 'rest_forbidden' } );
			const user = showDialog();

			await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

			const dialog = screen.getByRole( 'dialog' );
			await expect(
				within( dialog ).findByText( "We couldn't switch it off. Please try again." )
			).resolves.toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Switch it off' } ) ).toBeEnabled();
			expect( returnToClassicStats ).not.toHaveBeenCalled();
			// A failed attempt is not a disable, and the code is left where a report can find it.
			expect( recordEvent ).not.toHaveBeenCalled();
			expect( error ).toHaveBeenCalledWith( expect.any( String ), 'rest_forbidden' );

			await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );

			await waitFor( () => expect( returnToClassicStats ).toHaveBeenCalledTimes( 1 ) );
			expect( recordEvent ).toHaveBeenCalledTimes( 1 );
			error.mockRestore();
		} );

		it( 'ignores Escape while the write is in flight', async () => {
			let finishWrite: ( echo: typeof SETTINGS_OFF ) => void = () => {};
			jest.mocked( apiFetch ).mockImplementationOnce(
				() =>
					new Promise( resolve => {
						finishWrite = resolve;
					} )
			);
			const onClose = jest.fn();
			const user = showDialog( onClose );

			await user.click( screen.getByRole( 'button', { name: 'Switch it off' } ) );
			await user.keyboard( '{Escape}' );

			expect( onClose ).not.toHaveBeenCalled();
			expect( screen.getByRole( 'button', { name: 'Switching it off…' } ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
			expect( returnToClassicStats ).not.toHaveBeenCalled();

			finishWrite( SETTINGS_OFF );

			await waitFor( () => expect( returnToClassicStats ).toHaveBeenCalledTimes( 1 ) );
		} );
	} );
} );
