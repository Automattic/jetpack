/**
 * Mock the WordPress data layer so ensure-core-settings can resolve without a
 * real store. `mockGetEntityRecord` is driven per-test to simulate
 * success/failure. The `mock` prefix is required for jest.mock hoisting.
 */
const mockGetEntityRecord = jest.fn();
const mockResolveSelect = jest.fn( () => ( { getEntityRecord: mockGetEntityRecord } ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@wordpress/data', () => ( {
	resolveSelect: () => mockResolveSelect(),
} ) );

describe( 'ensureCoreSettingsReady', () => {
	beforeEach( () => {
		// Reset modules so the module-level memo (`readyPromise`) starts empty.
		jest.resetModules();
		mockGetEntityRecord.mockReset();
		mockResolveSelect.mockClear();
	} );

	it( 'memoizes the resolved promise and fetches settings only once', async () => {
		mockGetEntityRecord.mockResolvedValue( {} );
		const { ensureCoreSettingsReady } = await import( '../ensure-core-settings' );

		const first = ensureCoreSettingsReady();
		const second = ensureCoreSettingsReady();

		expect( first ).toBe( second );
		await expect( first ).resolves.toBeUndefined();
		// 'site' + 'settings' fetched once; the second call reuses the memo.
		expect( mockGetEntityRecord ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'clears the memo on rejection so a later call retries', async () => {
		mockGetEntityRecord.mockRejectedValueOnce( new Error( 'boom' ) );
		const { ensureCoreSettingsReady } = await import( '../ensure-core-settings' );

		await expect( ensureCoreSettingsReady() ).rejects.toThrow( 'boom' );

		// A transient failure must not be cached: the next call re-attempts.
		mockGetEntityRecord.mockResolvedValue( {} );
		await expect( ensureCoreSettingsReady() ).resolves.toBeUndefined();
	} );
} );
