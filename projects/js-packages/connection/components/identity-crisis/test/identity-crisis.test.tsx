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
		[ 'a domain over HTTPS', 'new.example/', true, [ /set dynamically/ ] ],
		[ 'an IP address', '203.0.113.5/', true, [ /set dynamically/, /is an IP address\./ ] ],
		[
			'an address without HTTPS',
			'new.example/',
			false,
			[ /set dynamically/, /loads without HTTPS\./ ],
		],
		[ 'an older PHP package', 'new.example/', undefined, [ /set dynamically/ ] ],
	] )(
		'for %s, lists what it can tell about the address',
		async ( _, currentUrl, https, facts ) => {
			const user = userEvent.setup();
			storeState = {
				state: {
					...resolvable,
					currentUrl,
					possibleDynamicSiteUrlDetected: true,
					isCurrentUrlHttps: https,
				},
				plugins: jetpack,
			};
			render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

			await user.click(
				screen.getByRole( 'radio', { name: 'Another address for this same site' } )
			);
			await user.click( screen.getByRole( 'button', { name: 'Next' } ) );

			const items = within(
				screen.getByRole( 'list', { name: 'What we already know' } )
			).getAllByRole( 'listitem' );
			expect( items ).toHaveLength( facts.length );
			facts.forEach( ( fact, index ) => expect( items[ index ] ).toHaveTextContent( fact ) );
		}
	);

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
} );
