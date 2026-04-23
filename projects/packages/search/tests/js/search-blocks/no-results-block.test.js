// The no-results block's attribute defaults live in block.json. These
// tests lock the defaults in place so an accidental edit — e.g. flipping
// `showSearchAgainPrompt` on by default — can't ship unnoticed and change
// the rendering for every existing post.
import blockJson from '../../../src/search-blocks/blocks/no-results/block.json';

describe( 'no-results block.json attributes', () => {
	it( 'declares a string `message` attribute with an empty default', () => {
		expect( blockJson.attributes.message ).toEqual( {
			type: 'string',
			default: '',
		} );
	} );

	it( 'declares a boolean `showSearchAgainPrompt` attribute that defaults to false', () => {
		expect( blockJson.attributes.showSearchAgainPrompt ).toEqual( {
			type: 'boolean',
			default: false,
		} );
	} );
} );
