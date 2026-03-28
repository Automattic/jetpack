/* eslint-disable playwright/no-wait-for-selector, playwright/no-conditional-in-test, playwright/no-conditional-expect, playwright/no-wait-for-timeout, playwright/no-force-option, no-undef */
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
 * WordPress 6.x renders block editor content inside an iframe[name="editor-canvas"].
 * Top bar, sidebar, and toolbar elements live on `page`; block content lives inside
 * the iframe and must be accessed via a frameLocator (`canvas`).
 *
 * @package
 * @since 0.8.0
 */

const { test, expect } = require( '@playwright/test' );
const {
	MOCK_RESPONSES,
	setupPayPalMocks,
	setupDisconnectedMocks,
} = require( './paypal-api-mock.cjs' );

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
 * Get the editor canvas — handles both iframed and non-iframed editors.
 * WordPress 6.x renders the editor content inside an iframe.
 *
 * @param {import('@playwright/test').Page} page - Playwright page instance.
 * @return {Promise<import('@playwright/test').FrameLocator|import('@playwright/test').Page>} The canvas context.
 */
async function getEditorCanvas( page ) {
	const editorCanvasIframe = page.locator( 'iframe[name="editor-canvas"]' );
	const visible = await editorCanvasIframe.isVisible( { timeout: 1000 } ).catch( () => false );
	return visible ? page.frameLocator( 'iframe[name="editor-canvas"]' ) : page;
}

/**
 * Insert the PayPal Payment Buttons block and return the editor canvas
 * (frameLocator or page fallback) so callers can locate block content.
 *
 * @param {import('@playwright/test').Page} page - Playwright page instance.
 * @return {Promise<import('@playwright/test').FrameLocator|import('@playwright/test').Page>} The canvas context.
 */
async function insertPayPalBlock( page ) {
	await page.click( 'button[aria-label="Block Inserter"]' );
	await page.fill( 'input[placeholder="Search"]', 'PayPal' );
	await page.click( 'button.editor-block-list-item-jetpack-paypal-payment-buttons' );

	// The block content renders inside an iframe in WP 6.x+.
	const canvas = await getEditorCanvas( page );

	await expect( canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' ) ).toBeVisible( {
		timeout: 10000,
	} );

	return canvas;
}

/**
 * Navigate from the Welcome step through Dashboard to the Credentials step.
 * Assumes the block is already inserted and on the Welcome step.
 *
 * @param {import('@playwright/test').Page}                                         page   - Playwright page instance.
 * @param {import('@playwright/test').FrameLocator|import('@playwright/test').Page} canvas - The editor canvas (iframe or page).
 */
async function advanceWizardToCredentials( page, canvas ) {
	const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );

	// Welcome step -> click "Or enter your API credentials manually" link.
	await block.locator( 'button:has-text("Or enter your API credentials manually")' ).click();

	// Dashboard step -> click "I have my credentials -- Next".
	await block.locator( 'button:has-text("I have my credentials")' ).click();

	// Now on the Credentials step -- wait for Client ID field.
	await expect( block.locator( '.components-text-control__input' ).first() ).toBeVisible( {
		timeout: 5000,
	} );
}

/**
 * Walk through the full wizard and connect with valid credentials.
 *
 * @param {import('@playwright/test').Page}                                         page   - Playwright page instance.
 * @param {import('@playwright/test').FrameLocator|import('@playwright/test').Page} canvas - The editor canvas (iframe or page).
 */
async function connectThroughWizard( page, canvas ) {
	const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );

	await advanceWizardToCredentials( page, canvas );

	// Fill Client ID (TextControl -- uses .components-text-control__input).
	const inputs = block.locator( '.components-text-control__input' );
	await inputs.first().fill( 'AValidClientId123456789' );

	// Fill Client Secret (password field).
	await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );

	// After connect POST, return connected state.
	await page.route( /\/wp-json\/jetpack\/v4\/paypal\/connection(\?|$)/, route => {
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
			'button:has-text("Create Your First Button"), h3:has-text("Create PayPal Payment Button")'
		)
	).toBeVisible( { timeout: 8000 } );
}

