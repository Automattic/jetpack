import { renderHook } from '@testing-library/react';
import { useStatsSettings } from '../use-stats-settings';

type Site = {
	stats_options?: { admin_bar: boolean; roles: string[]; count_roles: string[] };
	wpcom_reader_views_enabled?: boolean;
};

const mockSite: {
	stored: Site;
	edits: Site;
	saves: { resolve: () => void; reject: ( error: Error ) => void }[];
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
		saveEditedEntityRecord: () =>
			new Promise< void >( ( resolve, reject ) => mockSite.saves.push( { resolve, reject } ) ),
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

	it( 'keeps a later saved change when an earlier save fails', async () => {
		const { result } = renderHook( () => useStatsSettings() );

		const first = result.current.saveChange( { admin_bar: false } );
		const second = result.current.saveChange( { wpcom_reader_views_enabled: false } );
		// The second save stores every edit made so far.
		mockSite.stored = mockEdited();
		mockSite.edits = {};
		mockSite.saves[ 1 ].resolve();
		await second;
		mockSite.saves[ 0 ].reject( new Error( 'refused' ) );
		await expect( first ).rejects.toThrow( 'refused' );

		expect( mockEdited().wpcom_reader_views_enabled ).toBe( false );
		// The second save stored the first change too, so the failure finds nothing to put back.
		expect( mockEdited().stats_options?.admin_bar ).toBe( false );
	} );

	it( 'keeps a pending change when an earlier save fails', async () => {
		const { result } = renderHook( () => useStatsSettings() );

		const first = result.current.saveChange( { admin_bar: false } );
		result.current.saveChange( { wpcom_reader_views_enabled: false } );
		mockSite.saves[ 0 ].reject( new Error( 'refused' ) );
		await expect( first ).rejects.toThrow( 'refused' );

		expect( mockEdited().wpcom_reader_views_enabled ).toBe( false );
	} );

	it( 'puts back the stored value of a change the site refuses', async () => {
		const { result } = renderHook( () => useStatsSettings() );

		const save = result.current.saveChange( { admin_bar: false } );
		mockSite.saves[ 0 ].reject( new Error( 'refused' ) );
		await expect( save ).rejects.toThrow( 'refused' );

		expect( mockEdited().stats_options?.admin_bar ).toBe( true );
	} );
} );
