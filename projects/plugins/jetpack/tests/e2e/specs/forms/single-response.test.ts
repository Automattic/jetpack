import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';

const FIELD_COUNT = 30;

test.use( { viewport: { width: 1280, height: 720 } } );

test.afterEach( async ( { requestUtils } ) => {
	const feedbackSubmissions = await requestUtils.rest( {
		path: '/wp/v2/feedback',
		params: { per_page: 100, status: 'publish,future,draft,pending,private,trash' },
	} );

	await Promise.all(
		feedbackSubmissions.map( ( feedback: { id: number } ) =>
			requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/feedback/${ feedback.id }`,
				params: { force: true },
			} )
		)
	);
} );

test.describe( 'Forms: Single response page', () => {
	test( 'Scrolls a response taller than the viewport down to its last field', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const formTitle = 'E2E Tall Form';

		await test.step( 'Insert a form with many fields', async () => {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'jetpack/contact-form',
				attributes: { formTitle },
				innerBlocks: [
					...Array.from( { length: FIELD_COUNT }, () => ( { name: 'jetpack/field-text' } ) ),
					{ name: 'jetpack/button', attributes: { element: 'button', text: 'Submit' } },
				],
			} );
		} );

		await test.step( 'Submit the form on the frontend', async () => {
			const previewPage = await editor.openPreviewPage();
			const form = previewPage.getByRole( 'form', { name: formTitle } );
			const textboxes = form.getByRole( 'textbox' );
			await expect( textboxes ).toHaveCount( FIELD_COUNT );

			for ( let i = 0; i < FIELD_COUNT; i++ ) {
				await textboxes.nth( i ).fill( `Answer ${ i + 1 }` );
			}
			await form.getByRole( 'button', { name: 'Submit' } ).click();
			await expect(
				previewPage.getByRole( 'heading', { name: 'Thank you for your response.' } )
			).toBeVisible();
		} );

		await test.step( 'Scroll the single response page to the last field', async () => {
			const [ feedback ] = await requestUtils.rest( { path: '/wp/v2/feedback' } );
			await admin.visitAdminPage(
				'admin.php',
				`page=jetpack-forms-responses-wp-admin&p=${ encodeURIComponent( `/response/${ feedback.id }` ) }`
			);

			const card = page.locator( '.jp-forms__single-response-card' );
			const lastAnswer = card.getByText( `Answer ${ FIELD_COUNT }`, { exact: true } );
			await expect( lastAnswer ).toBeAttached();
			await expect( lastAnswer ).not.toBeInViewport();

			// Wheel like a user would: `scrollIntoView()` can scroll the card's
			// `overflow: hidden` box programmatically and would hide the bug.
			await card.hover();
			await page.mouse.wheel( 0, 10000 );
			await expect( lastAnswer ).toBeInViewport();
		} );
	} );
} );
