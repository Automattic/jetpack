/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { SettingsDrawer } from '../settings-drawer';

const mockApiFetch = jest.fn();
const mockCreateSuccessNotice = jest.fn();
const mockDispatch = jest.fn( () => ( { createSuccessNotice: mockCreateSuccessNotice } ) );

// Override `useRegistry` only; the fall-through resolves lazily since `requireActual` re-enters mid-init.
jest.mock(
	'@wordpress/data',
	() =>
		new Proxy(
			{ useRegistry: () => ( { dispatch: mockDispatch } ) },
			{
				get: ( overrides, prop ) =>
					prop in overrides
						? overrides[ prop as keyof typeof overrides ]
						: jest.requireActual( '@wordpress/data' )[ prop ],
			}
		)
);

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

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {} ),
	isSimpleSite: () => false,
} ) );

const STORED = {
	modules_url: null,
	settings: {
		admin_bar: true,
		roles: [ 'administrator' ],
		count_roles: [],
		wpcom_reader_views_enabled: true,
	},
	roles: [
		{ slug: 'administrator', name: 'Administrator' },
		{ slug: 'editor', name: 'Editor' },
	],
};

const VIEWED_BY = 'Allow Jetpack Stats to be viewed by:';

/**
 * Renders the drawer.
 *
 * @param onClose - Called when the drawer closes.
 * @return The `userEvent` session.
 */
function showDrawer( onClose = () => {} ) {
	render( <SettingsDrawer open onClose={ onClose } /> );
	return userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
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
	mockApiFetch.mockImplementation( () => Promise.resolve( STORED ) );
} );

afterEach( () => {
	queryClient.clear();
	jest.useRealTimers();
} );

describe( 'SettingsDrawer', () => {
	it( 'keeps administrators able to view Stats when the stored roles leave them out', async () => {
		mockApiFetch.mockImplementation( () =>
			Promise.resolve( { ...STORED, settings: { ...STORED.settings, roles: [ 'editor' ] } } )
		);
		const user = showDrawer();

		await openRoleSelect( user, VIEWED_BY );

		const administrator = await screen.findByRole( 'menuitemcheckbox', { name: 'Administrator' } );
		expect( administrator ).toBeChecked();
		expect( administrator ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'saves nothing until Save, then only the setting that changed', async () => {
		const user = showDrawer();

		await openRoleSelect( user, VIEWED_BY );
		await user.click( await screen.findByRole( 'menuitemcheckbox', { name: 'Editor' } ) );

		expect( mockApiFetch ).not.toHaveBeenCalledWith(
			expect.objectContaining( { method: 'POST' } )
		);

		await user.keyboard( '{Escape}' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: '/jetpack/v4/stats/settings',
				method: 'POST',
				data: { roles: [ 'administrator', 'editor' ] },
			} )
		);
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

	it( 'confirms the save in a snackbar and closes', async () => {
		const onClose = jest.fn();
		const user = showDrawer( onClose );

		await user.click(
			await screen.findByRole( 'checkbox', { name: 'Include a small chart in the admin bar' } )
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( mockDispatch ).toHaveBeenCalledWith( 'core/notices' );
		expect( mockCreateSuccessNotice ).toHaveBeenCalledWith( 'Settings saved.', {
			type: 'snackbar',
		} );
	} );

	it( 'links to the modules screen only when the site has one', async () => {
		mockApiFetch.mockImplementation( () =>
			Promise.resolve( { ...STORED, modules_url: '/wp-admin/admin.php?page=jetpack_modules' } )
		);
		showDrawer();

		await expect(
			screen.findByRole( 'link', { name: 'Go to Jetpack modules' } )
		).resolves.toHaveAttribute( 'href', '/wp-admin/admin.php?page=jetpack_modules' );
	} );

	it( 'names no modules screen when the site has none', async () => {
		showDrawer();

		await expect(
			screen.findByRole( 'heading', { name: 'Manage permissions' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: 'Activation' } ) ).not.toBeInTheDocument();
	} );

	it( 'drops unsaved changes when closed and opened again', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const { rerender } = render( <SettingsDrawer open onClose={ () => {} } /> );
		const toggleName = { name: 'Include a small chart in the admin bar' };

		await user.click( await screen.findByRole( 'checkbox', toggleName ) );
		expect( screen.getByRole( 'checkbox', toggleName ) ).not.toBeChecked();

		rerender( <SettingsDrawer open={ false } onClose={ () => {} } /> );
		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		rerender( <SettingsDrawer open onClose={ () => {} } /> );

		await expect( screen.findByRole( 'checkbox', toggleName ) ).resolves.toBeChecked();
	} );

	it( 'stays open while a save is running', async () => {
		mockApiFetch.mockImplementation( ( { method }: { method?: string } ) =>
			method === 'POST' ? new Promise( () => {} ) : Promise.resolve( STORED )
		);
		const onClose = jest.fn();
		const user = showDrawer( onClose );

		await user.click(
			await screen.findByRole( 'checkbox', { name: 'Include a small chart in the admin bar' } )
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		await expect( screen.findByRole( 'button', { name: 'Saving…' } ) ).resolves.toBeInTheDocument();
		await user.keyboard( '{Escape}' );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'stays open and says why when the site refuses the change', async () => {
		mockApiFetch.mockImplementation( ( { method }: { method?: string } ) =>
			method === 'POST'
				? Promise.reject( { code: 'jetpack_stats_invalid_role', message: 'Unknown role.' } )
				: Promise.resolve( STORED )
		);
		const onClose = jest.fn();
		const user = showDrawer( onClose );

		await user.click(
			await screen.findByRole( 'checkbox', { name: 'Include a small chart in the admin bar' } )
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await expect(
			within( screen.getByRole( 'dialog', { name: 'Settings' } ) ).findByText(
				'Your Stats settings could not be saved: Unknown role.'
			)
		).resolves.toBeInTheDocument();
		expect( onClose ).not.toHaveBeenCalled();
	} );
} );
