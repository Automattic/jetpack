import { jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';
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
const recordEvent = jest.fn< ( event: string, props: Record< string, unknown > ) => void >();
jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent } },
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
const nonAdmin: IdentityCrisisState = {
	useNewScreen: true,
	isSafeModeConfirmed: false,
	canResolve: false,
};

describe( 'IdentityCrisis', () => {
	beforeEach( () => {
		migrateIDC.mockReset();
		startIDCFresh.mockReset();
		confirmIDCSafeMode.mockReset();
		recordEvent.mockReset();
		storeState = { state: resolvable, plugins: jetpack };
	} );

	it.each( [
		[
			false,
			[ 'This site’s old address' ],
			'Update address',
			migrateIDC,
			[],
			{ action: 'migrate' },
			'old',
		],
		[
			false,
			[ 'The original site', 'Give it its own connection' ],
			'Connect separately',
			startIDCFresh,
			[ 'admin.php?page=jetpack', 'connection_safe_mode' ],
			{ action: 'start-fresh', connectUrl: 'https://wordpress.com/connect' },
			'original>fresh',
		],
		[
			false,
			[ 'A copy of this site', 'I’m not sure' ],
			'Stay in Safe Mode',
			confirmIDCSafeMode,
			[],
			{ action: 'confirm-safe-mode' },
			'copyof>unsure',
		],
		[
			true,
			[],
			'Stay in Safe Mode',
			confirmIDCSafeMode,
			[],
			{ action: 'confirm-safe-mode' },
			'detected_copy>safe',
		],
	] )(
		'development site %s, answers %j, then %s calls the endpoint and records its path',
		async ( isDevelopmentSite, answers, button, request, args, result, path ) => {
			storeState = { state: { ...resolvable, isDevelopmentSite }, plugins: jetpack };
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
			const start = `jetpack_idc_${ result.action.replaceAll( '-', '_' ) }`;
			expect( recordEvent.mock.calls.map( ( [ event ] ) => event ) ).toEqual( [
				...answers.slice( 1 ).map( () => 'jetpack_idc_question_click' ),
				start,
				'jetpack_idc_action_success',
			] );
			expect( recordEvent ).toHaveBeenCalledWith( start, {
				path,
				is_development_site: isDevelopmentSite,
				screen_version: 2,
				placement: 'page_notice',
				context: 'notice',
			} );
		}
	);

	it( 'records Next and Back as question clicks, and not picks', async () => {
		const user = userEvent.setup();
		render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

		await user.click( screen.getByRole( 'radio', { name: 'The original site' } ) );
		await user.click( screen.getByRole( 'radio', { name: 'A copy of this site' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
		await user.click( screen.getByRole( 'radio', { name: 'Yes' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Back' } ) );

		expect( recordEvent.mock.calls ).toStrictEqual(
			[
				{ action: 'answer', question: 'main', answer: 'copyof', path: 'copyof' },
				{ action: 'back', question: 'replaced', path: 'copyof' },
			].map( props => [
				'jetpack_idc_question_click',
				{
					...props,
					is_development_site: false,
					screen_version: 2,
					placement: 'page_notice',
					context: 'notice',
				},
			] )
		);
	} );

	describe( 'view', () => {
		let notify: IntersectionObserverCallback = () => {};
		let visibility: jest.SpiedGetter< DocumentVisibilityState >;
		const observe = jest.fn();
		const originalObserver = globalThis.IntersectionObserver;
		const intersect = ( isIntersecting: boolean ) =>
			act( () =>
				notify( [ { isIntersecting } as IntersectionObserverEntry ], {} as IntersectionObserver )
			);

		beforeEach( () => {
			observe.mockClear();
			globalThis.IntersectionObserver = jest.fn( ( callback: IntersectionObserverCallback ) => {
				notify = callback;
				return { observe, disconnect: jest.fn() };
			} ) as unknown as typeof IntersectionObserver;
			visibility = jest.spyOn( document, 'visibilityState', 'get' ).mockReturnValue( 'visible' );
		} );

		// Not `jest.restoreAllMocks()`: it would also restore the console spies the shared Jest setup checks.
		afterEach( () => {
			globalThis.IntersectionObserver = originalObserver;
			visibility.mockRestore();
		} );

		it.each( [
			[
				'jetpack_idc_notice_view',
				{ ...resolvable, possibleDynamicSiteUrlDetected: true },
				{ is_development_site: false, dynamic_site_url_detected: true },
			],
			[ 'jetpack_idc_non_admin_notice_view', nonAdmin, {} ],
		] )( 'records %s once, the first time the screen is in view', ( event, state, props ) => {
			storeState = { state, plugins: jetpack };
			const { container, rerender } = render(
				<IdentityCrisis context="notice" onActionSuccess={ jest.fn() } />
			);
			// eslint-disable-next-line testing-library/no-node-access -- The observer watches a node, which no role names.
			expect( observe ).toHaveBeenCalledWith( container.firstChild );

			intersect( false );
			expect( recordEvent ).not.toHaveBeenCalled();

			intersect( true );
			const view = [
				event,
				{ ...props, screen_version: 2, placement: 'page_notice', context: 'notice' },
			];
			expect( recordEvent.mock.calls ).toStrictEqual( [ view ] );

			intersect( false );
			intersect( true );
			expect( recordEvent.mock.calls ).toStrictEqual( [ view ] );

			// A new state object re-attaches the ref.
			storeState = { state: { ...state }, plugins: jetpack };
			rerender( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );
			intersect( true );
			expect( recordEvent.mock.calls ).toStrictEqual( [ view ] );
		} );

		it( 'waits for a hidden tab to become visible', () => {
			visibility.mockReturnValue( 'hidden' );
			render( <IdentityCrisis context="notice" onActionSuccess={ jest.fn() } /> );

			intersect( true );
			expect( recordEvent ).not.toHaveBeenCalled();

			visibility.mockReturnValue( 'visible' );
			act( () => document.dispatchEvent( new Event( 'visibilitychange' ) ) );
			expect( recordEvent.mock.calls.map( ( [ event ] ) => event ) ).toEqual( [
				'jetpack_idc_notice_view',
			] );
		} );
	} );

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
			storeState = { state: nonAdmin, plugins: jetpack };
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
