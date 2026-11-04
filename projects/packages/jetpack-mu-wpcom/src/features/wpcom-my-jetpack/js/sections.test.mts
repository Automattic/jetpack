import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getSections, groupTools } from './sections.ts';
import type { Tool } from './types.ts';

/**
 * Build a tool the way PHP localizes it onto the page.
 *
 * @param icon - The tool's icon key, or '' for one without a description.
 * @return The tool.
 */
function tool( icon: string ): Tool {
	return { title: icon || 'Untitled', description: '', icon, url: `https://example.com/${ icon }` };
}

describe( 'groupTools', () => {
	it( 'puts each known tool in its section, in page order', () => {
		const sections = groupTools( [ tool( 'newsletter' ), tool( 'scan' ), tool( 'podcast' ) ] );

		assert.deepEqual(
			sections.map( section => [ section.key, section.tools.map( t => t.icon ) ] ),
			[
				[ 'security', [ 'scan' ] ],
				[ 'growth', [ 'newsletter' ] ],
				[ 'content', [ 'podcast' ] ],
			]
		);
	} );

	it( 'keeps menu order within a section', () => {
		const [ security ] = groupTools( [ tool( 'scan' ), tool( 'activity-log' ), tool( 'backup' ) ] );

		assert.deepEqual(
			security.tools.map( t => t.icon ),
			[ 'scan', 'activity-log', 'backup' ]
		);
	} );

	it( 'puts tools it does not know under More', () => {
		const sections = groupTools( [ tool( '' ), tool( 'something-new' ) ] );

		assert.equal( sections.length, 1 );
		assert.equal( sections[ 0 ].key, 'more' );
		assert.equal( sections[ 0 ].tools.length, 2 );
	} );

	it( 'drops sections with no tools', () => {
		assert.deepEqual( groupTools( [] ), [] );
	} );
} );

describe( 'getSections', () => {
	it( 'gives every section a title and blurb', () => {
		for ( const section of getSections() ) {
			assert.ok( section.title );
			assert.ok( section.blurb );
		}
	} );
} );
