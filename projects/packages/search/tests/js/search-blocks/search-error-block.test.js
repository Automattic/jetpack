// The search-error block's attribute defaults live in block.json. This test
// locks the `message` default in place so an accidental edit can't ship a
// non-empty default that would override every existing post's copy.
import blockJson from '../../../src/search-blocks/blocks/search-error/block.json';

describe( 'search-error block.json attributes', () => {
	it( 'declares a string `message` attribute with an empty default', () => {
		expect( blockJson.attributes.message ).toEqual( {
			type: 'string',
			default: '',
		} );
	} );
} );
