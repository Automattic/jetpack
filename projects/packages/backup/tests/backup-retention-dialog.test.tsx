// The retention dialog behind "N days of backups saved" (JETPACK-2938).

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StorageSpace from '../src/dashboard/components/storage-space';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const MB = 2 ** 20;
const GB = 2 ** 30;
const SITE = 'example.wordpress.com';
const DASHBOARD = '/wp-admin/admin.php?page=jetpack-backup';

type ApiOptions = { path?: string; method?: string; data?: { retention_days: number } };

/**
 * Render the storage section inside an isolated QueryClient.
 */
function renderSection() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	render(
		<QueryClientProvider client={ client }>
			<StorageSpace />
		</QueryClientProvider>
	);
}

/**
 * Answer the storage reads, the add-on offer and the save.
 *
 * Defaults to 30 days kept of 1GB backups, on a 100GB limit: 7 and 30 days fit, 120 and
 * 365 do not.
 *
 * @param options          - Overrides.
 * @param options.size     - Extra fields for `/site/backup/size`.
 * @param options.policies - Extra fields for the policies.
 * @param options.save     - What the save resolves or rejects with.
 */
function mockEndpoints( {
	size = {} as Record< string, unknown >,
	policies = {} as Record< string, unknown >,
	save = () => Promise.resolve( { ok: true } ) as Promise< unknown >,
} = {} ) {
	mockApiFetch.mockImplementation( ( options: ApiOptions ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/backup/retention' ) ) {
			return save();
		}
		if ( path.includes( '/site/backup/policies' ) ) {
			return Promise.resolve( {
				policies: { storage_limit_bytes: 100 * GB, activity_log_limit_days: 30, ...policies },
			} );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( {
				ok: true,
				size: 10 * GB,
				last_backup_size: GB,
				retention_days: 30,
				days_of_backups_saved: 14,
				...size,
			} );
		}
		if ( path.includes( '/site/backup/addon-offer' ) ) {
			return Promise.resolve( {
				slug: 'jetpack_backup_addon_storage_1tb_monthly',
				size_text: '1TB',
				pricing: { currency_code: 'USD', full_price: 40 },
			} );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * Every save the dialog has sent, by the days it asked for.
 *
 * @return The `retention_days` of each POST.
 */
function savedDays(): number[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ]: [ ApiOptions ] ) => options )
		.filter( options => options?.method === 'POST' )
		.map( options => options.data?.retention_days ?? -1 );
}

/**
 * Open the dialog from the retention line.
 *
 * @return The dialog.
 */
async function openDialog(): Promise< HTMLElement > {
	await userEvent.click( await screen.findByRole( 'button', { name: /backups saved/ } ) );
	return screen.findByRole( 'dialog', { name: 'Days of backups saved' } );
}

/**
 * Pick a period in the open dialog.
 *
 * @param label - The period's label.
 */
async function pick( label: string ) {
	await userEvent.click( screen.getByRole( 'combobox', { name: 'Keep backups for' } ) );
	await userEvent.click( await screen.findByRole( 'option', { name: label } ) );
}

