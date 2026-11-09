import { renderHook } from '@testing-library/react';
import { resetSiteSettingsQueueForTesting } from '../site-settings-queue';
import { useGoogleAnalyticsSettings } from '../use-google-analytics-settings';
import { useStatsSettings } from '../use-stats-settings';

type Site = {
	stats_options?: { admin_bar: boolean; roles: string[]; count_roles: string[] };
	wpcom_reader_views_enabled?: boolean;
	google_analytics?: { is_active: boolean };
};

const mockSite: {
	stored: Site;
	edits: Site;
	saves: { record: Site; resolve: () => void; reject: ( error: Error ) => void }[];
} = { stored: {}, edits: {}, saves: [] };

/**
 * The site settings with the unsaved edits applied, as core-data's edited record.
 *
 * @return The edited settings.
 */
function mockEdited(): Site {
	return { ...mockSite.stored, ...mockSite.edits };
}

/**
 * Record an edit, as core-data's `editEntityRecord` does.
 *
 * @param patch - The edited settings.
 */
function mockEdit( patch: Site ): void {
	mockSite.edits = { ...mockSite.edits, ...patch };
}

/**
 * Let the queued saves that are free to go reach the site.
 *
 * @return Resolves once they are sent.
 */
function sent(): Promise< void > {
	return new Promise( resolve => setTimeout( resolve ) );
}

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
	useEntityRecord: () => ( {
		record: mockSite.stored,
		editedRecord: mockEdited(),
		edit: mockEdit,
		status: 'SUCCESS',
		hasResolved: true,
	} ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		saveEntityRecord: ( _kind: string, _name: string, record: Site ) =>
			new Promise< void >( ( resolve, reject ) =>
				mockSite.saves.push( { record, resolve, reject } )
			),
	} ),
	useRegistry: () => ( {
		select: () => ( {
			getEntityRecord: () => mockSite.stored,
			getEditedEntityRecord: mockEdited,
		} ),
	} ),
} ) );

describe( 'useStatsSettings', () => {
	beforeEach( () => {
		mockSite.stored = {
			stats_options: { admin_bar: true, roles: [ 'administrator' ], count_roles: [] },
			wpcom_reader_views_enabled: true,
		};
		mockSite.edits = {};
		mockSite.saves = [];
		resetSiteSettingsQueueForTesting();
	} );

	it( 'waits for a Google Analytics save before sending a Stats save', async () => {
		const { result: analytics } = renderHook( () => useGoogleAnalyticsSettings() );
		const { result: stats } = renderHook( () => useStatsSettings() );

		const first = analytics.current.saveChange( { is_active: true } );
		const second = stats.current.saveChange( { admin_bar: false } );
		await sent();
		expect( mockSite.saves ).toHaveLength( 1 );

		mockSite.saves[ 0 ].resolve();
		await first;
		await sent();
		expect( mockSite.saves ).toHaveLength( 2 );
		mockSite.saves[ 1 ].resolve();
		await second;
	} );

	it.each( [
		[
			'loads the Reader setting alone when the site offers only it',
			{ wpcom_reader_views_enabled: false },
			[ 'wpcom_reader_views_enabled' ] as const,
			false,
		],
		[
			'reports an error when the site leaves out a setting it offers',
			{ wpcom_reader_views_enabled: false },
			undefined,
			true,
		],
	] )( '%s', ( _title, stored, offered, isError ) => {
		mockSite.stored = stored;

		const { result } = renderHook( () => useStatsSettings( offered ) );

		expect( result.current.isError ).toBe( isError );
	} );

	it( 'saves a setting changed back to its stored value while its first save is pending', async () => {
		const { result } = renderHook( () => useStatsSettings() );

		const first = result.current.saveChange( { admin_bar: false } );
		const second = result.current.saveChange( { admin_bar: true } );
		await sent();
		expect( mockSite.saves ).toHaveLength( 1 );
		// The first save's answer becomes the stored settings and drops the edits.
		mockSite.stored = { ...mockSite.stored, ...mockSite.saves[ 0 ].record };
		mockSite.edits = {};
		mockSite.saves[ 0 ].resolve();
		await first;

		expect( mockSite.saves[ 1 ].record.stats_options?.admin_bar ).toBe( true );
		expect( mockEdited().stats_options?.admin_bar ).toBe( true );
		mockSite.saves[ 1 ].resolve();
		await second;
	} );

	it( 'keeps a pending change when an earlier save fails', async () => {
		const { result } = renderHook( () => useStatsSettings() );

		const first = result.current.saveChange( { admin_bar: false } );
		result.current.saveChange( { wpcom_reader_views_enabled: false } );
		await sent();
		mockSite.saves[ 0 ].reject( new Error( 'refused' ) );
		await expect( first ).rejects.toThrow( 'refused' );

		expect( mockEdited().wpcom_reader_views_enabled ).toBe( false );
	} );

	it( 'keeps a newer pending edit to the same setting when an earlier save fails', async () => {
		const { result } = renderHook( () => useStatsSettings() );

		const first = result.current.saveChange( { roles: [ 'administrator', 'editor' ] } );
		result.current.saveChange( { roles: [ 'administrator', 'editor', 'author' ] } );
		await sent();
		mockSite.saves[ 0 ].reject( new Error( 'refused' ) );
		await expect( first ).rejects.toThrow( 'refused' );

		expect( mockEdited().stats_options?.roles ).toEqual( [ 'administrator', 'editor', 'author' ] );
	} );

	it( 'puts back the stored value of a change the site refuses', async () => {
		const { result } = renderHook( () => useStatsSettings() );

		const save = result.current.saveChange( { admin_bar: false } );
		await sent();
		mockSite.saves[ 0 ].reject( new Error( 'refused' ) );
		await expect( save ).rejects.toThrow( 'refused' );

		expect( mockEdited().stats_options?.admin_bar ).toBe( true );
	} );
} );
