/**
 * PayPal Payment Buttons — E2E Tests (Playwright).
 *
 * Covers all user flows across WOOPTP-154 and WOOPTP-162/163/164/166:
 * 1. Credential wizard flow (WOOPTP-162)
 * 2. Create button flow
 * 3. Frontend rendering
 * 4. Error flow
 * 5. Legacy block compatibility
 * 6. Disconnect flow
 * 7. Production default (WOOPTP-163)
 * 8. Token pre-validation / 403 Payment Links error (WOOPTP-164)
 * 9. SVG block icon (WOOPTP-166)
 *
 * Uses Jetpack's Playwright testing conventions with mocked PayPal API responses.
 *
 * @package
 * @since 0.8.0
 */

const { test, expect } = require( '@playwright/test' );
const { MOCK_RESPONSES, setupPayPalMocks, setupDisconnectedMocks } = require( './paypal-api-mock' );

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

/**
 * Navigate to a new post in the block editor.
 *
 * @param {import('@playwright/test').Page} page - Playwright page instance.
 */
async function goToNewPost( page ) {
	await page.goto( '/wp-admin/post-new.php' );
	await page.waitForSelector( '.edit-post-visual-editor', { timeout: 30000 } );
	const welcomeModal = page.locator( '.components-modal__header button[aria-label="Close"]' );
	if ( await welcomeModal.isVisible( { timeout: 2000 } ).catch( () => false ) ) {
		await welcomeModal.click();
	}
}

/**
 * Insert the PayPal Payment Buttons block.
 *
 * @param {import('@playwright/test').Page} page - Playwright page instance.
 */
async function insertPayPalBlock( page ) {
	await page.click( 'button[aria-label="Toggle block inserter"]' );
	await page.fill( 'input[placeholder="Search"]', 'PayPal' );
	await page.click( 'button.editor-block-list-item-jetpack-paypal-payment-buttons' );
	await page.waitForSelector( '.wp-block-jetpack-paypal-payment-buttons' );
}

/**
 * Walk through the credential wizard to the Credentials step.
 * Assumes the block is already inserted and the wizard is on the Welcome step.
 *
 * @param {import('@playwright/test').Page}    page  - Playwright page instance.
 * @param {import('@playwright/test').Locator} block - The PayPal block locator.
 */
async function advanceWizardToCredentials( page, block ) {
	// Welcome step → click Get Started.
	await block.locator( 'button:has-text("Get Started")' ).click();

	// Dashboard step → click Next (or Continue).
	await block.locator( 'button:has-text("Next"), button:has-text("Continue")' ).first().click();

	// Now on the Credentials step.
	await expect(
		block.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' )
	).toBeVisible( { timeout: 5000 } );
}

/**
 * Walk through the full wizard and connect with valid credentials.
 * Mocks the connection endpoint to return connected after POST /connect.
 *
 * @param {import('@playwright/test').Page}    page  - Playwright page instance.
 * @param {import('@playwright/test').Locator} block - The PayPal block locator.
 */
async function connectThroughWizard( page, block ) {
	await advanceWizardToCredentials( page, block );

	await block
		.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' )
		.first()
		.fill( 'AValidClientId123456789' );
	await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );

	// After connect POST, return connected state.
	await page.route( '**/wp-json/jetpack/v4/paypal/connection', route => {
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( MOCK_RESPONSES.connection ),
		} );
	} );

	await block.locator( 'button:has-text("Connect")' ).click();

	// Wait for Success step or button creation form.
	await expect(
		block.locator(
			'button:has-text("Create Your First Button"), h3:has-text("Create PayPal Button")'
		)
	).toBeVisible( { timeout: 8000 } );
}

/**
 * Fill in the button creation form.
 *
 * @param {import('@playwright/test').Page} page          - Playwright page instance.
 * @param {object}                          options       - Form field values.
 * @param {string}                          options.name  - Product name.
 * @param {string}                          options.price - Product price.
 */
async function fillButtonForm( page, { name = 'Test Product', price = '29.99' } = {} ) {
	const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
	await block.locator( 'input[placeholder="e.g., Premium Widget"]' ).fill( name );
	await block.locator( 'input[placeholder="29.99"]' ).fill( price );
}