beforeEach( () => {
	mockApiFetch.mockReset();
	mockEndpoints();
	window.history.replaceState( null, '', DASHBOARD );
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
		siteSuffix: SITE,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'the retention dialog', () => {
	it.each( [
		[ 'with room to spare', {}, 'Needs about 30GB of your 100GB.' ],
		[
			'too small to state in GB',
			{ size: { last_backup_size: 5 * MB } },
			'Needs about 150MB of your 100GB.',
		],
		[
			'already over its limit',
			{ policies: { storage_limit_bytes: 10 * GB } },
			'Needs about 30GB of your 10GB.',
		],
	] )(
		'starts on the retention in force, with nothing to save, on a site %s',
		async ( _case, endpoints, estimate ) => {
			mockEndpoints( endpoints );
			renderSection();
			const dialog = await openDialog();

			expect(
				within( dialog ).getByRole( 'combobox', { name: 'Keep backups for' } )
			).toHaveTextContent( '30 days' );
			expect( within( dialog ).getByText( estimate ) ).toBeVisible();
			expect( within( dialog ).getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
			expect( within( dialog ).queryByText( /additional storage/ ) ).not.toBeInTheDocument();
		}
	);

	it( 'saves a longer retention that fits, then closes and announces it', async () => {
		mockEndpoints( { size: { last_backup_size: GB / 2 } } );
		renderSection();
		await openDialog();

		await pick( '120 days' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		expect( savedDays() ).toEqual( [ 120 ] );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Backup retention changed.' );
	} );

	it.each( [
		[ 'a shorter retention', {} ],
		[
			'a retention that may be shorter than an unreported one',
			{ size: { retention_days: 0 }, policies: { activity_log_limit_days: null } },
		],
	] )( 'asks before %s deletes older backups', async ( _case, endpoints ) => {
		mockEndpoints( endpoints );
		renderSection();
		const dialog = await openDialog();

		await pick( '7 days' );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Save' } ) );

		const cancel = within( dialog ).getByRole( 'button', { name: 'Cancel' } );
		expect( cancel ).toHaveFocus();
		expect( cancel ).toHaveAccessibleDescription( /Backups older than 7 days will be deleted\.$/ );
		expect( savedDays() ).toEqual( [] );

		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Confirm change' } ) );

		await waitFor( () => expect( savedDays() ).toEqual( [ 7 ] ) );
	} );

	it( 'sends a choice beyond the limit to checkout, and back here with it', async () => {
		renderSection();
		const dialog = await openDialog();

		await pick( '1 year' );

		expect( within( dialog ).queryByRole( 'button', { name: 'Save' } ) ).not.toBeInTheDocument();
		const purchase = await within( dialog ).findByRole( 'link', { name: 'Purchase and update' } );
		const checkout = new URL( purchase.getAttribute( 'href' ) ?? '' );
		const redirect = new URL( checkout.searchParams.get( 'redirect_to' ) ?? '' );
		const back = new URL( checkout.searchParams.get( 'checkoutBackUrl' ) ?? '' );

		expect( checkout.pathname ).toBe(
			`/checkout/${ SITE }/jetpack_backup_addon_storage_1tb_monthly`
		);
		expect( checkout.searchParams.get( 'source' ) ).toBe( 'backup-storage-purchase-not-renewal' );
		expect( redirect.searchParams.get( 'retention' ) ).toBe( '365' );
		expect( redirect.searchParams.get( 'storage_purchased' ) ).toBe( '1' );
		expect( back.searchParams.get( 'retention' ) ).toBe( '365' );
		expect( back.searchParams.has( 'storage_purchased' ) ).toBe( false );
		// The offer is sized for the choice, not for today's usage.
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringContaining( `storage_size=${ 365 * GB }&storage_limit=${ 100 * GB }` ),
			} )
		);
	} );

	it( 'does not take the second click of a double-click on Save as confirmation', async () => {
		renderSection();
		const dialog = await openDialog();

		await pick( '7 days' );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Save' } ) );
		// What a browser sends to whatever now sits under the pointer; userEvent cannot set `detail`.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( within( dialog ).getByRole( 'button', { name: 'Confirm change' } ), {
			detail: 2,
		} );
		await act( () => Promise.resolve() );

		expect( savedDays() ).toEqual( [] );
	} );

	it( 'keeps the dialog open with the error when the save fails', async () => {
		mockEndpoints( { save: () => Promise.reject( { message: 'Refused.' } ) } );
		renderSection();
		const dialog = await openDialog();

		await pick( '7 days' );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Save' } ) );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Confirm change' } ) );

		await expect( within( dialog ).findByText( 'Refused.' ) ).resolves.toBeVisible();
	} );
} );

describe( 'returning from checkout', () => {
	it( 'applies a purchased increase once the new storage covers it', async () => {
		window.history.replaceState( null, '', `${ DASHBOARD }&retention=120&storage_purchased=1` );
		mockEndpoints( { policies: { storage_limit_bytes: 200 * GB } } );
		renderSection();

		await waitFor( () => expect( savedDays() ).toEqual( [ 120 ] ) );
		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		expect( window.location.search ).toBe( '?page=jetpack-backup' );
	} );

	it.each( [
		[ 'shortens retention', '&retention=7&storage_purchased=1', '7 days', {} ],
		[ 'still exceeds the limit', '&retention=365&storage_purchased=1', '1 year', {} ],
		[
			'cannot be sized',
			'&retention=120&storage_purchased=1',
			'120 days',
			{ size: { last_backup_size: undefined }, policies: { storage_limit_bytes: 200 * GB } },
		],
	] )( 'waits for the reader when the choice %s', async ( _case, args, label, endpoints ) => {
		window.history.replaceState( null, '', `${ DASHBOARD }${ args }` );
		mockEndpoints( endpoints );
		renderSection();

		const dialog = await screen.findByRole( 'dialog', { name: 'Days of backups saved' } );
		// Lets an automatic save, if one were coming, reach the API.
		await act( () => Promise.resolve() );

		expect(
			within( dialog ).getByRole( 'combobox', { name: 'Keep backups for' } )
		).toHaveTextContent( label );
		expect( savedDays() ).toEqual( [] );
	} );
} );
