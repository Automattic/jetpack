import { makeLibraryItem as item } from '../../../test-utils/library-item';
import { buildLibraryActions } from '../actions';

const makeApi = () => ( {
	promoteLocal: jest.fn(),
	retryUpload: jest.fn(),
	deleteItems: jest.fn(),
	setPrivacy: jest.fn(),
	openVideoDetails: jest.fn(),
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
