/**
 * External dependencies
 */
import { isPostDetailAvailable } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { toViewLiveUrl } from '../view-live-url';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	isPostDetailAvailable: jest.fn( () => true ),
} ) );

const mockIsPostDetailAvailable = jest.mocked( isPostDetailAvailable );

describe( 'toViewLiveUrl', () => {
	beforeEach( () => {
		mockIsPostDetailAvailable.mockReturnValue( true );
	} );

	it.each( [
		[ 'post', 42 ],
		[ 'video', '7' ],
	] as const )( 'returns the public URL of a %s row with a detail page', ( content, id ) => {
		expect( toViewLiveUrl( content, id, 'https://example.com/hello/' ) ).toBe(
			'https://example.com/hello/'
		);
	} );

	it.each( [
		[ 'no ID', undefined, 'https://example.com/hello/' ],
		[ 'the homepage ID', 0, 'https://example.com/' ],
		[ 'no URL', 42, null ],
		[ 'an unsupported scheme', 42, 'javascript:alert(1)' ],
		[ 'a wp-admin URL', 42, 'https://example.com/wp-admin/media.php?action=edit&attachment_id=42' ],
	] )( 'offers no action for a post row with %s', ( _, id, link ) => {
		expect( toViewLiveUrl( 'post', id, link ) ).toBeUndefined();
	} );

	it( 'offers no action when the reader cannot open post details, but still for videos', () => {
		mockIsPostDetailAvailable.mockReturnValue( false );

		expect( toViewLiveUrl( 'post', 42, 'https://example.com/hello/' ) ).toBeUndefined();
		expect( toViewLiveUrl( 'video', 42, 'https://example.com/launch/' ) ).toBe(
			'https://example.com/launch/'
		);
	} );
} );
