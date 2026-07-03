import { makeLibraryItem as item } from '../../../test-utils/library-item';
import { buildLibraryActions } from '../actions';

const makeApi = () => ( {
	promoteLocal: jest.fn(),
	retryUpload: jest.fn(),
	deleteItems: jest.fn(),
	setPrivacy: jest.fn(),
	openVideoDetails: jest.fn(),
	openVideoAnalytics: jest.fn(),
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

	it( 'makes a draft row ineligible for every action, including the Studio ones', () => {
		// Studio flag on so the gated actions (view-analytics, add-to-playlist)
		// are built too — drafts must fall out of the full set, not just the base.
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		const actions = buildLibraryActions( makeApi() );
		const draft = item( { type: 'draft', guid: '' } );

		expect( actions.length ).toBeGreaterThan( 0 );
		for ( const action of actions ) {
			expect( { id: action.id, eligible: action.isEligible?.( draft ) } ).toEqual( {
				id: action.id,
				eligible: false,
			} );
		}
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
