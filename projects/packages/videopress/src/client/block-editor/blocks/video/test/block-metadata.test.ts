import metadata from '../block.json';

describe( 'videopress/video block metadata', () => {
	it( 'plays in the page unless the block says otherwise', () => {
		// The server fills a block's missing attributes from here before it
		// renders, so this default is what a block that never touched the
		// "Play Inline" switch gets on the front end.
		expect( metadata.attributes.playsinline ).toEqual( {
			type: 'boolean',
			default: true,
		} );
	} );
} );