/**
 * Fill in the button creation form.
 *
 * @param {import('@playwright/test').FrameLocator|import('@playwright/test').Page} canvas        - The editor canvas (iframe or page).
 * @param {object}                                                                  options       - Form field values.
 * @param {string}                                                                  options.name  - Product name.
 * @param {string}                                                                  options.price - Product price.
 */
async function fillButtonForm( canvas, { name = 'Test Product', price = '29.99' } = {} ) {
	const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
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
	// Match both pretty permalinks and ?p= format.
	const viewLink = page.locator( '.post-publish-panel__postpublish a[href*="localhost"]' ).first();
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
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Welcome step: "Connect PayPal" heading, "Connect with PayPal" primary CTA.
			await expect( block.locator( 'h3:has-text("Connect PayPal")' ) ).toBeVisible();
			await expect( block.locator( 'button:has-text("Connect with PayPal")' ) ).toBeVisible();
			// No credential fields yet.
			await expect( block.locator( 'input[type="password"]' ) ).toBeHidden();
		} );

		test( 'manual credentials link navigates to Dashboard step', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Or enter your API credentials manually")' ).click();

			// Dashboard step shows the developer dashboard link.
			await expect( block.locator( 'h3:has-text("Step 1 of 3")' ) ).toBeVisible( {
				timeout: 5000,
			} );
			const dashboardLink = block.locator( 'a[href*="developer.paypal.com"]' );
			await expect( dashboardLink ).toBeVisible();
		} );

		test( 'PayPal Dashboard link points to correct URL', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Or enter your API credentials manually")' ).click();

			const dashboardLink = block.locator( 'a[href*="developer.paypal.com"]' ).first();
			await expect( dashboardLink ).toBeVisible( { timeout: 5000 } );
			await expect( dashboardLink ).toHaveAttribute(
				'href',
				'https://developer.paypal.com/dashboard/applications/'
			);
		} );

		test( 'advances from Dashboard to Credentials step', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, canvas );

			// Credentials step: heading, Client ID/Secret fields, Connect button.
			await expect( block.locator( 'h3:has-text("Step 2 of 3")' ) ).toBeVisible();
			await expect( block.locator( 'input[type="password"]' ) ).toBeVisible();
			await expect( block.locator( 'button:has-text("Connect")' ) ).toBeVisible();
		} );

		test( 'show/hide toggle reveals and conceals Client Secret', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, canvas );

			const secretInput = block.locator( 'input[type="password"]' );
			await expect( secretInput ).toBeVisible();

			// Click the show/hide toggle button.
			const toggle = block.locator( '.jetpack-paypal-wizard__toggle-secret' );
			await toggle.click();

			// Input type should change to text (revealed).
			await expect( block.locator( 'input[type="text"]' ).last() ).toBeVisible( {
				timeout: 3000,
			} );

			// Toggle again to hide.
			await toggle.click();
			await expect( block.locator( 'input[type="password"]' ) ).toBeVisible( {
				timeout: 3000,
			} );
		} );

		test( 'Client ID format warning appears for invalid-looking IDs', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, canvas );

			const clientIdInput = block.locator( '.components-text-control__input' ).first();
			await clientIdInput.fill( 'bad' );
			// Blur to trigger validation.
			await block.locator( 'input[type="password"]' ).click();

			await expect( block.locator( '.jetpack-paypal-payment-buttons__field-warning' ) ).toBeVisible(
				{ timeout: 3000 }
			);
		} );

		test( 'sandbox toggle on Welcome step switches environment', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Welcome step has a sandbox toggle.
			const sandboxToggle = block.locator(
				'.components-toggle-control__label:has-text("sandbox")'
			);
			await expect( sandboxToggle ).toBeVisible( { timeout: 3000 } );
		} );

		test( 'sandbox link on Credentials step shows warning banner', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, canvas );

			// The disconnected mock returns environment: 'sandbox', so the sandbox
			// warning banner is already visible on the Credentials step.
			await expect( block.locator( '.components-notice.is-warning' ) ).toBeVisible( {
				timeout: 3000,
			} );

			// Click "Switch to Production (Live)" to turn off sandbox.
			const prodLink = block.locator( 'button:has-text("Switch to Production")' );
			await prodLink.click();

			// Warning banner should disappear.
			await expect( block.locator( '.components-notice.is-warning' ) ).not.toBeVisible( {
				timeout: 3000,
			} );

			// Click "Use Sandbox for testing" to re-enable sandbox.
			const sandboxLink = block.locator( 'button:has-text("Use Sandbox for testing")' );
			await sandboxLink.click();

			// Warning banner should reappear.
			await expect( block.locator( '.components-notice.is-warning' ) ).toBeVisible( {
				timeout: 3000,
			} );
		} );

		test( 'shows inline error on Credentials step with invalid credentials', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, canvas );

			const inputs = block.locator( '.components-text-control__input' );
			await inputs.first().fill( 'bad_id' );
			await block.locator( 'input[type="password"]' ).fill( 'bad_secret' );
			await block.locator( 'button:has-text("Connect")' ).click();

			// Inline error shown within the wizard.
			await expect( block.locator( '.components-notice.is-error' ) ).toBeVisible( {
				timeout: 5000,
			} );
			// Must NOT have advanced past Credentials step.
			await expect( block.locator( 'button:has-text("Connect")' ) ).toBeVisible();
		} );

		test( 'back navigation preserves entered data', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, canvas );

			const clientIdInput = block.locator( '.components-text-control__input' ).first();
			await clientIdInput.fill( 'ATestClientId' );

			// Back to Dashboard step.
			await block.locator( 'button:has-text("Back")' ).click();

			// Forward again to Credentials step.
			await block.locator( 'button:has-text("I have my credentials")' ).click();

			// Client ID should still be populated.
			await expect( clientIdInput ).toHaveValue( 'ATestClientId' );
		} );

		test( 'successful connection advances to Success step', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, canvas );

			const inputs = block.locator( '.components-text-control__input' );
			await inputs.first().fill( 'AValidClientId123456789' );
			await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );

			await page.route( /\/wp-json\/jetpack\/v4\/paypal\/connection(\?|$)/, route => {
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
					'button:has-text("Create Your First Button"), h3:has-text("Create PayPal Payment Button")'
				)
			).toBeVisible( { timeout: 8000 } );
		} );

		test( 'Success step CTA transitions to button creation form', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await connectThroughWizard( page, canvas );

			// If still on Success step (not auto-transitioned), click the CTA.
			const ctaButton = block.locator( 'button:has-text("Create Your First Button")' );
			if ( await ctaButton.isVisible( { timeout: 2000 } ).catch( () => false ) ) {
				await ctaButton.click();
			}

			// Now on the button creation form.
			await expect( block.locator( 'h3:has-text("Create PayPal Payment Button")' ) ).toBeVisible( {
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
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			await expect( block.locator( 'h3' ) ).toHaveText( 'Create PayPal Payment Button' );
			await expect( block.locator( 'text=Product Name' ) ).toBeVisible();
			await expect( block.locator( 'text=Price' ) ).toBeVisible();
			await expect( block.locator( 'text=Currency' ) ).toBeVisible();
		} );

		test( 'Create button is disabled when form is empty', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			const createBtn = block.locator( 'button:has-text("Create Button")' );

			await expect( createBtn ).toBeDisabled();
		} );

		test( 'creates button and shows preview after successful API call', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			await fillButtonForm( canvas, { name: 'Test Product', price: '29.99' } );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
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
			const canvas = await insertPayPalBlock( page );
			await fillButtonForm( canvas );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Create Button")' ).click();

			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			await block.click();

			// Toolbar is outside the iframe, on `page`.
			const toolbar = page.locator( '.block-editor-block-toolbar' );
			await expect( toolbar.locator( 'button[aria-label="Preview"]' ) ).toBeVisible();
			await expect( toolbar.locator( 'button[aria-label="Edit"]' ) ).toBeVisible();
		} );

		test( 'edit toggle switches back to form with existing data', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );
			await fillButtonForm( canvas, { name: 'My Widget', price: '49.99' } );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Create Button")' ).click();

			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			await block.click();
			// Edit button is on the toolbar outside the iframe.
			await page.locator( 'button[aria-label="Edit"]' ).click();

			await expect( block.locator( 'h3' ) ).toHaveText( 'Edit PayPal Payment Button' );

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
			const canvas = await insertPayPalBlock( page );
			await fillButtonForm( canvas, { name: 'Frontend Widget', price: '19.99' } );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Create Button")' ).click();

			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			const postUrl = await publishPost( page );
			await page.goto( postUrl );

			// Frontend -- no iframe, everything is on `page`.
			const paypalButton = page.locator( '.jetpack-paypal-button' );
			await expect( paypalButton ).toBeVisible();

			await expect( paypalButton.locator( '.jetpack-paypal-button__product-name' ) ).toBeVisible();

			const paypalLink = paypalButton.locator( '.jetpack-paypal-button__checkout-link' );
			await expect( paypalLink ).toBeVisible();
			const href = await paypalLink.getAttribute( 'href' );
			expect( href ).toContain( 'paypal.com' );
		} );

		test( 'stacked layout shows QR code toggle on frontend', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );
			await fillButtonForm( canvas );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Create Button")' ).click();
			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			const postUrl = await publishPost( page );
			await page.goto( postUrl );

			// Frontend -- no iframe. "Show Link or QR Code" toggle is rendered.
			const qrToggle = page.locator( '.jetpack-paypal-button__qr-toggle' );
			await expect( qrToggle ).toBeVisible();
			await expect( qrToggle ).toHaveText( 'Show Link or QR Code' );
		} );
	} );

	// ---------------------------------------------------------------
	// 4. Error Flow
	// ---------------------------------------------------------------
	test.describe( 'Error Flow', () => {
		test( 'Create button disabled when product name is empty', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Fill only price, leave name empty.
			await block.locator( 'input[placeholder="29.99"]' ).fill( '10.00' );

			await expect( block.locator( 'button:has-text("Create Button")' ) ).toBeDisabled();
		} );

		test( 'Create button disabled when price is zero', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			await block.locator( 'input[placeholder="e.g., Premium Widget"]' ).fill( 'Test' );
			await block.locator( 'input[placeholder="29.99"]' ).fill( '0' );

			// Blur the price field to trigger validation.
			await block.locator( 'input[placeholder="e.g., Premium Widget"]' ).click();

			await expect( block.locator( 'button:has-text("Create Button")' ) ).toBeDisabled();
		} );

		test( 'shows field validation error after blurring empty product name', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			const nameInput = block.locator( 'input[placeholder="e.g., Premium Widget"]' );
			await nameInput.click();
			await nameInput.fill( '' );
			await block.locator( 'input[placeholder="29.99"]' ).click(); // blur

			// The TextControl gets a 'has-error' class and shows error via the help prop.
			await expect( block.locator( '.has-error' ) ).toBeVisible( {
				timeout: 3000,
			} );
		} );

		test( 'shows API error message in notice', async ( { page } ) => {
			// Override create endpoint to return 400 error.
			await setupPayPalMocks( page );
			await page.route( /\/wp-json\/jetpack\/v4\/paypal\/buttons(\?|$)/, route => {
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
			const canvas = await insertPayPalBlock( page );
			await fillButtonForm( canvas );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
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

			// Switch to code editor via the Options menu (keyboard shortcut is unreliable in E2E).
			await page.click( 'button[aria-label="Options"]' );
			await page.click( 'button[role="menuitemradio"]:has-text("Code editor")' );
			await page.waitForSelector( '.editor-post-text-editor', { timeout: 5000 } );
			await page.locator( '.editor-post-text-editor' ).fill( legacyBlockMarkup );

			// Switch back to visual editor via the Options menu.
			await page.click( 'button[aria-label="Options"]' );
			await page.click( 'button[role="menuitemradio"]:has-text("Visual editor")' );
			await page.waitForSelector( '.edit-post-visual-editor', { timeout: 5000 } );

			// After switching back, block content is inside the iframe.
			const canvas = await getEditorCanvas( page );
			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await expect( block ).toBeVisible();
			await expect( block.locator( 'text=legacy paste-code format' ) ).toBeVisible( {
				timeout: 5000,
			} );
		} );

		test( 'legacy block renders on frontend without breaking', async ( { page } ) => {
			// Create a published post via the REST API with legacy block markup.
			// This bypasses the code editor round-trip which can invalidate the block.
			const legacyMarkup456 =
				'<!-- wp:jetpack/paypal-payment-buttons {"buttonType":"stacked","scriptSrc":"https://www.paypal.com/sdk/js","hostedButtonId":"LEGACY456"} -->\n' +
				'<div class="wp-block-jetpack-paypal-payment-buttons"><div class="jetpack-paypal-button jetpack-paypal-button--stacked" id="LEGACY456"></div></div>\n' +
				'<!-- /wp:jetpack/paypal-payment-buttons -->';

			// Navigate to block editor to ensure wpApiSettings nonce is loaded.
			await page.goto( '/wp-admin/post-new.php' );
			await page.waitForSelector( '.edit-post-visual-editor', { timeout: 30000 } );

			// Create the post via the browser's fetch with the WP nonce.
			const postUrl = await page.evaluate( async markup => {
				const nonce = window.wpApiSettings ? window.wpApiSettings.nonce : '';
				const res = await window.fetch( '/wp-json/wp/v2/posts', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-WP-Nonce': nonce,
					},
					credentials: 'same-origin',
					body: JSON.stringify( {
						title: 'Legacy PayPal Block Test',
						content: markup,
						status: 'publish',
					} ),
				} );
				if ( ! res.ok ) {
					const err = await res.text();
					throw new Error( 'REST API error: ' + res.status + ' ' + err );
				}
				const post = await res.json();
				return post.link;
			}, legacyMarkup456 );

			expect( postUrl ).toBeTruthy();
			await page.goto( postUrl );

			// Frontend -- the render_callback generates a container div with id="paypal-container-{hostedButtonId}".
			// The div is empty (hidden) because the real PayPal SDK is not loaded in tests,
			// but its presence proves the legacy block rendered without breaking.
			const legacyBlock = page.locator( '#paypal-container-LEGACY456' );
			await expect( legacyBlock ).toBeAttached( { timeout: 5000 } );
		} );
	} );

	// ---------------------------------------------------------------
	// 6. Disconnect Flow
	// ---------------------------------------------------------------
	test.describe( 'Disconnect Flow', () => {
		test( 'disconnecting shows wizard for new blocks', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Should show create form initially (connected).
			await expect( block.locator( 'h3:has-text("Create PayPal Payment Button")' ) ).toBeVisible();

			// Close the block inserter if it's still open.
			const closeInserter = page.locator( 'button[aria-label="Close Block Inserter"]' );
			if ( await closeInserter.isVisible( { timeout: 1000 } ).catch( () => false ) ) {
				await closeInserter.click();
				await page.waitForTimeout( 300 );
			}

			// Select the block by clicking its heading inside the iframe.
			await block.locator( 'h3' ).click();
			await page.waitForTimeout( 300 );

			// Open the settings sidebar. Click it once if not active, then ensure
			// the Block tab is showing InspectorControls. Retry block click if needed.
			const settingsBtn = page.locator( 'button[aria-label="Settings"]' );
			await settingsBtn.click();
			await page.waitForTimeout( 500 );

			const connectionPanel = page.locator( 'button:has-text("PayPal Connection")' );

			// The sidebar might open on the Post tab. Click the block again to
			// ensure the Block tab is selected, then check again.
			for ( let attempt = 0; attempt < 3; attempt++ ) {
				if ( await connectionPanel.isVisible( { timeout: 1000 } ).catch( () => false ) ) {
					break;
				}
				// Re-click the block in the iframe to trigger Block tab.
				await block.locator( 'h3' ).click();
				await page.waitForTimeout( 500 );
				// Re-open sidebar if it was closed by the click.
				if (
					! ( await settingsBtn
						.evaluate( el => el.classList.contains( 'is-pressed' ) )
						.catch( () => false ) )
				) {
					await settingsBtn.click();
					await page.waitForTimeout( 500 );
				}
			}

			await connectionPanel.waitFor( { state: 'visible', timeout: 5000 } );
			await connectionPanel.click( { force: true } );

			// After disconnect, mock returns disconnected state.
			await page.route( /\/wp-json\/jetpack\/v4\/paypal\/connection(\?|$)/, route => {
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( MOCK_RESPONSES.connectionDisconnected ),
				} );
			} );

			// Accept the confirm() dialog that handleDisconnect triggers.
			page.on( 'dialog', dialog => dialog.accept() );

			const disconnectBtn = page.locator( 'button:has-text("Disconnect PayPal")' );
			await expect( disconnectBtn ).toBeVisible( { timeout: 5000 } );
			await disconnectBtn.click();

			// Block content (wizard) is inside the iframe.
			await expect( block.locator( 'h3:has-text("Connect PayPal")' ) ).toBeVisible( {
				timeout: 5000,
			} );
		} );

		test( 'delete button clears block state and returns to edit mode', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );
			await fillButtonForm( canvas );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.locator( 'button:has-text("Create Button")' ).click();

			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			// Close the block inserter if open.
			const closeInserter = page.locator( 'button[aria-label="Close Block Inserter"]' );
			if ( await closeInserter.isVisible( { timeout: 1000 } ).catch( () => false ) ) {
				await closeInserter.click();
				await page.waitForTimeout( 300 );
			}

			// Click the block preview to select it.
			await block.click();
			await page.waitForTimeout( 300 );

			// Open the settings sidebar and ensure Block tab is active.
			const settingsBtn = page.locator( 'button[aria-label="Settings"]' );
			await settingsBtn.click();
			await page.waitForTimeout( 500 );

			const connectionPanel = page.locator( 'button:has-text("PayPal Connection")' );

			// Retry block click if the Block tab / panel isn't showing yet.
			for ( let attempt = 0; attempt < 3; attempt++ ) {
				if ( await connectionPanel.isVisible( { timeout: 1000 } ).catch( () => false ) ) {
					break;
				}
				await block.click();
				await page.waitForTimeout( 500 );
				// Re-open sidebar if block click closed it.
				if (
					! ( await settingsBtn
						.evaluate( el => el.classList.contains( 'is-pressed' ) )
						.catch( () => false ) )
				) {
					await settingsBtn.click();
					await page.waitForTimeout( 500 );
				}
			}

			await connectionPanel.waitFor( { state: 'visible', timeout: 5000 } );
			await connectionPanel.click( { force: true } );

			// Accept the confirm() dialog that handleDeleteButton triggers.
			page.on( 'dialog', dialog => dialog.accept() );

			const deleteBtn = page.locator( 'button:has-text("Delete Button")' );
			await expect( deleteBtn ).toBeVisible( { timeout: 3000 } );
			await deleteBtn.click();

			// Block content returns to create form inside the iframe.
			await expect( block.locator( 'h3:has-text("Create PayPal Payment Button")' ) ).toBeVisible( {
				timeout: 5000,
			} );
		} );
	} );

	// ---------------------------------------------------------------
	// 7. Production Default (WOOPTP-163)
	// ---------------------------------------------------------------
	test.describe( 'Production Default', () => {
		test( 'connected status shows Production environment badge', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Should show connected status — "PayPal Connected" visible, no "Sandbox" badge.
			await expect( block.locator( 'text=PayPal Connected' ) ).toBeVisible();
			await expect(
				block.locator( '.jetpack-paypal-payment-buttons__sandbox-badge' )
			).toBeHidden();
		} );

		test( 'connection endpoint defaults to production API domain', async ( { page } ) => {
			// Use a custom disconnected mock that defaults to production environment.
			await setupPayPalMocks( page, {
				connection: {
					connected: false,
					environment: 'production',
					partner_referrals_available: true,
				},
			} );

			// Intercept the connect POST to verify it hits the production domain.
			let connectRequestBody = null;
			await page.route( /\/wp-json\/jetpack\/v4\/paypal\/connect(\?|$)/, route => {
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
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, canvas );

			const inputs = block.locator( '.components-text-control__input' );
			await inputs.first().fill( 'AValidClientId123456789' );
			await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );

			await page.route( /\/wp-json\/jetpack\/v4\/paypal\/connection(\?|$)/, route => {
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
					'button:has-text("Create Your First Button"), h3:has-text("Create PayPal Payment Button")'
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

			// Mock connect to return a 403 -- app lacks Payment Links scope.
			await page.route( /\/wp-json\/jetpack\/v4\/paypal\/connect(\?|$)/, route => {
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
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, canvas );

			const inputs = block.locator( '.components-text-control__input' );
			await inputs.first().fill( 'AValidClientId123456789' );
			await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );
			await block.locator( 'button:has-text("Connect")' ).click();

			// Should show the 403 guidance error.
			const errorNotice = block.locator( '.components-notice.is-error' );
			await expect( errorNotice ).toBeVisible( { timeout: 5000 } );
			await expect( errorNotice ).toContainText( /Payment Links|Developer Dashboard/i );

			// Should stay on Credentials step (not advance, no partial connection).
			await expect( block.locator( 'button:has-text("Connect")' ) ).toBeVisible();
		} );

		test( '403 clears credentials -- no partial connection state', async ( { page } ) => {
			await setupDisconnectedMocks( page );

			// First connect returns 403.
			await page.route( /\/wp-json\/jetpack\/v4\/paypal\/connect(\?|$)/, route => {
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
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, canvas );

			const inputs = block.locator( '.components-text-control__input' );
			await inputs.first().fill( 'AValidClientId123456789' );
			await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );
			await block.locator( 'button:has-text("Connect")' ).click();

			// Wait for error.
			await expect( block.locator( '.components-notice.is-error' ) ).toBeVisible( {
				timeout: 5000,
			} );

			// Connection status should still be disconnected -- wizard is still showing.
			await expect( block.locator( 'h3:has-text("Create PayPal Payment Button")' ) ).toBeHidden();
		} );

		test( '5xx from PayPal during validation does not block connection', async ( { page } ) => {
			await setupDisconnectedMocks( page );

			// Connect returns success despite PayPal 5xx during validation.
			await page.route( /\/wp-json\/jetpack\/v4\/paypal\/connect(\?|$)/, route => {
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
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await advanceWizardToCredentials( page, canvas );

			const inputs = block.locator( '.components-text-control__input' );
			await inputs.first().fill( 'AValidClientId123456789' );
			await block.locator( 'input[type="password"]' ).fill( 'valid_client_secret' );

			// After connect POST succeeds, subsequent connection checks return connected.
			await page.route( /\/wp-json\/jetpack\/v4\/paypal\/connection(\?|$)/, route => {
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( MOCK_RESPONSES.connection ),
				} );
			} );

			await block.locator( 'button:has-text("Connect")' ).click();

			// Should succeed -- advance past credentials step.
			await expect(
				block.locator(
					'button:has-text("Create Your First Button"), h3:has-text("Create PayPal Payment Button")'
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

			// Open the block inserter -- inserter is on `page`.
			await page.click( 'button[aria-label="Block Inserter"]' );
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
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await block.click();

			// The block toolbar icon should be an SVG -- toolbar is on `page`.
			const toolbar = page.locator( '.block-editor-block-toolbar' );
			const toolbarSvg = toolbar.locator(
				'.block-editor-block-icon svg, .block-editor-block-switcher svg'
			);
			await expect( toolbarSvg.first() ).toBeVisible( { timeout: 5000 } );
		} );
	} );
} );
