/**
 * `should_load_gutenberg_comments()` hard-returns false for blog 522232 — the blog the
 * jetpack.wordpress.com iframe runs as — so blocks reach Simple only. Pinning both halves
 * means milestone 3 flips `blocksEnabled` rather than rewriting the spec.
 */
import { test, expect } from '../fixtures';

test( 'the block editor loads where blocks are enabled', async ( { surface, verbum } ) => {
	test.skip( ! surface.blocksEnabled, `Blocks are disabled on the ${ surface.name } surface.` );

	await verbum.open( 'open_comments' );

	await expect( verbum.editorPlaceholder ).toBeVisible();
	await verbum.editorPlaceholder.click();
	await expect( verbum.blockEditor ).toBeVisible();
} );

test( 'the plain textarea is used where blocks are disabled', async ( { surface, verbum } ) => {
	test.skip( surface.blocksEnabled, `Blocks are enabled on the ${ surface.name } surface.` );

	await verbum.open( 'open_comments' );

	await expect( verbum.editorPlaceholder ).toHaveCount( 0 );
	await expect( verbum.textarea ).toBeVisible();
} );
