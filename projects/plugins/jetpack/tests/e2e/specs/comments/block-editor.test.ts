import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';

let postId: number | undefined;

const IMAGE = 'https://example.com/e2e.png';
// A 1x1 PNG, so the image loads without the network.
const PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
	'base64'
);

test.beforeAll( async ( { testUtils } ) => {
	await testUtils.activateModule( 'comments' );
} );

test.afterAll( async ( { requestUtils, testUtils } ) => {
	if ( postId !== undefined ) {
		await requestUtils.rest( {
			method: 'DELETE',
			path: `/wp/v2/posts/${ postId }`,
			params: { force: true },
		} );
	}
	await testUtils.deactivateModule( 'comments' );
} );

test.describe( 'Comments: Block editor', () => {
	test( 'Posts a comment with a paragraph, a list, a quote, and an image', async ( {
		page,
		requestUtils,
	} ) => {
		const post: { id: number; link: string } = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/posts',
			data: { title: 'E2E Comments', status: 'publish' },
		} );
		postId = post.id;

		await page.route( IMAGE, route => route.fulfill( { contentType: 'image/png', body: PNG } ) );

		await test.step( 'Write the comment in the block editor', async () => {
			await page.goto( post.link );
			await page.getByRole( 'textbox', { name: 'Comment' } ).click();

			const editor = page.locator( '.jetpack-comments__editor' );
			await expect( editor.locator( '[contenteditable="true"]' ).first() ).toBeFocused();

			await page.keyboard.type( 'Hello from E2E' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( '- First item' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( '> A quote' );

			// A block that crashes on select takes the whole editor down to the plain textarea.
			await expect( editor.locator( '[data-type="core/list"]' ) ).toBeVisible();
			await expect( editor.locator( '[data-type="core/quote"]' ) ).toBeVisible();

			await page.getByRole( 'button', { name: 'Add block' } ).click();
			await page.getByRole( 'menuitem', { name: 'Image' } ).click();
			await editor.getByRole( 'textbox', { name: 'URL' } ).fill( IMAGE );
			await editor.getByRole( 'button', { name: 'Apply' } ).click();
			// A failed load clears the URL, so the image must actually draw.
			await expect( editor.locator( '[data-type="core/image"] img' ) ).toHaveJSProperty(
				'naturalWidth',
				1
			);
		} );

		await test.step( 'Post it', async () => {
			await page.getByRole( 'button', { name: 'Comment', exact: true } ).click();

			await expect
				.poll( async () => {
					const comments = await requestUtils.rest( {
						path: '/wp/v2/comments',
						params: { post: post.id, context: 'edit' },
					} );
					return comments[ 0 ]?.content.raw ?? '';
				} )
				.toMatch(
					/Hello from E2E[\s\S]*<li>First item<\/li>[\s\S]*<blockquote[\s\S]*A quote[\s\S]*<figure class="wp-block-image">https:\/\/example\.com\/e2e\.png<\/figure>/
				);
		} );
	} );
} );
