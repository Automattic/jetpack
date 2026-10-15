import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';

let postId: number | undefined;

test.beforeAll( async ( { testUtils } ) => {
	await testUtils.executeWpCommand( [ 'plugin', 'activate', 'e2e-comments-new-hotness' ] );
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
	await testUtils.executeWpCommand( [ 'plugin', 'deactivate', 'e2e-comments-new-hotness' ] );
} );

test.describe( 'Comments: Block editor', () => {
	test( 'Posts a comment with a paragraph, a list, and a quote', async ( {
		page,
		requestUtils,
	} ) => {
		const post: { id: number; link: string } = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/posts',
			data: { title: 'E2E Comments', status: 'publish' },
		} );
		postId = post.id;

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
				.toMatch( /Hello from E2E[\s\S]*<li>First item<\/li>[\s\S]*<blockquote[\s\S]*A quote/ );
		} );
	} );
} );
