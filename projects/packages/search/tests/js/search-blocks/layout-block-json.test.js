// Guards the layout block.json contract. The width attributes are part of the
// public API (posts saved against one shape must keep rendering if defaults
// drift), and the dimension supports must stay declared — the forced-controls
// theme.json filter (Search_Blocks::force_search_layout_block_supports) only
// surfaces the UI; the block.json supports are what let the block serialize
// the values.

import blockJson from '../../../src/search-blocks/blocks/layout/block.json';

describe( 'layout block.json', () => {
	it( 'declares opt-in width + widthUnit attributes (no defaults)', () => {
		const attrs = blockJson.attributes;
		// No defaults: the (value, unit) pair only takes effect when the author
		// has set both halves, matching the render.php gate.
		expect( attrs.width ).toEqual( { type: 'number' } );
		expect( attrs.widthUnit ).toEqual( { type: 'string' } );
	} );

	it( 'declares spacing, border, dimensions, and constrained layout supports', () => {
		const supports = blockJson.supports;
		expect( supports.spacing ).toEqual( {
			padding: true,
			margin: true,
			blockGap: true,
		} );
		expect( supports.border ).toEqual( {
			color: true,
			radius: true,
			style: true,
			width: true,
		} );
		expect( supports.dimensions ).toEqual( { minHeight: true } );
		expect( supports.layout ).toEqual( { default: { type: 'constrained' } } );
	} );

	it( 'is a dynamic block with no front-end script/style bundle', () => {
		// Pure layout chrome: styles emit inline via supports + render.php, so it
		// ships no view module or stylesheet (no webpack entry without view.js).
		expect( blockJson.render ).toBe( 'file:./render.php' );
		expect( blockJson.viewScriptModule ).toBeUndefined();
		expect( blockJson.style ).toBeUndefined();
	} );
} );