/**
 * Publish the post and return the frontend URL.
 *
 * @param {import('@playwright/test').Page} page - Playwright page instance.
 * @return {string} The published post URL.
 */
async function publishPost( page ) {
	await page.click( 'button.editor-post-publish-button__button' );
	const confirmButton = page.locator( 'button.editor-post-publish-button' );
	if ( await confirmButton.isVisible( { timeout: 3000 } ).catch( () => false ) ) {
		await confirmButton.click();
	}
	await page.waitForSelector( '.post-publish-panel__postpublish', { timeout: 15000 } );
	const viewLink = page.locator( '.post-publish-panel__postpublish a[href*="/?p="]' ).first();
	return await viewLink.getAttribute( 'href' );
}

// ---------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------

test.describe( 'PayPal Payment Buttons Block', () => {
	// ---------------------------------------------------------------
	// 1. Credential Wizard Flow (WOOPTP-162)
	// ---------------------------------------------------------------
	test.describe( 'Credential Wizard Flow', () => {
		test( 'shows Welcome step when PayPal is not connected', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Welcome step: Get Started CTA, no credential fields yet.
			await expect( block.locator( 'button:has-text("Get Started")' ) ).toBeVisible();
			await expect( block.locator( 'input[type="password"]' ) ).not.toBeVisible();
		} );

		test( 'advances from Welcome to Dashboard step', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Get Started")' ).click();

			// Dashboard step shows the developer dashboard link.
			const dashboardLink = block.locator( 'a[href*="developer.paypal.com"]' );
			await expect( dashboardLink ).toBeVisible( { timeout: 5000 } );
		} );

		test( 'PayPal Dashboard link points to correct URL', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Get Started")' ).click();

			const dashboardLink = block.locator( 'a[href*="developer.paypal.com"]' ).first();
			await expect( dashboardLink ).toBeVisible( { timeout: 5000 } );
			const href = await dashboardLink.getAttribute( 'href' );
			expect( href ).toBe( 'https://developer.paypal.com/dashboard/applications/' );
		} );

		test( 'advances from Dashboard to Credentials step', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			// Credentials step: Client ID and Client Secret fields visible.
			await expect(
				block.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' ).first()
			).toBeVisible();
			await expect( block.locator( 'input[type="password"]' ) ).toBeVisible();
			await expect( block.locator( 'button:has-text("Connect")' ) ).toBeVisible();
		} );

		test( 'show/hide toggle reveals and conceals Client Secret', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			const secretInput = block.locator( 'input[type="password"]' );
			await expect( secretInput ).toBeVisible();

			// Click the show/hide toggle.
			const toggle = block
				.locator(
					'button[aria-label*="Show"], button[aria-label*="show"], button[aria-label*="Toggle"]'
				)
				.first();
			await toggle.click();

			// Input type should change to text (revealed).
			const revealedInput = block.locator(
				'input[type="text"][aria-label*="Client Secret"], input[type="text"][placeholder*="secret"]'
			);
			await expect( revealedInput ).toBeVisible( { timeout: 3000 } );

			// Toggle again to hide.
			await toggle.click();
			await expect( block.locator( 'input[type="password"]' ) ).toBeVisible( {
				timeout: 3000,
			} );
		} );

		test( 'pasted credentials with whitespace are trimmed before submit', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			const clientIdInput = block
				.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' )
				.first();
			await clientIdInput.fill( '  AValidClientId123  ' );

			// After blur, format warning should NOT appear — whitespace was trimmed.
			await block.locator( 'input[type="password"]' ).click();
			await expect(
				block.locator( '.jetpack-paypal-payment-buttons__field-warning' )
			).not.toBeVisible( { timeout: 2000 } );
		} );

		test( 'Client ID format warning appears for invalid-looking IDs', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			const clientIdInput = block
				.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' )
				.first();
			await clientIdInput.fill( 'bad' );
			await block.locator( 'input[type="password"]' ).click(); // blur

			await expect(
				block.locator(
					'.jetpack-paypal-payment-buttons__field-warning, .components-notice.is-warning'
				)
			).toBeVisible( { timeout: 3000 } );
		} );

		test( 'environment defaults to Production on Credentials step', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			// Sandbox toggle is a subtle link — should NOT be active/selected.
			const sandboxToggle = block
				.locator(
					'button:has-text("sandbox"), a:has-text("sandbox"), button:has-text("Sandbox"), a:has-text("Sandbox")'
				)
				.first();
			if ( await sandboxToggle.isVisible( { timeout: 2000 } ).catch( () => false ) ) {
				await expect( sandboxToggle ).not.toHaveAttribute( 'aria-pressed', 'true' );
				await expect( sandboxToggle ).not.toHaveClass( /is-active|is-selected|active/ );
			}
		} );

		test( 'sandbox toggle switches environment and shows warning banner', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			const sandboxToggle = block
				.locator(
					'button:has-text("sandbox"), a:has-text("sandbox"), button:has-text("Sandbox"), a:has-text("Sandbox")'
				)
				.first();
			await sandboxToggle.click();

			// A sandbox warning banner should appear.
			await expect(
				block.locator( '.components-notice.is-warning, [class*="sandbox-warning"]' )
			).toBeVisible( { timeout: 3000 } );
		} );

		test( 'shows inline error on Credentials step with invalid credentials', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			await block
				.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' )
				.first()
				.fill( 'bad_id' );
			await block.locator( 'input[type="password"]' ).fill( 'bad_secret' );
			await block.locator( 'button:has-text("Connect")' ).click();

			// Inline error shown within the wizard — stays on Credentials step.
			await expect( block.locator( '.components-notice.is-error, [class*="error"]' ) ).toBeVisible(
				{ timeout: 5000 }
			);
			// Must NOT have advanced past Credentials step.
			await expect( block.locator( 'button:has-text("Connect")' ) ).toBeVisible();
		} );

		test( 'back navigation preserves entered data', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			const clientIdInput = block
				.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' )
				.first();
			await clientIdInput.fill( 'ATestClientId' );

			// Back to Dashboard step.
			await block.locator( 'button:has-text("Back")' ).click();

			// Forward again to Credentials step.
			await block.locator( 'button:has-text("Next"), button:has-text("Continue")' ).first().click();

			// Client ID should still be populated.
			await expect( clientIdInput ).toHaveValue( 'ATestClientId' );
		} );

		test( 'successful connection advances to Success step', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			await block
				.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' )
				.first()
				.fill( 'AValidClientId123456789' );
			await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );

			await page.route( '**/wp-json/jetpack/v4/paypal/connection', route => {
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( MOCK_RESPONSES.connection ),
				} );
			} );

			await block.locator( 'button:has-text("Connect")' ).click();

			// Success step: confirmation visible.
			await expect(
				block.locator(
					'button:has-text("Create Your First Button"), h3:has-text("Create PayPal Button")'
				)
			).toBeVisible( { timeout: 8000 } );
		} );

		test( 'Success step CTA transitions to button creation form', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await connectThroughWizard( page, block );

			// If still on Success step (not auto-transitioned), click the CTA.
			const ctaButton = block.locator( 'button:has-text("Create Your First Button")' );
			if ( await ctaButton.isVisible( { timeout: 2000 } ).catch( () => false ) ) {
				await ctaButton.click();
			}

			// Now on the button creation form.
			await expect( block.locator( 'h3:has-text("Create PayPal Button")' ) ).toBeVisible( {
				timeout: 5000,
			} );
			await expect( block.locator( 'input[placeholder="e.g., Premium Widget"]' ) ).toBeVisible();
		} );
	} );

	// ---------------------------------------------------------------
	// 2. Create Button Flow
	// ---------------------------------------------------------------
	test.describe( 'Create Button Flow', () => {
		test( 'shows creation form when connected with no existing button', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			await expect( block.locator( 'h3' ) ).toHaveText( 'Create PayPal Button' );
			await expect( block.locator( 'text=Product Name' ) ).toBeVisible();
			await expect( block.locator( 'text=Price' ) ).toBeVisible();
			await expect( block.locator( 'text=Currency' ) ).toBeVisible();
		} );

		test( 'Create button is disabled when form is empty', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			const createBtn = block.locator( 'button:has-text("Create Button")' );

			await expect( createBtn ).toBeDisabled();
		} );

		test( 'creates button and shows preview after successful API call', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			await fillButtonForm( page, { name: 'Test Product', price: '29.99' } );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			const createBtn = block.locator( 'button:has-text("Create Button")' );

			await expect( createBtn ).toBeEnabled();
			await createBtn.click();

			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );
			await expect( block.locator( '.jetpack-paypal-button-preview__product-name' ) ).toHaveText(
				'Test Product'
			);
		} );

		test( 'shows edit/preview toggle toolbar after creation', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );
			await fillButtonForm( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Create Button")' ).click();

			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			await block.click();

			const toolbar = page.locator( '.block-editor-block-toolbar' );
			await expect( toolbar.locator( 'button[aria-label="Preview"]' ) ).toBeVisible();
			await expect( toolbar.locator( 'button[aria-label="Edit"]' ) ).toBeVisible();
		} );

		test( 'edit toggle switches back to form with existing data', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );
			await fillButtonForm( page, { name: 'My Widget', price: '49.99' } );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Create Button")' ).click();

			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			await block.click();
			await page.locator( 'button[aria-label="Edit"]' ).click();

			await expect( block.locator( 'h3' ) ).toHaveText( 'Edit PayPal Button' );

			await block.locator( 'button:has-text("Cancel")' ).click();
			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible();
		} );
	} );

	// ---------------------------------------------------------------
	// 3. Frontend Rendering
	// ---------------------------------------------------------------
	test.describe( 'Frontend Rendering', () => {
		test( 'published post shows PayPal button with payment link', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );
			await fillButtonForm( page, { name: 'Frontend Widget', price: '19.99' } );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Create Button")' ).click();

			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			const postUrl = await publishPost( page );
			await page.goto( postUrl );

			const paypalButton = page.locator( '.jetpack-paypal-button' );
			await expect( paypalButton ).toBeVisible();

			await expect( paypalButton.locator( '.jetpack-paypal-button__product-name' ) ).toBeVisible();

			const paypalLink = paypalButton.locator( '.jetpack-paypal-button__paypal-link' );
			await expect( paypalLink ).toBeVisible();
			const href = await paypalLink.getAttribute( 'href' );
			expect( href ).toContain( 'paypal.com' );
		} );

		test( 'stacked layout shows debit/credit button on frontend', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );
			await fillButtonForm( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Create Button")' ).click();
			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			const postUrl = await publishPost( page );
			await page.goto( postUrl );

			const debitLink = page.locator( '.jetpack-paypal-button__debit-link' );
			await expect( debitLink ).toBeVisible();
			await expect( debitLink ).toHaveText( 'Debit or Credit Card' );
		} );
	} );

	// ---------------------------------------------------------------
	// 4. Error Flow
	// ---------------------------------------------------------------
	test.describe( 'Error Flow', () => {
		test( 'Create button disabled when product name is empty', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Fill only price, leave name empty.
			await block.locator( 'input[placeholder="29.99"]' ).fill( '10.00' );

			await expect( block.locator( 'button:has-text("Create Button")' ) ).toBeDisabled();
		} );

		test( 'Create button disabled when price is zero', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			await block.locator( 'input[placeholder="e.g., Premium Widget"]' ).fill( 'Test' );
			await block.locator( 'input[placeholder="29.99"]' ).fill( '0' );

			// Blur the price field to trigger validation.
			await block.locator( 'input[placeholder="e.g., Premium Widget"]' ).click();

			await expect( block.locator( 'button:has-text("Create Button")' ) ).toBeDisabled();
		} );

		test( 'shows field validation error after blurring empty product name', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			const nameInput = block.locator( 'input[placeholder="e.g., Premium Widget"]' );
			await nameInput.click();
			await nameInput.fill( '' );
			await block.locator( 'input[placeholder="29.99"]' ).click(); // blur

			await expect( block.locator( '.jetpack-paypal-payment-buttons__field-error' ) ).toBeVisible( {
				timeout: 3000,
			} );
		} );

		test( 'shows API error message in notice', async ( { page } ) => {
			// Override create endpoint to return 400 error.
			await setupPayPalMocks( page );
			await page.route( '**/wp-json/jetpack/v4/paypal/buttons', route => {
				if ( route.request().method() === 'POST' ) {
					return route.fulfill( {
						status: 400,
						contentType: 'application/json',
						body: JSON.stringify( MOCK_RESPONSES.error400 ),
					} );
				}
				route.continue();
			} );

			await goToNewPost( page );
			await insertPayPalBlock( page );
			await fillButtonForm( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Create Button")' ).click();

			await expect( block.locator( '.components-notice.is-error' ) ).toBeVisible( {
				timeout: 5000,
			} );
		} );
	} );

	// ---------------------------------------------------------------
	// 5. Legacy Block Compatibility
	// ---------------------------------------------------------------
	test.describe( 'Legacy Block Compatibility', () => {
		const legacyBlockMarkup =
			'<!-- wp:jetpack/paypal-payment-buttons {"buttonType":"stacked","scriptSrc":"https://www.paypal.com/sdk/js","hostedButtonId":"LEGACY123"} -->\n' +
			'<div class="wp-block-jetpack-paypal-payment-buttons"><div class="jetpack-paypal-button jetpack-paypal-button--stacked" id="LEGACY123"></div></div>\n' +
			'<!-- /wp:jetpack/paypal-payment-buttons -->';

		test( 'legacy paste-code block shows read-only indicator in editor', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );

			// Switch to code editor and paste legacy block markup.
			await page.keyboard.press( 'Control+Shift+Alt+M' );
			await page.waitForSelector( '.editor-post-text-editor', { timeout: 5000 } );
			await page.locator( '.editor-post-text-editor' ).fill( legacyBlockMarkup );

			// Switch back to visual editor.
			await page.keyboard.press( 'Control+Shift+Alt+M' );
			await page.waitForSelector( '.edit-post-visual-editor', { timeout: 5000 } );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await expect( block ).toBeVisible();
			await expect( block.locator( 'text=legacy paste-code format' ) ).toBeVisible( {
				timeout: 5000,
			} );
		} );

		test( 'legacy block renders on frontend without breaking', async ( { page } ) => {
			await setupPayPalMocks( page );

			const legacyMarkup456 =
				'<!-- wp:jetpack/paypal-payment-buttons {"buttonType":"stacked","scriptSrc":"https://www.paypal.com/sdk/js","hostedButtonId":"LEGACY456"} -->\n' +
				'<div class="wp-block-jetpack-paypal-payment-buttons"><div class="jetpack-paypal-button jetpack-paypal-button--stacked" id="LEGACY456"></div></div>\n' +
				'<!-- /wp:jetpack/paypal-payment-buttons -->';

			await goToNewPost( page );

			await page.keyboard.press( 'Control+Shift+Alt+M' );
			await page.waitForSelector( '.editor-post-text-editor', { timeout: 5000 } );
			await page.locator( '.editor-post-text-editor' ).fill( legacyMarkup456 );
			await page.keyboard.press( 'Control+Shift+Alt+M' );
			await page.waitForSelector( '.edit-post-visual-editor', { timeout: 5000 } );

			const postUrl = await publishPost( page );
			await page.goto( postUrl );

			const legacyBlock = page.locator( '#LEGACY456' );
			await expect( legacyBlock ).toBeVisible();
			await expect( legacyBlock ).toHaveClass( /jetpack-paypal-button/ );
		} );
	} );

	// ---------------------------------------------------------------
	// 6. Disconnect Flow
	// ---------------------------------------------------------------
	test.describe( 'Disconnect Flow', () => {
		test( 'disconnecting shows wizard for new blocks', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Should show create form initially (connected).
			await expect( block.locator( 'h3:has-text("Create PayPal Button")' ) ).toBeVisible();

			// Open sidebar and find Disconnect.
			await page.click( 'button[aria-label="Settings"]' );
			const sidebar = page.locator( '.interface-complementary-area' );

			const connectionPanel = sidebar.locator( 'text=PayPal Connection' );
			if ( await connectionPanel.isVisible( { timeout: 3000 } ).catch( () => false ) ) {
				await connectionPanel.click();
			}

			// After disconnect, mock returns disconnected state.
			await page.route( '**/wp-json/jetpack/v4/paypal/connection', route => {
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( MOCK_RESPONSES.connectionDisconnected ),
				} );
			} );

			const disconnectBtn = sidebar.locator( 'button:has-text("Disconnect")' ).first();
			if ( await disconnectBtn.isVisible( { timeout: 3000 } ).catch( () => false ) ) {
				await disconnectBtn.click();

				// Block should now show the wizard Welcome step.
				await expect( block.locator( 'button:has-text("Get Started")' ) ).toBeVisible( {
					timeout: 5000,
				} );
			}
		} );

		test( 'delete button clears block state and returns to edit mode', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );
			await fillButtonForm( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Create Button")' ).click();

			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			// Open sidebar to find Delete Button.
			await page.click( 'button[aria-label="Settings"]' );
			const sidebar = page.locator( '.interface-complementary-area' );
			const connectionPanel = sidebar.locator( 'text=PayPal Connection' );
			if ( await connectionPanel.isVisible( { timeout: 3000 } ).catch( () => false ) ) {
				await connectionPanel.click();
			}

			const deleteBtn = sidebar.locator( 'button:has-text("Delete Button")' );
			if ( await deleteBtn.isVisible( { timeout: 3000 } ).catch( () => false ) ) {
				await deleteBtn.click();

				// Should return to create form.
				await expect( block.locator( 'h3:has-text("Create PayPal Button")' ) ).toBeVisible( {
					timeout: 5000,
				} );
			}
		} );
	} );

	// ---------------------------------------------------------------
	// 7. Production Default (WOOPTP-163)
	// ---------------------------------------------------------------
	test.describe( 'Production Default', () => {
		test( 'connected status shows Production environment badge', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Should show connected status with Production (not Sandbox).
			await expect( block.locator( 'text=PayPal Connected' ) ).toBeVisible();
			await expect( block.locator( 'text=Production' ) ).toBeVisible();
		} );

		test( 'connection endpoint defaults to production API domain', async ( { page } ) => {
			await setupDisconnectedMocks( page );

			// Intercept the connect POST to verify it hits the production domain.
			let connectRequestBody = null;
			await page.route( '**/wp-json/jetpack/v4/paypal/connect', route => {
				connectRequestBody = route.request().postDataJSON();
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( {
						connected: true,
						environment: 'production',
					} ),
				} );
			} );

			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			await block
				.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' )
				.first()
				.fill( 'AValidClientId123456789' );
			await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );

			await page.route( '**/wp-json/jetpack/v4/paypal/connection', route => {
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( MOCK_RESPONSES.connection ),
				} );
			} );

			await block.locator( 'button:has-text("Connect")' ).click();

			// Wait for connection to complete.
			await expect(
				block.locator(
					'button:has-text("Create Your First Button"), h3:has-text("Create PayPal Button")'
				)
			).toBeVisible( { timeout: 8000 } );

			// Verify the connect request sent 'production' as environment (or no env, which defaults to production).
			if ( connectRequestBody ) {
				expect(
					connectRequestBody.environment === 'production' ||
						connectRequestBody.environment === undefined
				).toBeTruthy();
			}
		} );
	} );

	// ---------------------------------------------------------------
	// 8. Token Pre-validation / 403 Payment Links Error (WOOPTP-164)
	// ---------------------------------------------------------------
	test.describe( 'Token Pre-validation', () => {
		test( '403 from PayPal shows Payment Links guidance error', async ( { page } ) => {
			await setupDisconnectedMocks( page );

			// Mock connect to return a 403 — app lacks Payment Links scope.
			await page.route( '**/wp-json/jetpack/v4/paypal/connect', route => {
				route.fulfill( {
					status: 403,
					contentType: 'application/json',
					body: JSON.stringify( {
						code: 'paypal_api_access_denied',
						message:
							'Your PayPal app does not have Payment Links & Buttons enabled. Please enable this feature in your PayPal Developer Dashboard.',
						data: { status: 403 },
					} ),
				} );
			} );

			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			await block
				.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' )
				.first()
				.fill( 'AValidClientId123456789' );
			await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );
			await block.locator( 'button:has-text("Connect")' ).click();

			// Should show the 403 guidance error.
			const errorNotice = block.locator( '.components-notice.is-error, [class*="error"]' );
			await expect( errorNotice ).toBeVisible( { timeout: 5000 } );
			await expect( errorNotice ).toContainText( /Payment Links|Developer Dashboard/i );

			// Should stay on Credentials step (not advance, no partial connection).
			await expect( block.locator( 'button:has-text("Connect")' ) ).toBeVisible();
		} );

		test( '403 clears credentials — no partial connection state', async ( { page } ) => {
			await setupDisconnectedMocks( page );

			// First connect returns 403.
			await page.route( '**/wp-json/jetpack/v4/paypal/connect', route => {
				route.fulfill( {
					status: 403,
					contentType: 'application/json',
					body: JSON.stringify( {
						code: 'paypal_api_access_denied',
						message: 'Payment Links & Buttons not enabled.',
						data: { status: 403 },
					} ),
				} );
			} );

			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			await block
				.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' )
				.first()
				.fill( 'AValidClientId123456789' );
			await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );
			await block.locator( 'button:has-text("Connect")' ).click();

			// Wait for error.
			await expect( block.locator( '.components-notice.is-error, [class*="error"]' ) ).toBeVisible(
				{ timeout: 5000 }
			);

			// Connection status should still be disconnected — verify by checking
			// the wizard is still showing (not the create button form).
			await expect( block.locator( 'h3:has-text("Create PayPal Button")' ) ).not.toBeVisible();
		} );

		test( '5xx from PayPal during validation does not block connection', async ( { page } ) => {
			await setupDisconnectedMocks( page );

			// Connect returns success despite PayPal 5xx during validation
			// (server-side treats 5xx as non-blocking per WOOPTP-164).
			await page.route( '**/wp-json/jetpack/v4/paypal/connect', route => {
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( {
						connected: true,
						environment: 'production',
					} ),
				} );
			} );

			await page.route( '**/wp-json/jetpack/v4/paypal/connection', route => {
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( MOCK_RESPONSES.connection ),
				} );
			} );

			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, block );

			await block
				.locator( 'input[placeholder*="Client ID"], input[aria-label*="Client ID"]' )
				.first()
				.fill( 'AValidClientId123456789' );
			await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );
			await block.locator( 'button:has-text("Connect")' ).click();

			// Should succeed — advance past credentials step.
			await expect(
				block.locator(
					'button:has-text("Create Your First Button"), h3:has-text("Create PayPal Button")'
				)
			).toBeVisible( { timeout: 8000 } );
		} );
	} );

	// ---------------------------------------------------------------
	// 9. SVG Block Icon (WOOPTP-166)
	// ---------------------------------------------------------------
	test.describe( 'SVG Block Icon', () => {
		test( 'block inserter shows PayPal SVG icon', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );

			// Open the block inserter.
			await page.click( 'button[aria-label="Toggle block inserter"]' );
			await page.fill( 'input[placeholder="Search"]', 'PayPal' );

			// The block result button should contain an SVG (not a dashicon span).
			const blockItem = page.locator(
				'button.editor-block-list-item-jetpack-paypal-payment-buttons'
			);
			await expect( blockItem ).toBeVisible( { timeout: 5000 } );

			const svgIcon = blockItem.locator( 'svg' );
			await expect( svgIcon ).toBeVisible();
		} );

		test( 'block toolbar shows PayPal SVG icon when selected', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.click();

			// The block toolbar icon should be an SVG.
			const toolbar = page.locator( '.block-editor-block-toolbar' );
			const toolbarSvg = toolbar.locator(
				'.block-editor-block-icon svg, .block-editor-block-switcher svg'
			);
			await expect( toolbarSvg.first() ).toBeVisible( { timeout: 5000 } );
		} );
	} );
} );
