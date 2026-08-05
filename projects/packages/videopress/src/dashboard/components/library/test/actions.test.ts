import { makeLibraryItem as item } from '../../../test-utils/library-item';
import { setSimpleSite, unsetSimpleSite } from '../../../test-utils/simple-site';
import { buildLibraryActions } from '../actions';

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
} ) );

const makeApi = () => ( {
	promoteLocal: jest.fn(),
	retryUpload: jest.fn(),
	deleteItems: jest.fn(),
	setPrivacy: jest.fn(),
	openVideoDetails: jest.fn(),
	manageCaptions: jest.fn(),
} );

describe( 'buildLibraryActions', () => {
	it( 'adds a Manage subtitles action for idle VideoPress items', () => {
		const api = makeApi();
		const actions = buildLibraryActions( api );
		const videoItem = item( { tracks: [] } );
		const action = actions.find( candidate => candidate.id === 'manage-captions' );

		expect( action ).toBeDefined();
		expect( action?.label ).toBe( 'Manage subtitles' );
		expect( action?.supportsBulk ).toBe( false );
		expect( action?.isEligible?.( videoItem ) ).toBe( true );
		expect( action?.isEligible?.( item( { type: 'local' } ) ) ).toBe( false );

		if ( action && 'callback' in action ) {
			action.callback( [ videoItem ], { registry: {} } );
		}
		expect( api.manageCaptions ).toHaveBeenCalledWith( videoItem );
	} );

	it( 'makes a row with a delete in flight ineligible for every action', () => {
		const actions = buildLibraryActions( makeApi() );
		const deleting = item( { upload: { status: 'deleting', progress: 0 } } );

		for ( const action of actions ) {
			expect( { id: action.id, eligible: action.isEligible?.( deleting ) } ).toEqual( {
				id: action.id,
				eligible: false,
			} );
		}
	} );

	it( 'keeps an idle VideoPress row eligible for delete, edit, and captions', () => {
		const actions = buildLibraryActions( makeApi() );
		const idle = item();

		expect( actions.find( a => a.id === 'delete' )?.isEligible?.( idle ) ).toBe( true );
		expect( actions.find( a => a.id === 'edit-details' )?.isEligible?.( idle ) ).toBe( true );
		expect( actions.find( a => a.id === 'manage-captions' )?.isEligible?.( idle ) ).toBe( true );
	} );

	it( 'makes an idle local row deletable (plain attachment delete)', () => {
		const actions = buildLibraryActions( makeApi() );
		const local = item( { type: 'local' } );

		expect( actions.find( a => a.id === 'delete' )?.isEligible?.( local ) ).toBe( true );
	} );

	it( 'gives every idle row a bulk-capable action so DataViews enables its checkbox', () => {
		// DataViews disables an item's selection checkbox when no
		// `supportsBulk` action is eligible for it (useHasAPossibleBulkAction,
		// same gate in the grid and table layouts). Local rows used to have
		// zero bulk-capable actions and were silently unselectable
		// (JETPACK-2032); this pins the invariant for both row types.
		const actions = buildLibraryActions( makeApi() );
		const hasAPossibleBulkAction = ( row: ReturnType< typeof item > ) =>
			actions.some( a => a.supportsBulk && ( ! a.isEligible || a.isEligible( row ) ) );

		expect( hasAPossibleBulkAction( item() ) ).toBe( true );
		expect( hasAPossibleBulkAction( item( { type: 'local' } ) ) ).toBe( true );
	} );

	it( 'offers Upload to VideoPress for idle local items on every host', () => {
		const local = item( { type: 'local' } );
		const eligible = ( actions: ReturnType< typeof buildLibraryActions > ) =>
			actions.find( a => a.id === 'upload-to-vp' )?.isEligible?.( local );

		expect( eligible( buildLibraryActions( makeApi() ) ) ).toBe( true );

		// On WordPress.com Simple the promote mutation routes through the
		// in-process wpcom/v2/videopress/promote endpoint, so the action is
		// offered there too (it used to be hidden while only the unreachable
		// videopress/v1 walker existed).
		setSimpleSite();
		try {
			expect( eligible( buildLibraryActions( makeApi() ) ) ).toBe( true );
		} finally {
			unsetSimpleSite();
		}
	} );

	it( 'fans a bulk Upload to VideoPress out to every selected item', () => {
		const api = makeApi();
		const action = buildLibraryActions( api ).find( a => a.id === 'upload-to-vp' );

		expect( action?.supportsBulk ).toBe( true );

		const rows = [ item( { type: 'local', id: '11' } ), item( { type: 'local', id: '12' } ) ];
		if ( action && 'callback' in action ) {
			action.callback( rows, { registry: {} } );
		}
		expect( api.promoteLocal.mock.calls ).toEqual( [ [ '11' ], [ '12' ] ] );
	} );

	it( 'makes a local row with any operation in flight ineligible for Upload to VideoPress', () => {
		const action = buildLibraryActions( makeApi() ).find( a => a.id === 'upload-to-vp' );

		// 'promoting' is the overlay the stage applies while a promote is in
		// flight — the action must not double-fire it.
		for ( const status of [ 'promoting', 'deleting', 'uploading', 'failed' ] as const ) {
			const row = item( { type: 'local', upload: { status, progress: 0 } } );
			expect( { status, eligible: action?.isEligible?.( row ) } ).toEqual( {
				status,
				eligible: false,
			} );
		}
	} );
} );
