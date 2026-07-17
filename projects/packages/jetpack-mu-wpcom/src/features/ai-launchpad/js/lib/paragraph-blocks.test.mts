import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { paragraphsToBlocks } from './paragraph-blocks.ts';

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
		const blocks = paragraphsToBlocks( [ 'a <script>alert(1)</script> & b' ] );
		assert.ok( ! blocks.includes( '<script>' ), 'raw tags must not survive' );
		assert.ok( blocks.includes( '&lt;script&gt;' ) );
		assert.ok( blocks.includes( '&amp; b' ) );
	} );
} );
