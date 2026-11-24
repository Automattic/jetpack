import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ConnectedPlugin } from '../../../helpers/site-words';
import type { IdentityCrisisState } from '../../../types';

const migrateIDC = jest.fn< () => Promise< unknown > >();
const startIDCFresh = jest.fn< ( redirectUri?: string, from?: string ) => Promise< unknown > >();
const confirmIDCSafeMode = jest.fn< () => Promise< unknown > >();
jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { migrateIDC, startIDCFresh, confirmIDCSafeMode },
} ) );

let storeState: { state: IdentityCrisisState | null; plugins: ConnectedPlugin[] };
jest.unstable_mockModule( '../use-identity-crisis-state', () => ( {
	__esModule: true,
	default: () => storeState,
} ) );

const goTo = jest.fn();
const reloadPage = jest.fn();
jest.unstable_mockModule( '../navigate', () => ( { __esModule: true, goTo, reloadPage } ) );

const IdentityCrisis = ( await import( '../identity-crisis' ) ).default;

/**
 * An error shaped like the client's `ApiError`.
 *
 * @param code   - The REST error code.
 * @param status - The HTTP status.
 * @param data   - More of the error's `data`.
 * @return The error.
 */
function apiError( code: string, status: number, data: Record< string, unknown > = {} ): Error {
	return Object.assign( new Error(), {
		name: 'ApiError',
		response: { code, data: { status, ...data } },
	} );
}

/**
 * Pick each answer in turn, then the action button.
 *
 * @param {ReturnType<typeof userEvent.setup>} user    - The user-event instance.
 * @param {string[]}                           answers - The answers, one per step.
 * @param {string}                             button  - The action button.
 */
async function answer(
	user: ReturnType< typeof userEvent.setup >,
	answers: string[],
	button: string
) {
	for ( const [ index, label ] of answers.entries() ) {
		await user.click( screen.getByRole( 'radio', { name: label } ) );
		if ( index < answers.length - 1 ) {
			await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
		}
	}
	await user.click( screen.getByRole( 'button', { name: button } ) );
}

const resolvable: IdentityCrisisState = {
	useNewScreen: true,
	isSafeModeConfirmed: false,
	canResolve: true,
	wpcomHomeUrl: 'old.example/',
	currentUrl: 'new.example/',
	isDevelopmentSite: false,
	possibleDynamicSiteUrlDetected: false,
	logoUrl: 'https://example.com/logo.svg',
};
const jetpack = [ { slug: 'jetpack', name: 'Jetpack' } ];

