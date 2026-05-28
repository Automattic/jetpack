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

	it( 'declares the post-type scope attributes with exclude-by-default semantics', () => {
		const attrs = blockJson.attributes;
		expect( attrs.postTypeMode ).toEqual( {
			type: 'string',
			enum: [ 'include', 'exclude' ],
			default: 'exclude',
		} );
		expect( attrs.postTypes ).toEqual( {
			type: 'array',
			default: [],
			items: { type: 'string' },
		} );
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
