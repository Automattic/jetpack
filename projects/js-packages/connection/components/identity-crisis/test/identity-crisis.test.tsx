import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
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

const IdentityCrisis = ( await import( '../identity-crisis' ) ).default;

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

			for ( const [ index, answer ] of answers.entries() ) {
				await user.click( screen.getByRole( 'radio', { name: answer } ) );
				if ( index < answers.length - 1 ) {
					await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
				}
			}
			await user.click( screen.getByRole( 'button', { name: button } ) );

			expect( request ).toHaveBeenCalledTimes( 1 );
			expect( request ).toHaveBeenCalledWith( ...args );
			expect( onActionSuccess ).toHaveBeenCalledWith( result );
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
