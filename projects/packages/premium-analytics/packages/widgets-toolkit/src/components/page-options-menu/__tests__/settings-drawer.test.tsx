/**
 * External dependencies
 */
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { store as coreStore } from '@wordpress/core-data';
import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { SettingsDrawer } from '../settings-drawer';

const mockApiFetch = jest.fn();
const mockCreateSuccessNotice = jest.fn();

// Stands in for the page's `core/notices` store, which this package does not depend on.
const noticesStore = createReduxStore( 'core/notices', {
	reducer: ( state = {} ) => state,
	actions: {
		createSuccessNotice: ( ...args: unknown[] ) => {
			mockCreateSuccessNotice( ...args );
			return { type: 'CREATE_SUCCESS_NOTICE' };
		},
	},
} );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		setUser: jest.fn(),
		identifyUser: jest.fn(),
		assignSuperProps: jest.fn(),
		tracks: { recordEvent: jest.fn() },
	},
} ) );

const ROLES = [
	{ slug: 'administrator', name: 'Administrator' },
	{ slug: 'editor', name: 'Editor' },
	{ slug: 'author', name: 'Author' },
];
const mockStatsSettingsContext = jest.fn();
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( { premium_analytics: { stats_settings: mockStatsSettingsContext() } } ),
	isSimpleSite: () => false,
} ) );

const STATS_OPTIONS = { admin_bar: true, roles: [ 'administrator' ], count_roles: [] };

/**
 * Answer core's site settings route with the given Stats options.
 *
 * @param statsOptions - The stored `stats_options` fields.
 * @param onPost       - How a write answers.
 */
function serveSettings(
	statsOptions: Record< string, unknown > = STATS_OPTIONS,
	onPost?: () => Promise< unknown >
) {
	const stored = { stats_options: statsOptions, wpcom_reader_views_enabled: true };
	mockApiFetch.mockImplementation(
		( { method, data, parse }: { method?: string; data?: object; parse?: boolean } ) => {
			if ( method === 'POST' ) {
				return onPost?.() ?? Promise.resolve( { ...stored, ...data } );
			}
			// core-data reads records unparsed, as a fetch Response.
			const body = method === 'OPTIONS' ? {} : stored;
			return Promise.resolve(
				parse === false ? { json: () => Promise.resolve( body ), headers: new Headers() } : body
			);
		}
	);
}

const VIEWED_BY = 'Allow Jetpack Stats to be viewed by:';

/**
 * Renders the drawer.
 *
 * @param onClose - Called when the drawer closes.
 * @return The `userEvent` session.
 */
function showDrawer( onClose = () => {} ) {
	render( <SettingsDrawer open onClose={ onClose } />, { wrapper: withRegistry } );
	return userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
}

let registry: ReturnType< typeof createRegistry >;

/**
 * Give each test its own core-data store, so no record or edit carries over.
 *
 * @param props          - Component props.
 * @param props.children - The tree to render.
 * @return The tree inside the test's registry.
 */
function withRegistry( { children }: { children: React.ReactNode } ) {
	return <RegistryProvider value={ registry }>{ children }</RegistryProvider>;
}

/**
 * Opens the role dropdown whose label starts with the given text.
 *
 * @param user  - The `userEvent` session.
 * @param label - The dropdown's visible label.
 */
async function openRoleSelect( user: ReturnType< typeof userEvent.setup >, label: string ) {
	await user.click( await screen.findByRole( 'button', { name: new RegExp( `^${ label }` ) } ) );
}

beforeEach( () => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	mockApiFetch.mockReset();
	serveSettings();
	mockStatsSettingsContext.mockReturnValue( { roles: ROLES, modules_url: null } );
	registry = createRegistry();
	registry.register( coreStore );
	registry.register( noticesStore );
} );

afterEach( () => {
	resetLocaleData();
	jest.useRealTimers();
} );

const ADMIN_BAR = { name: 'Include a small chart in admin bar' };

/**
 * Whether a write to core's site settings route was sent.
 *
 * @return The POST calls to the route.
 */
const settingsWrites = () =>
	mockApiFetch.mock.calls.filter(
		( [ options ]: [ { path?: string; method?: string } ] ) =>
			options.method === 'POST' && options.path?.startsWith( '/wp/v2/settings' )
	);

