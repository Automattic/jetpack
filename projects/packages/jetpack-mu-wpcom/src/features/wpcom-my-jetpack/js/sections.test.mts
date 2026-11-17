import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { groupTools } from './sections.ts';
import type { Tool } from './types.ts';

/**
 * Build a tool the way PHP localizes it onto the page.
 *
 * @param key     - The tool's key.
 * @param section - The section PHP put it in.
 * @return The tool.
 */
function tool( key: string, section: string ): Tool {
	return { title: key, description: '', key, section, url: `https://example.com/${ key }` };
}

/**
 * The keys in each section, in page order.
 *
 * @param tools - The tools, in menu order.
 * @return Each section's key with its tools' keys.
 */
function layout( tools: Tool[] ) {
	return groupTools( tools ).map( section => [ section.key, section.tools.map( t => t.key ) ] );
}

describe( 'groupTools', () => {
	it( 'orders sections by the page, and tools within one by the menu', () => {
		assert.deepEqual(
			layout( [
				tool( 'newsletter', 'growth' ),
				tool( 'scan', 'security' ),
				tool( 'podcast', 'content' ),
				tool( 'backup', 'security' ),
			] ),
			[
				[ 'security', [ 'scan', 'backup' ] ],
				[ 'growth', [ 'newsletter' ] ],
				[ 'content', [ 'podcast' ] ],
			]
		);
	} );

	it( 'puts a tool in a section the page does not have under More', () => {
		assert.deepEqual( layout( [ tool( 'new', 'more' ), tool( 'odd', 'unknown' ) ] ), [
			[ 'more', [ 'new', 'odd' ] ],
		] );
	} );
} );
