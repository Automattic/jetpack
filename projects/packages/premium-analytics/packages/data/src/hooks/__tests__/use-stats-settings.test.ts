import { renderHook } from '@testing-library/react';
import { useStatsSettings } from '../use-stats-settings';

type Site = {
	stats_options?: { admin_bar: boolean; roles: string[]; count_roles: string[] };
	wpcom_reader_views_enabled?: boolean;
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