describe( 'SettingsDrawer', () => {
	it( 'keeps administrators able to view Stats when the stored roles leave them out', async () => {
		serveSettings( { ...STATS_OPTIONS, roles: [ 'editor' ] } );
		const user = showDrawer();

		await openRoleSelect( user, VIEWED_BY );

		const administrator = await screen.findByRole( 'menuitemcheckbox', { name: 'Administrator' } );
		expect( administrator ).toBeChecked();
		expect( administrator ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'saves nothing until Save, then writes the Stats options to the site settings', async () => {
		const user = showDrawer();

		await openRoleSelect( user, VIEWED_BY );
		await user.click( await screen.findByRole( 'menuitemcheckbox', { name: 'Editor' } ) );

		expect( settingsWrites() ).toHaveLength( 0 );

		await user.keyboard( '{Escape}' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );
		expect( settingsWrites()[ 0 ][ 0 ].data ).toEqual( {
			stats_options: { ...STATS_OPTIONS, roles: [ 'administrator', 'editor' ] },
		} );
	} );

	it( 'keeps Administrator when the last other role is cleared from stored roles that leave it out', async () => {
		serveSettings( { ...STATS_OPTIONS, roles: [ 'editor' ] } );
		const user = showDrawer();

		await openRoleSelect( user, VIEWED_BY );
		await user.click( await screen.findByRole( 'menuitemcheckbox', { name: 'Editor' } ) );
		await user.keyboard( '{Escape}' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );
		expect( settingsWrites()[ 0 ][ 0 ].data.stats_options.roles ).toEqual( [ 'administrator' ] );
	} );

	it( 'writes the Reader setting as its own site setting', async () => {
		const user = showDrawer();

		await user.click(
			await screen.findByRole( 'checkbox', { name: 'Show post views for this site' } )
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );
		expect( settingsWrites()[ 0 ][ 0 ].data ).toEqual( { wpcom_reader_views_enabled: false } );
	} );

	it( 'reads no site settings while closed', async () => {
		render( <SettingsDrawer open={ false } onClose={ () => {} } />, { wrapper: withRegistry } );
		// Resolvers start on a timer.
		await act( async () => {
			jest.runOnlyPendingTimers();
		} );

		expect(
			registry.select( coreStore ).hasStartedResolution( 'getEntityRecord', [ 'root', 'site' ] )
		).toBe( false );
	} );

	it( 'slides in from the left edge in a right-to-left language', async () => {
		setLocaleData( { 'text direction\u0004ltr': [ 'rtl' ] } );
		showDrawer();

		await expect( screen.findByRole( 'dialog', { name: 'Settings' } ) ).resolves.toHaveAttribute(
			'data-swipe-direction',
			'left'
		);
	} );

	it( 'says the settings could not be loaded when the site returns none', async () => {
		serveSettings( null as unknown as Record< string, unknown > );
		showDrawer();

		const drawer = await screen.findByRole( 'dialog', { name: 'Settings' } );

		await expect(
			within( drawer ).findByText(
				'Your Stats settings could not be loaded. Close this panel and try again.'
			)
		).resolves.toBeInTheDocument();
	} );

	it( 'offers Save only once something changed', async () => {
		showDrawer();

		await expect(
			screen.findByRole( 'heading', { name: 'Manage permissions' } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'offers no Save when a role is cleared and ticked again in another order', async () => {
		serveSettings( { ...STATS_OPTIONS, roles: [ 'administrator', 'editor', 'author' ] } );
		const user = showDrawer();

		await openRoleSelect( user, VIEWED_BY );
		await user.click( await screen.findByRole( 'menuitemcheckbox', { name: 'Editor' } ) );
		await user.click( screen.getByRole( 'menuitemcheckbox', { name: 'Editor' } ) );
		await user.keyboard( '{Escape}' );

		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'confirms the save in a snackbar and closes', async () => {
		const onClose = jest.fn();
		const user = showDrawer( onClose );

		await user.click( await screen.findByRole( 'checkbox', ADMIN_BAR ) );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( mockCreateSuccessNotice ).toHaveBeenCalledWith( 'Settings saved.', {
			type: 'snackbar',
		} );
	} );

	it( 'links to the modules screen the site names', async () => {
		mockStatsSettingsContext.mockReturnValue( {
			roles: ROLES,
			modules_url: '/wp-admin/admin.php?page=jetpack_modules',
		} );
		showDrawer();

		await expect(
			screen.findByRole( 'link', { name: 'Jetpack modules' } )
		).resolves.toHaveAttribute( 'href', '/wp-admin/admin.php?page=jetpack_modules' );
	} );

	it( 'names no modules screen when the site has none', async () => {
		showDrawer();

		await expect(
			screen.findByRole( 'heading', { name: 'Manage permissions' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: 'Activation' } ) ).not.toBeInTheDocument();
	} );

	it( 'drops unsaved changes when cancelled and opened again', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		let open = true;
		const close = () => {
			open = false;
		};
		const { rerender } = render( <SettingsDrawer open onClose={ close } />, {
			wrapper: withRegistry,
		} );

		await user.click( await screen.findByRole( 'checkbox', ADMIN_BAR ) );
		expect( screen.getByRole( 'checkbox', ADMIN_BAR ) ).not.toBeChecked();

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		expect( open ).toBe( false );
		rerender( <SettingsDrawer open={ false } onClose={ close } /> );
		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		rerender( <SettingsDrawer open onClose={ close } /> );

		await expect( screen.findByRole( 'checkbox', ADMIN_BAR ) ).resolves.toBeChecked();
	} );

	it( 'stays open while a save is running', async () => {
		serveSettings( STATS_OPTIONS, () => new Promise( () => {} ) );
		const onClose = jest.fn();
		const user = showDrawer( onClose );

		await user.click( await screen.findByRole( 'checkbox', ADMIN_BAR ) );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		await expect( screen.findByRole( 'button', { name: 'Saving…' } ) ).resolves.toBeInTheDocument();
		await user.keyboard( '{Escape}' );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'closes from its close button', async () => {
		const onClose = jest.fn();
		const user = showDrawer( onClose );

		await user.click(
			within( await screen.findByRole( 'dialog', { name: 'Settings' } ) ).getByRole( 'button', {
				name: 'Close',
			} )
		);

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'closes on a click outside it', async () => {
		const onClose = jest.fn();
		const user = showDrawer( onClose );

		await expect(
			screen.findByRole( 'dialog', { name: 'Settings' } )
		).resolves.toBeInTheDocument();
		await user.click( document.body );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'ignores its close button and a click outside it while a save is running', async () => {
		serveSettings( STATS_OPTIONS, () => new Promise( () => {} ) );
		const onClose = jest.fn();
		const user = showDrawer( onClose );

		await user.click( await screen.findByRole( 'checkbox', ADMIN_BAR ) );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		await expect( screen.findByRole( 'button', { name: 'Saving…' } ) ).resolves.toBeInTheDocument();
		await user.click(
			within( screen.getByRole( 'dialog', { name: 'Settings' } ) ).getByRole( 'button', {
				name: 'Close',
			} )
		);
		await user.click( document.body );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'stays open and says why when the site refuses the change', async () => {
		serveSettings( STATS_OPTIONS, () =>
			Promise.reject( {
				code: 'rest_invalid_param',
				message: 'Invalid parameter(s): stats_options',
			} )
		);
		const onClose = jest.fn();
		const user = showDrawer( onClose );

		await user.click( await screen.findByRole( 'checkbox', ADMIN_BAR ) );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await expect(
			within( screen.getByRole( 'dialog', { name: 'Settings' } ) ).findByText(
				'Your Stats settings could not be saved: Invalid parameter(s): stats_options'
			)
		).resolves.toBeInTheDocument();
		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'keeps a network error out of the message, which is not a reason the site gave', async () => {
		serveSettings( STATS_OPTIONS, () =>
			Promise.reject( { code: 'fetch_error', message: 'You are probably offline.' } )
		);
		const user = showDrawer();

		await user.click( await screen.findByRole( 'checkbox', ADMIN_BAR ) );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await expect(
			within( screen.getByRole( 'dialog', { name: 'Settings' } ) ).findByText(
				'Your Stats settings could not be saved.'
			)
		).resolves.toBeInTheDocument();
	} );
} );
