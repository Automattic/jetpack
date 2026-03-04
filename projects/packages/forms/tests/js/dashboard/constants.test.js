import { getFormStatusLabel } from '../../../src/dashboard/constants';

describe( 'getFormStatusLabel', () => {
	it.each( [
		[ 'publish', 'Published' ],
		[ 'draft', 'Draft' ],
		[ 'pending', 'Pending review' ],
		[ 'future', 'Scheduled' ],
		[ 'private', 'Private' ],
		[ 'trash', 'Trash' ],
	] )( 'returns "%s" label for "%s" status', ( status, expected ) => {
		expect( getFormStatusLabel( status ) ).toBe( expected );
	} );

	it( 'returns the raw status string for unknown statuses', () => {
		expect( getFormStatusLabel( 'custom-status' ) ).toBe( 'custom-status' );
	} );
} );
