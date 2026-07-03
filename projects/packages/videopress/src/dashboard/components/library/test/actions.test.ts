import { makeLibraryItem as item } from '../../../test-utils/library-item';
import { buildLibraryActions } from '../actions';

const makeApi = () => ( {
	promoteLocal: jest.fn(),
	retryUpload: jest.fn(),
	deleteItems: jest.fn(),
	setPrivacy: jest.fn(),
	openVideoDetails: jest.fn(),
	openVideoAnalytics: jest.fn(),
	attachMedia: jest.fn(),
} );

describe( 'buildLibraryActions — eligibility while deleting', () => {
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

	it( 'keeps an idle VideoPress row eligible for delete and edit', () => {
		const actions = buildLibraryActions( makeApi() );
		const idle = item();

		expect( actions.find( a => a.id === 'delete' )?.isEligible?.( idle ) ).toBe( true );
		expect( actions.find( a => a.id === 'edit-details' )?.isEligible?.( idle ) ).toBe( true );
	} );
} );

describe( 'buildLibraryActions — import draft exclusion', () => {
	type InitialState = { features?: { studio?: boolean } };
	const globals = window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState };

	afterEach( () => {
		delete globals.JPVIDEOPRESS_INITIAL_STATE;
	} );

	// Drafts have no guid, so of the full flag-on action set they may only
	// match their own completion flow (attach-media) and the guid-free
	// force-delete. Everything else — details, analytics, privacy, playlists,
	// the local-upload path — must exclude them.
	const DRAFT_ELIGIBLE_IDS = [ 'attach-media', 'delete' ];

	it( 'limits a draft row to attach-media and delete, excluding every other action', () => {
		// Studio flag on so the gated actions (view-analytics, add-to-playlist,
		// attach-media) are built too — drafts must fall out of the full set,
		// not just the base.
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		const actions = buildLibraryActions( makeApi() );
		const draft = item( { type: 'draft', guid: '' } );

		expect( actions.length ).toBeGreaterThan( 0 );
		for ( const action of actions ) {
			expect( { id: action.id, eligible: action.isEligible?.( draft ) } ).toEqual( {
				id: action.id,
				eligible: DRAFT_ELIGIBLE_IDS.includes( action.id ),
			} );
		}
	} );

	it( 'makes a draft with a delete in flight ineligible for every action', () => {
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		const actions = buildLibraryActions( makeApi() );
		const deletingDraft = item( {
			type: 'draft',
			guid: '',
			upload: { status: 'deleting', progress: 0 },
		} );

		for ( const action of actions ) {
			expect( { id: action.id, eligible: action.isEligible?.( deletingDraft ) } ).toEqual( {
				id: action.id,
				eligible: false,
			} );
		}
	} );
} );

describe( 'buildLibraryActions — attach-media gating and dispatch', () => {
	type InitialState = { features?: { studio?: boolean } };
	const globals = window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState };

	afterEach( () => {
		delete globals.JPVIDEOPRESS_INITIAL_STATE;
	} );

	it( 'omits the action when the Studio flag is off', () => {
		expect( buildLibraryActions( makeApi() ).find( a => a.id === 'attach-media' ) ).toBeUndefined();
	} );

	it( 'includes a per-row action limited to idle drafts when the flag is on', () => {
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		const action = buildLibraryActions( makeApi() ).find( a => a.id === 'attach-media' );

		expect( action?.supportsBulk ).toBe( false );
		expect( action?.isEligible?.( item( { type: 'draft', guid: '' } ) ) ).toBe( true );
		// Idle VideoPress and local rows are not drafts.
		expect( action?.isEligible?.( item() ) ).toBe( false );
		expect( action?.isEligible?.( item( { type: 'local' } ) ) ).toBe( false );
	} );

	it( 'hands the whole draft item to the api so the stage can snapshot it', () => {
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		const api = makeApi();
		const action = buildLibraryActions( api ).find( a => a.id === 'attach-media' );
		const draft = item( { id: '7', type: 'draft', guid: '' } );

		expect( action && 'callback' in action ? action.callback : undefined ).toBeDefined();
		if ( action && 'callback' in action ) {
			action.callback( [ draft ], { registry: undefined } );
		}
		expect( api.attachMedia ).toHaveBeenCalledWith( draft );
	} );
} );

describe( 'buildLibraryActions — delete eligibility for drafts', () => {
	type InitialState = { features?: { studio?: boolean } };
	const globals = window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState };

	afterEach( () => {
		delete globals.JPVIDEOPRESS_INITIAL_STATE;
	} );

	it( 'lets an idle draft be deleted (discarding the import) but not a local row', () => {
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		const action = buildLibraryActions( makeApi() ).find( a => a.id === 'delete' );

		expect( action?.isEligible?.( item( { type: 'draft', guid: '' } ) ) ).toBe( true );
		expect( action?.isEligible?.( item( { type: 'local' } ) ) ).toBe( false );
	} );
} );

describe( 'buildLibraryActions — add-to-playlist gating', () => {
	type InitialState = { features?: { studio?: boolean } };
	const globals = window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState };

	afterEach( () => {
		delete globals.JPVIDEOPRESS_INITIAL_STATE;
	} );

	it( 'omits the action when the Studio flag is off', () => {
		expect(
			buildLibraryActions( makeApi() ).find( a => a.id === 'add-to-playlist' )
		).toBeUndefined();
	} );

	it( 'includes a bulk action limited to idle VideoPress items when the flag is on', () => {
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		const action = buildLibraryActions( makeApi() ).find( a => a.id === 'add-to-playlist' );

		expect( action?.supportsBulk ).toBe( true );
		expect( action?.isEligible?.( item() ) ).toBe( true );
		expect( action?.isEligible?.( item( { type: 'local' } ) ) ).toBe( false );
		expect(
			action?.isEligible?.( item( { upload: { status: 'uploading', progress: 10 } } ) )
		).toBe( false );
	} );
} );

describe( 'buildLibraryActions — view-analytics gating and navigation', () => {
	type InitialState = { features?: { studio?: boolean } };
	const globals = window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState };

	afterEach( () => {
		delete globals.JPVIDEOPRESS_INITIAL_STATE;
	} );

	it( 'omits the action when the Studio flag is off', () => {
		expect(
			buildLibraryActions( makeApi() ).find( a => a.id === 'view-analytics' )
		).toBeUndefined();
	} );

	it( 'includes a per-row action limited to idle VideoPress items when the flag is on', () => {
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		const action = buildLibraryActions( makeApi() ).find( a => a.id === 'view-analytics' );

		expect( action?.supportsBulk ).toBe( false );
		expect( action?.isEligible?.( item() ) ).toBe( true );
		expect( action?.isEligible?.( item( { type: 'local' } ) ) ).toBe( false );
		expect(
			action?.isEligible?.( item( { upload: { status: 'uploading', progress: 10 } } ) )
		).toBe( false );
	} );

	it( 'routes the selected video to its analytics screen via the api', () => {
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		const api = makeApi();
		const action = buildLibraryActions( api ).find( a => a.id === 'view-analytics' );

		expect( action && 'callback' in action ? action.callback : undefined ).toBeDefined();
		if ( action && 'callback' in action ) {
			action.callback( [ item( { id: '42' } ) ], { registry: undefined } );
		}
		// The library stage wires openVideoAnalytics to
		// `navigate( { href: '/video/{id}/analytics' } )`.
		expect( api.openVideoAnalytics ).toHaveBeenCalledWith( '42' );
		expect( api.openVideoDetails ).not.toHaveBeenCalled();
	} );
} );