describe( 'IdentityCrisis', () => {
	beforeEach( () => {
		migrateIDC.mockReset();
		startIDCFresh.mockReset();
		confirmIDCSafeMode.mockReset();
		goTo.mockReset();
		reloadPage.mockReset();
		storeState = { state: resolvable, plugins: jetpack };
	} );

	it.each( [
		[ [ 'This site’s old address' ], 'Update address', migrateIDC, [], { action: 'migrate' } ],
		[
			[ 'The original site', 'Give it its own connection' ],
			'Connect separately',
			startIDCFresh,
			[ 'admin.php?page=jetpack', 'connection_safe_mode' ],
			{ action: 'start-fresh', connectUrl: 'https://wordpress.com/connect' },
		],
		[
			[ 'A copy of this site', 'I’m not sure' ],
			'Stay in Safe Mode',
			confirmIDCSafeMode,
			[],
			{ action: 'confirm-safe-mode' },
		],
	] )(
		'answers %j, then %s calls the endpoint',
		async ( answers, button, request, args, result ) => {
			const user = userEvent.setup();
			request.mockResolvedValue( 'https://wordpress.com/connect' );
			const onActionSuccess = jest.fn();
			render(
				<IdentityCrisis
					context="notice"
					redirectUri="admin.php?page=jetpack"
					from="connection_safe_mode"
					onActionSuccess={ onActionSuccess }
				/>
			);

			await answer( user, answers, button );

			expect( request ).toHaveBeenCalledTimes( 1 );
			expect( request ).toHaveBeenCalledWith( ...args );
			expect( onActionSuccess ).toHaveBeenCalledWith( result );
			expect( goTo ).not.toHaveBeenCalled();
			expect( reloadPage ).not.toHaveBeenCalled();
		}
	);

	it.each( [
		[
			'a fresh connection goes to the connect URL',
			[ 'The original site', 'Give it its own connection' ],
			'Connect separately',
			null,
			[ [ 'https://wordpress.com/connect' ] ],
			0,
		],
		[
			'staying in Safe Mode reloads',
			[ 'A copy of this site', 'I’m not sure' ],
			'Stay in Safe Mode',
			null,
			[],
			1,
		],
		[
			'updating the address waits for its done view',
			[ 'This site’s old address' ],
			'Update address',
			null,
			[],
			0,
		],
		[
			'the done view reloads',
			[ 'This site’s old address' ],
			'Update address',
			'Got it, thanks',
			[],
			1,
		],
	] )(
		'without host handlers, %s',
		async ( _, answers, button, doneButton, goToCalls, reloads ) => {
			const user = userEvent.setup();
			[ migrateIDC, startIDCFresh, confirmIDCSafeMode ].forEach( request =>
				request.mockResolvedValue( 'https://wordpress.com/connect' )
			);
			render( <IdentityCrisis context="notice" /> );

			await answer( user, answers, button );
			if ( doneButton ) {
				await user.click( screen.getByRole( 'button', { name: doneButton } ) );
			}

			expect( goTo.mock.calls ).toEqual( goToCalls );
			expect( reloadPage ).toHaveBeenCalledTimes( reloads );
		}
	);

	it( 'shows the consequence of the selected answer only', async () => {
		const user = userEvent.setup();
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		await user.click( screen.getByRole( 'radio', { name: 'This site’s old address' } ) );

		expect(
			screen.getByText( /This updates the address WordPress\.com has on file\./ )
		).toBeInTheDocument();
		expect(
			screen.queryByText( /keeps its connection, history, and data/ )
		).not.toBeInTheDocument();
	} );

	it( 'offers Try again after a failure, and Back clears it', async () => {
		const user = userEvent.setup();
		startIDCFresh.mockRejectedValue( Object.assign( new Error(), { name: 'FetchNetworkError' } ) );
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		await user.click( screen.getByRole( 'radio', { name: 'The original site' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
		await user.click( screen.getByRole( 'radio', { name: 'Give it its own connection' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Connect separately' } ) );

		expect( screen.getByRole( 'alert' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Try again' } ) ).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Back' } ) );

		expect(
			screen.getByText( ( _, element ) => element?.textContent === 'What is old.example?' )
		).toHaveFocus();
		expect( screen.getByRole( 'radio', { name: 'The original site' } ) ).toBeChecked();
		expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
	} );

	it( 'after a failure that left the site disconnected, offers only Try again, even once it fails otherwise', async () => {
		const user = userEvent.setup();
		startIDCFresh
			.mockRejectedValueOnce( apiError( 'cannot_save_secrets', 500, { disconnected: true } ) )
			.mockRejectedValueOnce( Object.assign( new Error(), { name: 'FetchNetworkError' } ) );
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		await answer(
			user,
			[ 'The original site', 'Give it its own connection' ],
			'Connect separately'
		);
		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( /now disconnected/ );
		expect( screen.getByRole( 'button', { name: 'Try again' } ) ).toHaveFocus();
		expect(
			screen.getByRole( 'heading', { name: 'Jetpack Connection is disconnected' } )
		).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( /couldn’t complete the request/ );
		expect( screen.getByRole( 'button', { name: 'Try again' } ) ).toBeEnabled();
		expect( screen.queryByRole( 'button', { name: 'Back' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
	} );

	it( 'opens on Try again when the store says a failed fresh connection disconnected the site', async () => {
		const user = userEvent.setup();
		storeState = { state: { ...resolvable, isDisconnected: true }, plugins: jetpack };
		startIDCFresh.mockResolvedValue( 'https://wordpress.com/connect' );
		const onActionSuccess = jest.fn();
		render(
			<IdentityCrisis
				context="connectors"
				showHeader={ false }
				hostActions={ <button>Disconnect site</button> }
				onActionSuccess={ onActionSuccess }
			/>
		);

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( /now disconnected/ );
		expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'region', { name: 'Jetpack Connection is disconnected' } )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Disconnect site' } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect( onActionSuccess ).toHaveBeenCalledWith( {
			action: 'start-fresh',
			connectUrl: 'https://wordpress.com/connect',
		} );
	} );

	it.each( [
		[ 'the questions', [] ],
		[ 'the disconnected view', [ apiError( 'cannot_save_secrets', 500, { disconnected: true } ) ] ],
	] )(
		'when a fresh connection from %s is refused because the site left Safe Mode, offers only Reload',
		async ( _from, earlierErrors ) => {
			const user = userEvent.setup();
			for ( const earlier of earlierErrors ) {
				startIDCFresh.mockRejectedValueOnce( earlier );
			}
			startIDCFresh.mockRejectedValueOnce( apiError( 'start_fresh_not_in_safe_mode', 409 ) );
			render(
				<IdentityCrisis
					context="notice"
					hostActions={ <button>Disconnect site</button> }
					onActionSuccess={ jest.fn() }
				/>
			);

			await answer(
				user,
				[ 'The original site', 'Give it its own connection' ],
				'Connect separately'
			);
			if ( earlierErrors.length ) {
				await user.click( screen.getByRole( 'button', { name: 'Try again' } ) );
			}

			expect( screen.getByRole( 'alert' ) ).toHaveTextContent( /no longer in Safe Mode/ );
			expect(
				screen.getByRole( 'heading', { name: 'Jetpack Connection is no longer in Safe Mode' } )
			).toBeInTheDocument();
			expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Back' } ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Disconnect site' } ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Reload' } ) ).toHaveFocus();

			await user.click( screen.getByRole( 'button', { name: 'Reload' } ) );

			expect( reloadPage ).toHaveBeenCalled();
			expect( startIDCFresh ).toHaveBeenCalledTimes( earlierErrors.length + 1 );
		}
	);

	it( 'opens on Reload when the store says the site left Safe Mode, even if it also says disconnected', () => {
		storeState = {
			state: { ...resolvable, isDisconnected: true, isResolved: true },
			plugins: jetpack,
		};
		render(
			<IdentityCrisis context="connectors" showHeader={ false } onActionSuccess={ jest.fn() } />
		);

		expect(
			screen.getByRole( 'region', { name: 'Jetpack Connection is no longer in Safe Mode' } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Reload' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Try again' } ) ).not.toBeInTheDocument();
	} );

	it( 'never offers "same" without a detected dynamic address', () => {
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		expect(
			screen.queryByRole( 'radio', { name: 'Another address for this same site' } )
		).not.toBeInTheDocument();
	} );

	it( '"same" explains the two addresses, stays in Safe Mode, and Back returns to the question', async () => {
		const user = userEvent.setup();
		storeState = {
			state: { ...resolvable, possibleDynamicSiteUrlDetected: true },
			plugins: jetpack,
		};
		confirmIDCSafeMode.mockResolvedValue( {} );
		const onActionSuccess = jest.fn();
		render( <IdentityCrisis context="notice" onActionSuccess={ onActionSuccess } /> );

		await user.click( screen.getByRole( 'radio', { name: 'Another address for this same site' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Next' } ) );

		expect(
			screen.getByRole( 'heading', { name: 'This is one site with two addresses' } )
		).toHaveFocus();
		expect(
			screen.getByRole( 'link', { name: /How to set a fixed address/ } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: /Learn more about Safe Mode/ } )
		).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Back' } ) );
		expect(
			screen.getByRole( 'radio', { name: 'Another address for this same site' } )
		).toBeChecked();

		await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Stay in Safe Mode for now' } ) );

		expect( confirmIDCSafeMode ).toHaveBeenCalledTimes( 1 );
		expect( onActionSuccess ).toHaveBeenCalledWith( { action: 'confirm-safe-mode' } );
	} );

	it.each( [
		[ 'a domain', 'new.example/', [ /set dynamically/ ] ],
		[ 'an IP address', '203.0.113.5/', [ /set dynamically/, /is an IP address\./ ] ],
	] )( 'for %s, lists what it can tell about the address', async ( _, currentUrl, facts ) => {
		const user = userEvent.setup();
		storeState = {
			state: {
				...resolvable,
				currentUrl,
				possibleDynamicSiteUrlDetected: true,
			},
			plugins: jetpack,
		};
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		await user.click( screen.getByRole( 'radio', { name: 'Another address for this same site' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Next' } ) );

		const items = within(
			screen.getByRole( 'list', { name: 'What we already know' } )
		).getAllByRole( 'listitem' );
		expect( items ).toHaveLength( facts.length );
		facts.forEach( ( fact, index ) => expect( items[ index ] ).toHaveTextContent( fact ) );
	} );

	it.each( [ true, false ] )(
		'tells a viewer who cannot resolve Safe Mode, with Dismiss %s',
		withDismiss => {
			storeState = {
				state: { useNewScreen: true, isSafeModeConfirmed: false, canResolve: false },
				plugins: jetpack,
			};
			render(
				<IdentityCrisis
					context="notice"
					onActionSuccess={ jest.fn() }
					onDismiss={ withDismiss ? jest.fn() : undefined }
				/>
			);

			expect( screen.getByText( /An administrator needs to resolve this\./ ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Dismiss' } ) !== null ).toBe( withDismiss );
		}
	);

	it( 'once Safe Mode is confirmed, says so and still offers every answer', () => {
		storeState = { state: { ...resolvable, isSafeModeConfirmed: true }, plugins: jetpack };
		render(
			<IdentityCrisis context="connectors" showHeader={ false } onActionSuccess={ jest.fn() } />
		);

		expect( screen.getByText( /You chose to stay in Safe Mode\./ ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'radio' ) ).toHaveLength( 3 );
	} );

	it.each( [
		[ 'jetpack', /This site is registered/, /— like Stats and Backups —/, false ],
		[ 'woocommerce-payments', /This store is registered/, /WordPress\.com are paused/, true ],
	] )( 'with %s connected, words the intro to match', ( slug, address, paused, payments ) => {
		storeState = { state: resolvable, plugins: [ { slug, name: slug } ] };
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		expect( screen.getByText( address ) ).toBeInTheDocument();
		expect( screen.getByText( paused ) ).toBeInTheDocument();
		expect( screen.queryByText( /Payments will not be interrupted\./ ) !== null ).toBe( payments );
		expect( screen.queryByText( /like Stats and Backups/ ) !== null ).toBe( ! payments );
	} );

	it( 'walks the guide to a statement, then confirms it before the action runs', async () => {
		const user = userEvent.setup();
		confirmIDCSafeMode.mockResolvedValue( {} );
		const onActionSuccess = jest.fn();
		render( <IdentityCrisis context="notice" onActionSuccess={ onActionSuccess } /> );

		await user.click( screen.getByRole( 'button', { name: 'Work it out step by step' } ) );

		expect( screen.getByRole( 'heading', { name: /What happens\?/ } ) ).toHaveFocus();
		expect( screen.getByRole( 'link', { name: /Open old\.example/ } ) ).toHaveAttribute(
			'href',
			'http://old.example/'
		);

		await user.click( screen.getByRole( 'button', { name: 'A site loads there' } ) );
		await user.click( screen.getByRole( 'button', { name: 'A separate site' } ) );
		await user.click( screen.getByRole( 'button', { name: 'old.example' } ) );

		expect(
			screen.getByRole( 'heading', {
				name: 'old.example is the original site, and this one is a copy',
			} )
		).toHaveFocus();
		expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
		await user.click( screen.getByRole( 'radio', { name: 'Keep it in Safe Mode' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Stay in Safe Mode' } ) );

		expect( confirmIDCSafeMode ).toHaveBeenCalledTimes( 1 );
		expect( onActionSuccess ).toHaveBeenCalledWith( { action: 'confirm-safe-mode' } );
	} );

	it( 'opens the guide from the staging note, and Back returns to the first screen', async () => {
		const user = userEvent.setup();
		storeState = { state: { ...resolvable, isDevelopmentSite: true }, plugins: jetpack };
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		expect(
			screen.queryByRole( 'button', { name: 'Work it out step by step' } )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', { name: 'Not a copy? Work it out step by step' } )
		);

		expect(
			within( screen.getByRole( 'list', { name: 'What we already know' } ) ).getAllByRole(
				'listitem'
			)[ 0 ]
		).toHaveTextContent( 'WordPress marks this as a staging site.' );

		await user.click( screen.getByRole( 'button', { name: 'Back to the first screen' } ) );

		expect( screen.getByRole( 'radio', { name: 'Keep it in Safe Mode' } ) ).toBeChecked();
	} );

	it( 'gives an admin who cannot check a message to send, and copies it', async () => {
		const user = userEvent.setup();
		const writeText = jest.spyOn( navigator.clipboard, 'writeText' ).mockResolvedValue();
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Work it out step by step' } ) );
		await user.click( screen.getByRole( 'button', { name: 'A site loads there' } ) );
		await user.click( screen.getByRole( 'button', { name: 'I’m not sure' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Copy message' } ) );

		expect( writeText ).toHaveBeenCalledWith(
			expect.stringMatching( /^My site new\.example shows .+ registered at old\.example\./ )
		);
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Copied' );
		expect( screen.getByRole( 'link', { name: /Contact support/ } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'jetpack-contact-support' )
		);
	} );

	it( 'goes back to an earlier guide question from the answers so far', async () => {
		const user = userEvent.setup();
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Work it out step by step' } ) );
		expect( screen.queryByRole( 'navigation', { name: 'Your answers:' } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'A site loads there' } ) );
		await user.click( screen.getByRole( 'button', { name: 'A separate site' } ) );
		await user.click(
			within( screen.getByRole( 'navigation', { name: 'Your answers:' } ) ).getByRole( 'button', {
				name: 'Change answer: A site loads there',
			} )
		);

		expect( screen.getByRole( 'heading', { name: /What happens\?/ } ) ).toHaveFocus();
		expect( screen.queryByRole( 'navigation', { name: 'Your answers:' } ) ).not.toBeInTheDocument();
	} );

	it( 'stays in Safe Mode from any guide question', async () => {
		const user = userEvent.setup();
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Work it out step by step' } ) );
		await user.click( screen.getByRole( 'button', { name: 'A site loads there' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Stay in Safe Mode for now' } ) );

		expect( screen.getByRole( 'heading', { name: 'Stay in Safe Mode for now' } ) ).toHaveFocus();
	} );

	it.each( [
		[ 'jetpack', /the latest post or page/ ],
		[ 'woocommerce-payments', /today’s orders or the newest product/ ],
	] )( 'with %s connected, tells the admin what to compare', async ( slug, compare ) => {
		const user = userEvent.setup();
		storeState = { state: resolvable, plugins: [ { slug, name: slug } ] };
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Work it out step by step' } ) );
		await user.click( screen.getByRole( 'button', { name: /loads there/ } ) );

		expect( screen.getByText( compare ) ).toBeInTheDocument();
	} );
} );
