import {
	getPaddingTop,
	getSelectedGifAttributes,
	getUrl,
	splitStringAndReturnLastItem,
} from '../utils';

describe( 'Gif Block utils', () => {
	const TUMBLR_ITEM = {
		media: [ { url: 'fuzz', height: 10, width: 10 } ],
		attribution: { blog: { name: 'Tumblr Blog' }, url: 'https://tumblr.com' },
		embed_url: 'https://embed.tumblr.com/embed/post/1234567890/12345/123123/gif',
	};

	describe( 'getUrl', () => {
		test( 'returns search URL', async () => {
			await expect( getUrl( 'bubble tea' ) ).resolves.toBe(
				'/wpcom/v2/tumblr-gifs/search/bubble%20tea'
			);
		} );
	} );

	describe( 'getPaddingTop', () => {
		test( 'returns padding as a percentage', () => {
			expect( getPaddingTop( TUMBLR_ITEM.media[ 0 ] ) ).toBe( '100%' );
		} );
	} );

	describe( 'splitStringAndReturnLastItem', () => {
		test( 'returns the last item from a split string', () => {
			expect( splitStringAndReturnLastItem( 'the-night-was-dark-and-stormy', '-' ) ).toBe(
				'stormy'
			);
		} );
	} );

	describe( 'getSelectedGifAttributes', () => {
		test( 'returns expected object', () => {
			expect( getSelectedGifAttributes( TUMBLR_ITEM ) ).toStrictEqual( {
				gifUrl: TUMBLR_ITEM.embed_url,
				paddingTop: getPaddingTop( TUMBLR_ITEM.media[ 0 ] ),
			} );
		} );
	} );
} );
