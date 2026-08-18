/**
 * `should_load_gutenberg_comments()` hard-returns false for blog 522232 — the blog the
 * jetpack.wordpress.com iframe runs as — so blocks reach Simple only. Pinning both halves
 * means milestone 3 flips `blocksEnabled` rather than rewriting the spec.
 */
import { test, expect } from '../fixtures';

test( 'the block editor loads where blocks are enabled', async ( { surface, verbum } ) => {
	test.skip( ! surface.blocksEnabled, `Blocks are disabled on the ${ surface.name } surface.` );

	await verbum.open( 'open_comments' );

	// Fails loudly when the site has `enable_blocks_comments` off, rather than timing out
	// below on a placeholder that was never going to render.
	expect( await verbum.blocksEnabled() ).toBe( true );

	await expect( verbum.editorPlaceholder ).toBeVisible();
	await verbum.editorPlaceholder.click();
	await expect( verbum.blockEditor ).toBeVisible();
} );

test( 'the plain textarea is used where blocks are disabled', async ( { surface, verbum } ) => {
	test.skip( surface.blocksEnabled, `Blocks are enabled on the ${ surface.name } surface.` );

	await verbum.open( 'open_comments' );

	// Asserting the placeholder is absent would pass before it could ever mount, so read
	// the flag it renders from instead.
	expect( await verbum.blocksEnabled() ).toBe( false );
	await expect( verbum.textarea ).toBeVisible();
} );
