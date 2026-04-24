// Guards the search-input block.json contract. Attribute names and defaults
// are part of the public API: posts saved against one shape must keep
// rendering correctly if the defaults drift, so we pin them here rather than
// relying on spot-checks in render.php tests.

import blockJson from '../../../src/search-blocks/blocks/search-input/block.json';

describe( 'search-input block.json', () => {
	it( 'declares the three authoring attributes with the documented defaults', () => {
		const attrs = blockJson.attributes;
		expect( attrs.placeholder ).toEqual( { type: 'string', default: '' } );
		expect( attrs.showIcon ).toEqual( { type: 'boolean', default: true } );
		expect( attrs.submitOnly ).toEqual( { type: 'boolean', default: false } );
	} );
} );
