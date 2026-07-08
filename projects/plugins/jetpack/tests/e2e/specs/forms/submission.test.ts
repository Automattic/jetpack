import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import { Response } from '@playwright/test';

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
		feedbackSubmissions.map( ( feedback: { id: number } ) =>
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

/**
 * Checks whether the given response is a form submission response.
 *
 * @param response - The response to check.
 * @return Whether the response is a form submission response.
 */
function isFormSubmissionResponse( response: Response ) {
	const url = new URL( response.url() );

	return (
		url.pathname.includes( '/wp-admin/admin-ajax.php' ) &&
		response.request().method() === 'POST' &&
		url.searchParams.get( 'action' ) === 'grunion-contact-form'
	);
}

test.describe( 'Forms: Submission', () => {
	test( 'Submits a simple contact form', async ( { admin, editor } ) => {
		const formTitle = 'E2E Test Form';

		await test.step( 'Visit the block editor and insert a form', async () => {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'jetpack/contact-form',
				attributes: { formTitle },
				innerBlocks: [
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
				],
			} );
			const formBlock = editor.canvas.getByRole( 'document', { name: 'Block: Form' } );

			await expect( formBlock ).toBeVisible();
		} );

		await test.step( 'Visit the post on the frontend and submit the form', async () => {
			const previewPage = await editor.openPreviewPage();

			const form = previewPage.getByRole( 'form', { name: formTitle } );
			await form.getByRole( 'textbox', { name: 'Name' } ).fill( 'John Doe' );
			await form.getByRole( 'textbox', { name: 'Email' } ).fill( 'john@doe.com' );
			await form.getByRole( 'textbox', { name: 'Message' } ).fill( 'Hello, world!' );
			// Wait for the form submission to complete.
			const submissionPromise = previewPage.waitForResponse( isFormSubmissionResponse );
			await form.getByRole( 'button', { name: 'Contact Us' } ).click();
			await submissionPromise;

			await expect(
				previewPage.getByRole( 'heading', { name: 'Thank you for your response.' } )
			).toBeVisible();

			// The form should disappear after submission.
			await expect( form ).toBeHidden();

			// The success wrapper should appear after submission.
			const successWrapper = previewPage.locator( '.contact-form-submission' );
			await expect( successWrapper ).toBeVisible();

			// The form contents should be visible in the success wrapper.
			// Use locator with :visible to avoid matching both hidden and visible elements
			// (the template has both .field-value and .field-url with the same text content).
			await expect(
				successWrapper.locator( '.field-value:visible, .field-url:visible' ).getByText( 'John Doe' )
			).toBeVisible();
			await expect(
				successWrapper
					.locator( '.field-value:visible, .field-url:visible' )
					.getByText( 'john@doe.com' )
			).toBeVisible();
			await expect(
				successWrapper
					.locator( '.field-value:visible, .field-url:visible' )
					.getByText( 'Hello, world!' )
			).toBeVisible();
		} );
	} );

	test( 'Submits the correct from when multiple forms are on the same page', async ( {
		admin,
		editor,
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
			const previewPage = await editor.openPreviewPage();

			const formToSubmit = previewPage.getByRole( 'form', { name: 'Submit this form' } );
			// Get the form ID from the wrapping element, this will allow us to check the contents
			// of the exact form that was submitted after submission.
			const formId = await previewPage
				.locator( '.jetpack-contact-form-container' )
				.filter( { has: formToSubmit } )
				.getAttribute( 'id' );
			await formToSubmit.getByRole( 'textbox', { name: 'Name' } ).fill( 'John Doe' );
			await formToSubmit.getByRole( 'textbox', { name: 'Email' } ).fill( 'john@doe.com' );
			await formToSubmit.getByRole( 'textbox', { name: 'Message' } ).fill( 'Hello, world!' );
			// Wait for the form submission to complete.
			const submissionPromise = previewPage.waitForResponse( isFormSubmissionResponse );
			await formToSubmit.getByRole( 'button', { name: 'Contact Us' } ).click();
			await submissionPromise;

			// Check the correct form was submitted.
			const submittedFormWrapper = previewPage.locator( `#${ formId }` );
			await expect(
				submittedFormWrapper.getByRole( 'heading', { name: 'Thank you for your response.' } )
			).toBeVisible();

			const submittedForm = submittedFormWrapper.getByRole( 'form', { name: 'Submit this form' } );

			// The form should disappear after submission.
			await expect( submittedForm ).toBeHidden();

			// The success wrapper should appear after submission.
			const successWrapper = submittedFormWrapper.locator( '.contact-form-submission' );
			await expect( successWrapper ).toBeVisible();

			await expect(
				successWrapper.locator( '.field-value:visible, .field-url:visible' ).getByText( 'John Doe' )
			).toBeVisible();
			await expect(
				successWrapper
					.locator( '.field-value:visible, .field-url:visible' )
					.getByText( 'john@doe.com' )
			).toBeVisible();
			await expect(
				successWrapper
					.locator( '.field-value:visible, .field-url:visible' )
					.getByText( 'Hello, world!' )
			).toBeVisible();

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
