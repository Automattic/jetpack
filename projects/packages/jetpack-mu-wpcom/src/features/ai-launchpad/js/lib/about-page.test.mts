import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAboutPage } from './about-page.ts';

/**
 * Stub fetcher that records the request and returns a created page.
 *
 * @return The stub and its recorded requests.
 */
function stubFetcher() {
	const requests: object[] = [];
	const fetcher = async ( options: object ) => {
		requests.push( options );
		return { id: 42 };
	};
	return { fetcher, requests };
}

describe( 'createAboutPage', () => {
	it( 'creates a marked draft page from the AI draft, as escaped paragraph blocks', async () => {
		const { fetcher, requests } = stubFetcher();
		const result = await createAboutPage(
			{ title: 'About Alpine Notes', paragraphs: [ 'Who we are.', 'Come <hike> with us.' ] },
			fetcher
		);

		assert.deepEqual( result, { page_id: 42, edit_url: '/wp-admin/post.php?post=42&action=edit' } );
		const request = requests[ 0 ] as {
			path: string;
			method: string;
			data: { title: string; content: string; status: string; meta: object };
		};
		assert.equal( request.path, '/wp/v2/pages' );
		assert.equal( request.method, 'POST' );
		assert.equal( request.data.title, 'About Alpine Notes' );
		assert.equal( request.data.status, 'draft' );
		assert.deepEqual( request.data.meta, { _wpcom_ai_launchpad_about_page: true } );
		assert.match( request.data.content, /<!-- wp:paragraph --><p>Who we are\.<\/p>/ );
		// AI-drafted text must be escaped, never raw markup.
		assert.match( request.data.content, /Come &lt;hike&gt; with us\./ );
	} );

	it( 'creates an empty "About" shell when the output predates the draft field', async () => {
		const { fetcher, requests } = stubFetcher();
		const result = await createAboutPage( undefined, fetcher );

		assert.equal( result.page_id, 42 );
		const request = requests[ 0 ] as { data: { title: string; content: string } };
		assert.equal( request.data.title, 'About' );
		assert.equal( request.data.content, '' );
	} );
} );
