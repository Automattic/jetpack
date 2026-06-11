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
