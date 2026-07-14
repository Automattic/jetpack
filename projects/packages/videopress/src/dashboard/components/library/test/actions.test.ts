import { makeLibraryItem as item } from '../../../test-utils/library-item';
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
} );
