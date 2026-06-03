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

	it( 'does NOT declare post-type scope attributes — scope lives on search-results, not the input', () => {
		// search-input is an entry point, not a boundary. Post-type scope is
		// an author-set property of the search-results block (the block that
		// frames what's being searched), mirroring how core's Query Loop block
		// owns its `postType` attribute. Removing the per-instance setting
		// here is part of consolidating to one mechanism.
		const attrs = blockJson.attributes;
		expect( attrs.postTypeMode ).toBeUndefined();
		expect( attrs.postTypes ).toBeUndefined();
	} );

	it( 'declares opt-in width + widthUnit attributes (no defaults — matches core/search)', () => {
		const attrs = blockJson.attributes;
		// No defaults: the (value, unit) pair only takes effect when the
		// author has set both halves, matching `render_block_core_search`'s
		// `! empty( $width ) && ! empty( $widthUnit )` gate.
		expect( attrs.width ).toEqual( { type: 'number' } );
		expect( attrs.widthUnit ).toEqual( { type: 'string' } );
	} );
} );
