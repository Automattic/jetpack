import { Plans, prerequisitesBuilder } from '_jetpack-e2e-commons/env/index.js';
import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.js';
import playwrightConfig from '../../playwright.config.mjs';

test.beforeAll( async ( { browser } ) => {
	const page = await browser.newPage( playwrightConfig.use );
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.withConnection( true )
		.withPlan( Plans.Free )
		.build();
	await page.close();
} );

test.afterEach( async ( { requestUtils } ) => {
	// List all feedback submissions.
	// https://developer.wordpress.org/rest-api/reference/posts/#list-posts
	const feedbackSubmissions = await requestUtils.rest( {
		path: '/wp/v2/feedback',
		params: {
			per_page: 100,
			// All possible statuses.
			status: 'publish,future,draft,pending,private,trash',
		},
	} );

	// Delete all feedback submissions one by one.
	// https://developer.wordpress.org/rest-api/reference/posts/#delete-a-post
	// "/wp/v2/feedback" does not yet support batch requests.
	await Promise.all(
		feedbackSubmissions.map( feedback =>
			requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/feedback/${ feedback.id }`,
				params: {
					force: true,
				},
			} )
		)
	);
} );

test.describe( 'Forms: Submission', () => {
	test( 'Submits a simple contact form', async ( { admin, editor, page } ) => {
		const formTitle = 'E2E Test Form';
		await test.step( 'Visit the block editor and insert a form', async () => {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'jetpack/contact-form',
				attributes: { formTitle },
			} );
			const formBlock = editor.canvas.getByRole( 'document', { name: 'Block: Form' } );
			await formBlock.getByRole( 'button', { name: 'Add a contact form to your page.' } ).click();

			await expect( formBlock ).toBeVisible();
		} );

		await test.step( 'Visit the post on the frontend and submit the form', async () => {
			const editorPage = page;
			const previewPage = await editor.openPreviewPage( editorPage );

			const form = previewPage.getByRole( 'form', { name: formTitle } );
			await form.getByRole( 'textbox', { name: 'Name' } ).fill( 'John Doe' );
			await form.getByRole( 'textbox', { name: 'Email' } ).fill( 'john@doe.com' );
			await form.getByRole( 'textbox', { name: 'Message' } ).fill( 'Hello, world!' );
			await form.getByRole( 'button', { name: 'Contact Us' } ).click();

			await expect(
				previewPage.getByRole( 'heading', { name: 'Your message has been sent' } )
			).toBeVisible();
			await expect( previewPage.getByText( 'John Doe' ) ).toBeVisible();
			await expect( previewPage.getByText( 'john@doe.com' ) ).toBeVisible();
			await expect( previewPage.getByText( 'Hello, world!' ) ).toBeVisible();
		} );
	} );

	test( 'Submits the correct from when multiple forms are on the same page', async ( {
		admin,
		editor,
		page,
	} ) => {
		const contactFormInnerBlocks = [
			{
				name: 'jetpack/field-name',
				attributes: { required: true },
			},
			{
				name: 'jetpack/field-email',
				attributes: { required: true },
			},
			{
				name: 'jetpack/field-textarea',
			},
			{
				name: 'jetpack/button',
				attributes: { element: 'button', text: 'Contact Us' },
			},
		];

		await test.step( 'Visit the block editor and insert three forms', async () => {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'jetpack/contact-form',
				attributes: { formTitle: 'First form' },
				innerBlocks: contactFormInnerBlocks,
			} );
			await editor.insertBlock( {
				name: 'jetpack/contact-form',
				attributes: { formTitle: 'Submit this form' },
				innerBlocks: contactFormInnerBlocks,
			} );
			await editor.insertBlock( {
				name: 'jetpack/contact-form',
				attributes: { formTitle: 'Last form' },
				innerBlocks: contactFormInnerBlocks,
			} );

			const formBlock = editor.canvas.getByRole( 'document', { name: 'Block: Form' } );
			await expect( formBlock ).toHaveCount( 3 );
		} );

		await test.step( 'Visit the post on the frontend and submit one of the forms', async () => {
			const editorPage = page;
			const previewPage = await editor.openPreviewPage( editorPage );

			const formToSubmit = previewPage.getByRole( 'form', { name: 'Submit this form' } );
			// Get the form ID from the wrapping element, this will allow us to check the contents
			// of the exact form that was submitted after submission.
			const formId = await previewPage
				.locator( '.wp-block-jetpack-contact-form-container' )
				.filter( { has: formToSubmit } )
				.getAttribute( 'id' );
			await formToSubmit.getByRole( 'textbox', { name: 'Name' } ).fill( 'John Doe' );
			await formToSubmit.getByRole( 'textbox', { name: 'Email' } ).fill( 'john@doe.com' );
			await formToSubmit.getByRole( 'textbox', { name: 'Message' } ).fill( 'Hello, world!' );
			await formToSubmit.getByRole( 'button', { name: 'Contact Us' } ).click();

			// Check the correct form was submitted.
			const submittedForm = previewPage.locator( `#${ formId }` );
			await expect(
				submittedForm.getByRole( 'heading', { name: 'Your message has been sent' } )
			).toBeVisible();
			await expect( submittedForm.getByText( 'John Doe' ) ).toBeVisible();
			await expect( submittedForm.getByText( 'john@doe.com' ) ).toBeVisible();
			await expect( submittedForm.getByText( 'Hello, world!' ) ).toBeVisible();

			// Check the other forms were not submitted.
			const firstForm = previewPage.getByRole( 'form', { name: 'First form' } );
			await expect( firstForm.getByRole( 'textbox' ) ).toHaveCount( 3 );
			await expect( firstForm.getByRole( 'button', { name: 'Contact Us' } ) ).toBeVisible();
			const lastForm = previewPage.getByRole( 'form', { name: 'Last form' } );
			await expect( lastForm.getByRole( 'textbox' ) ).toHaveCount( 3 );
			await expect( lastForm.getByRole( 'button', { name: 'Contact Us' } ) ).toBeVisible();
		} );
	} );
} );
