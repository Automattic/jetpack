import {
	FORM_STATUSES,
	NON_TRASH_FORM_STATUSES,
	getFormStatusLabel,
} from '../../../src/dashboard/constants';

describe( 'FORM_STATUSES', () => {
	it( 'contains all expected statuses in order', () => {
		expect( FORM_STATUSES ).toEqual( [
			'all',
			'publish',
			'draft',
			'pending',
			'future',
			'private',
			'trash',
		] );
	} );
} );

describe( 'NON_TRASH_FORM_STATUSES', () => {
	it( 'is a comma-separated string excluding "all" and "trash"', () => {
		expect( NON_TRASH_FORM_STATUSES ).toBe( 'publish,draft,pending,future,private' );
	} );
} );

describe( 'getFormStatusLabel', () => {
	it.each( [
		[ 'all', 'All' ],
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
