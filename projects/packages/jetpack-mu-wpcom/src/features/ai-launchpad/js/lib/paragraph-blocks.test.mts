import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { blockAttributes, headingBlock, paragraphsToBlocks } from './paragraph-blocks.ts';

describe( 'paragraphsToBlocks', () => {
	it( 'wraps each paragraph in a paragraph block', () => {
		const blocks = paragraphsToBlocks( [ 'First.', 'Second.' ] );
		assert.equal(
			blocks,
			'<!-- wp:paragraph --><p>First.</p><!-- /wp:paragraph -->\n\n' +
				'<!-- wp:paragraph --><p>Second.</p><!-- /wp:paragraph -->'
		);
	} );

	it( 'escapes HTML-significant characters so drafted text cannot inject markup', () => {
		assert.equal(
			paragraphsToBlocks( [ 'a <script>alert(1)</script> & b' ] ),
			'<!-- wp:paragraph --><p>a &lt;script&gt;alert(1)&lt;/script&gt; &amp; b</p><!-- /wp:paragraph -->'
		);
	} );
} );

describe( 'headingBlock', () => {
	it( 'escapes translated heading text', () => {
		assert.equal(
			headingBlock( 'Scrivici <subito> & presto' ),
			'<!-- wp:heading --><h2 class="wp-block-heading">Scrivici &lt;subito&gt; &amp; presto</h2><!-- /wp:heading -->'
		);
	} );
} );

describe( 'blockAttributes', () => {
	it( 'escapes values that could close the block comment or break the JSON', () => {
		assert.equal(
			blockAttributes( { label: 'Nome "completo" -- <x> &', required: true } ),
			'{"label":"Nome \\u0022completo\\u0022 \\u002d\\u002d \\u003cx\\u003e \\u0026","required":true}'
		);
	} );
} );
