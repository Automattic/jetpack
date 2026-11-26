// The real core-data store, so a failed resolution is replayed as it is in the browser.
type FetchOptions = { path: string; method?: string };

let settingsFail = false;
const mockApiFetch = jest.fn( ( { method }: FetchOptions ) =>
	! method && settingsFail
		? Promise.reject( new Error( 'boom' ) )
		: Promise.resolve( settingsResponse() )
);
const mockCurrentUserCan = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( options: FetchOptions ) => mockApiFetch( options ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	currentUserCan: ( capability: string ) => mockCurrentUserCan( capability ),
} ) );

function settingsResponse() {
	return {
		json: () => Promise.resolve( { url: 'https://example.com' } ),
		headers: new Headers(),
	};
}

// GETs only: core-data also sends an OPTIONS to read the route's permissions.
const settingsRequests = () =>
	mockApiFetch.mock.calls.filter(
		( [ { path, method } ] ) => ! method && path.startsWith( '/wp/v2/settings' )
	);

const flush = () => new Promise( resolve => setTimeout( resolve, 10 ) );

describe( 'ensureCoreSettingsReady', () => {
	beforeEach( () => {
		// A fresh registry and memo per test. Yjs errors when it sees its own global flag on re-import.
		jest.resetModules();
		delete ( globalThis as Record< string, unknown > )[ '__ $YJS$ __' ];
		mockApiFetch.mockClear();
		settingsFail = false;
		mockCurrentUserCan.mockReturnValue( true );
	} );

	it( 'requests nothing for a reader the settings route would refuse', async () => {
		mockCurrentUserCan.mockReturnValue( false );
		const { ensureCoreSettingsReady } = await import( '../ensure-core-settings' );

		await expect( ensureCoreSettingsReady() ).resolves.toBeUndefined();
		expect( mockCurrentUserCan ).toHaveBeenCalledWith( 'manage_options' );
		expect( settingsRequests() ).toHaveLength( 0 );
	} );

	it( 'memoizes the promise and fetches the site record only once', async () => {
		const { ensureCoreSettingsReady } = await import( '../ensure-core-settings' );

		const first = ensureCoreSettingsReady();
		const second = ensureCoreSettingsReady();

		expect( first ).toBe( second );
		await expect( first ).resolves.toBeUndefined();
		expect( settingsRequests() ).toHaveLength( 1 );
	} );

	it( 'does not refetch a record a reader already loaded', async () => {
		const { ensureCoreSettingsReady } = await import( '../ensure-core-settings' );
		const { store: coreStore } = await import( '@wordpress/core-data' );
		const { select } = await import( '@wordpress/data' );

		select( coreStore ).getEntityRecord( 'root', 'site' );
		await flush();

		await expect( ensureCoreSettingsReady() ).resolves.toBeUndefined();
		expect( settingsRequests() ).toHaveLength( 1 );
	} );

	it( 'refetches on the next call after a failure, and not before', async () => {
		settingsFail = true;
		const { ensureCoreSettingsReady } = await import( '../ensure-core-settings' );
		const { store: coreStore } = await import( '@wordpress/core-data' );
		const { select } = await import( '@wordpress/data' );

		await expect( ensureCoreSettingsReady() ).rejects.toThrow( 'boom' );

		// Stands in for `useSiteHomeUrl()` selecting again.
		select( coreStore ).getEntityRecord( 'root', 'site' );
		await flush();
		expect( settingsRequests() ).toHaveLength( 1 );

		settingsFail = false;
		await expect( ensureCoreSettingsReady() ).resolves.toBeUndefined();
		expect( settingsRequests() ).toHaveLength( 2 );
		expect( select( coreStore ).getEntityRecord( 'root', 'site' ) ).toMatchObject( {
			url: 'https://example.com',
		} );
	} );
} );
