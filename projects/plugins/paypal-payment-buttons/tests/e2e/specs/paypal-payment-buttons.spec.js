/* eslint-disable playwright/no-wait-for-selector, playwright/no-force-option, no-undef */
// Needs the `paypal-payments-api-managed-buttons` flag on, which the
// e2e-paypal-feature-flag helper plugin (activated by `pnpm env:up`) provides.
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

import { EditorPage } from '@automattic/_jetpack-e2e-commons/pages/index';
import { test, expect } from '@playwright/test';
import {
	MOCK_RESPONSES,
	getUnmockedRequests,
	paypalRoute,
	setupPayPalMocks,
	setupDisconnectedMocks,
} from '../helpers/paypal-api-mock';

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
	await page.locator( 'button[aria-label="Block Inserter"]' ).click();
	await page.locator( 'input[placeholder="Search"]' ).fill( 'PayPal' );
	await page.locator( 'button.editor-block-list-item-jetpack-paypal-payment-buttons' ).click();

	// The block content renders inside an iframe in WP 6.x+.
	const canvas = await getEditorCanvas( page );

	await expect( canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' ) ).toBeVisible( {
		timeout: 10000,
	} );

	return canvas;
}

/**
 * Record every create request the page makes from now on.
 *
 * The payment is written with the post, so a button held back means the save ran and
 * no create request went out.
 *
 * @param {import('@playwright/test').Page} page - Playwright page instance.
 * @return {Array} The create requests, filled in as they happen.
 */
function recordCreateRequests( page ) {
	const created = [];

	page.on( 'request', request => {
		if ( request.method() === 'POST' && paypalRoute( '/buttons' )( request.url() ) ) {
			created.push( request.url() );
		}
	} );

	return created;
}

/**
 * Wait for a snackbar with this text. Core's own save snackbar can show next to it.
 *
 * @param {import('@playwright/test').Page} page - Playwright page instance.
 * @param {string}                          text - Text the snackbar contains.
 */
async function expectSnackbar( page, text ) {
	await expect( page.locator( '.components-snackbar' ).filter( { hasText: text } ) ).toBeVisible( {
		timeout: 10000,
	} );
}

/**
 * Open the block sidebar and walk the wizard from the Welcome step to the Credentials step.
 * Expects an inserted block on the Welcome step.
 *
 * @param {import('@playwright/test').Page}                                         page   - Playwright page instance.
 * @param {import('@playwright/test').FrameLocator|import('@playwright/test').Page} canvas - The editor canvas (iframe or page).
 * @return {Promise<import('@playwright/test').Locator>} The sidebar, which holds the wizard.
 */
async function advanceWizardToCredentials( page, canvas ) {
	const sidebar = await openBlockSidebar(
		page,
		canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' )
	);

	// Welcome step -> click "Or enter your API credentials manually" link.
	await sidebar
		.getByRole( 'button', { name: 'Or enter your API credentials manually', exact: true } )
		.click();

	// Dashboard step -> click "I have my credentials — Next".
	await sidebar
		.getByRole( 'button', { name: 'I have my credentials — Next', exact: true } )
		.click();

	// Now on the Credentials step -- wait for Client ID field.
	await expect( sidebar.getByLabel( 'Client ID', { exact: true } ) ).toBeVisible( {
		timeout: 5000,
	} );

	return sidebar;
}

/**
 * Walk through the full wizard and connect with valid credentials.
 *
 * @param {import('@playwright/test').Page}                                         page   - Playwright page instance.
 * @param {import('@playwright/test').FrameLocator|import('@playwright/test').Page} canvas - The editor canvas (iframe or page).
 * @return {Promise<import('@playwright/test').Locator>} The sidebar, now showing the button form.
 */
async function connectThroughWizard( page, canvas ) {
	const sidebar = await advanceWizardToCredentials( page, canvas );

	await sidebar.getByLabel( 'Client ID', { exact: true } ).fill( 'AValidClientId123456789' );
	await sidebar.getByLabel( 'Client Secret', { exact: true } ).fill( 'valid_client_secret' );

	// Connection checks after the connect report connected.
	await page.route( paypalRoute( '/connection' ), route => {
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( MOCK_RESPONSES.connection ),
		} );
	} );

	await sidebar.getByRole( 'button', { name: 'Connect', exact: true } ).click();

	// The sidebar swaps the wizard for the button form.
	await expect( sidebar.getByLabel( 'Product Name', { exact: true } ) ).toBeVisible( {
		timeout: 8000,
	} );

	return sidebar;
}

/**
 * Select the block and open the Settings sidebar, where its `InspectorControls`
 * render. The sidebar is in the top document, outside the editor-canvas iframe.
 *
 * @param {import('@playwright/test').Page}    page  - Playwright page instance.
 * @param {import('@playwright/test').Locator} block - The block, inside the canvas.
 * @return {Promise<import('@playwright/test').Locator>} The sidebar.
 */
async function openBlockSidebar( page, block ) {
	// The inspector panels mount on block selection, not on the sidebar opening.
	await block.click();

	const editor = new EditorPage( { page } );
	await editor.openSettings();

	return editor.getEditorSettingsSidebar();
}

/**
 * Fill in the button creation form.
 *
 * Selects the block and opens its sidebar first, where the form renders.
 *
 * @param {import('@playwright/test').Page} page          - Playwright page instance.
 * @param {object}                          options       - Form field values.
 * @param {string}                          options.name  - Product name.
 * @param {string}                          options.price - Product price.
 */
async function fillButtonForm( page, { name = 'Test Product', price = '29.99' } = {} ) {
	const canvas = await getEditorCanvas( page );
	const sidebar = await openBlockSidebar(
		page,
		canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' )
	);
	const nameInput = sidebar.getByLabel( 'Product Name', { exact: true } );
	await expect( nameInput ).toBeVisible( { timeout: 10000 } );
	await nameInput.fill( name );
	await sidebar.getByLabel( 'Price', { exact: true } ).fill( price );
}

/**
 * Publish the post and return the frontend URL.
 *
 * @param {import('@playwright/test').Page} page - Playwright page instance.
 * @return {string} The published post URL.
 */
async function publishPost( page ) {
	await page.locator( 'button.editor-post-publish-button__button' ).click();
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
	// Fail a test whose PayPal requests hit the setupPayPalMocks catch-all.
	test.afterEach( async ( { page } ) => {
		expect( getUnmockedRequests( page ), 'Unmocked PayPal requests' ).toEqual( [] );
	} );

	// ---------------------------------------------------------------
	// 1. Credential Wizard Flow (WOOPTP-162)
	// ---------------------------------------------------------------
	test.describe( 'Credential Wizard Flow', () => {
		test( 'shows Welcome step when PayPal is not connected', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await openBlockSidebar(
				page,
				canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' )
			);

			// Welcome step: heading and the "Connect PayPal" primary CTA.
			await expect(
				sidebar.getByRole( 'heading', { name: 'Connect your PayPal account', exact: true } )
			).toBeVisible();
			await expect(
				sidebar.getByRole( 'button', { name: 'Connect PayPal', exact: true } )
			).toBeVisible();
			// No credential fields yet.
			await expect( sidebar.locator( 'input[type="password"]' ) ).toBeHidden();
		} );

		test( 'manual credentials link navigates to Dashboard step', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await openBlockSidebar(
				page,
				canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' )
			);
			await sidebar
				.getByRole( 'button', { name: 'Or enter your API credentials manually', exact: true } )
				.click();

			// Dashboard step shows the developer dashboard link.
			await expect(
				sidebar.getByRole( 'heading', {
					name: 'Step 1 of 2: Get Your API Credentials',
					exact: true,
				} )
			).toBeVisible( { timeout: 5000 } );
			await expect(
				sidebar.getByRole( 'link', { name: 'Open PayPal Dashboard ↗', exact: true } )
			).toBeVisible();
		} );

		test( 'PayPal Dashboard link opens the sandbox dashboard', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await openBlockSidebar(
				page,
				canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' )
			);
			await sidebar
				.getByRole( 'button', { name: 'Or enter your API credentials manually', exact: true } )
				.click();

			// The disconnected mock uses sandbox.
			const dashboardLink = sidebar.getByRole( 'link', {
				name: 'Open PayPal Dashboard ↗',
				exact: true,
			} );
			await expect( dashboardLink ).toBeVisible( { timeout: 5000 } );
			await expect( dashboardLink ).toHaveAttribute(
				'href',
				'https://developer.paypal.com/dashboard/applications/sandbox'
			);
		} );

		test( 'advances from Dashboard to Credentials step', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await advanceWizardToCredentials( page, canvas );

			// Credentials step: heading, Client ID/Secret fields, Connect button.
			await expect(
				sidebar.getByRole( 'heading', { name: 'Step 2 of 2: Enter Credentials', exact: true } )
			).toBeVisible();
			await expect( sidebar.locator( 'input[type="password"]' ) ).toBeVisible();
			await expect( sidebar.getByRole( 'button', { name: 'Connect', exact: true } ) ).toBeVisible();
		} );

		test( 'show/hide toggle reveals and conceals Client Secret', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await advanceWizardToCredentials( page, canvas );

			const secretInput = sidebar.getByLabel( 'Client Secret', { exact: true } );
			await expect( secretInput ).toHaveAttribute( 'type', 'password' );

			// Click the show/hide toggle button.
			const toggle = sidebar.locator( '.jetpack-paypal-wizard__toggle-secret' );
			await toggle.click();

			// Input type should change to text (revealed).
			await expect( secretInput ).toHaveAttribute( 'type', 'text' );

			// Toggle again to hide.
			await toggle.click();
			await expect( secretInput ).toHaveAttribute( 'type', 'password' );
		} );

		test( 'pasted Client ID is trimmed as it is entered', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await advanceWizardToCredentials( page, canvas );

			const clientIdInput = sidebar.getByLabel( 'Client ID', { exact: true } );
			await clientIdInput.fill( '  AValidClientId123456789  ' );
			// Blur to trigger validation.
			await sidebar.getByLabel( 'Client Secret', { exact: true } ).click();

			// Trimmed on input, so the format warning stays hidden.
			await expect( clientIdInput ).toHaveValue( 'AValidClientId123456789' );
			await expect(
				sidebar.locator( '.jetpack-paypal-payment-buttons__field-warning' )
			).not.toBeVisible( { timeout: 3000 } );
		} );

		test( 'Client ID format warning appears for invalid-looking IDs', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await advanceWizardToCredentials( page, canvas );

			const clientIdInput = sidebar.getByLabel( 'Client ID', { exact: true } );
			await clientIdInput.fill( 'bad' );
			// Blur to trigger validation.
			await sidebar.getByLabel( 'Client Secret', { exact: true } ).click();

			await expect(
				sidebar.locator( '.jetpack-paypal-payment-buttons__field-warning' )
			).toBeVisible( { timeout: 3000 } );
		} );

		test( 'sandbox toggle on Welcome step switches environment', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await openBlockSidebar(
				page,
				canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' )
			);

			// The sandbox toggle starts on, matching the mock's sandbox environment.
			const sandboxToggle = sidebar.getByLabel( 'Use sandbox (testing)', { exact: true } );
			await expect( sandboxToggle ).toBeChecked( { timeout: 3000 } );

			await sandboxToggle.uncheck();
			await expect( sandboxToggle ).not.toBeChecked();

			// The Dashboard step now links to the live dashboard.
			await sidebar
				.getByRole( 'button', { name: 'Or enter your API credentials manually', exact: true } )
				.click();
			await expect(
				sidebar.getByRole( 'link', { name: 'Open PayPal Dashboard ↗', exact: true } )
			).toHaveAttribute( 'href', 'https://developer.paypal.com/dashboard/applications/live' );
		} );

		test( 'sandbox link on Credentials step shows warning banner', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await advanceWizardToCredentials( page, canvas );

			// The disconnected mock returns environment: 'sandbox', so the sandbox
			// warning banner is already visible on the Credentials step.
			await expect( sidebar.locator( '.components-notice.is-warning' ) ).toBeVisible( {
				timeout: 3000,
			} );

			// Click "Switch to Production (Live)" to turn off sandbox.
			const prodLink = sidebar.getByRole( 'button', {
				name: 'Switch to Production (Live)',
				exact: true,
			} );
			await prodLink.click();

			// Warning banner should disappear.
			await expect( sidebar.locator( '.components-notice.is-warning' ) ).not.toBeVisible( {
				timeout: 3000,
			} );

			// Click "Use Sandbox for testing" to re-enable sandbox.
			const sandboxLink = sidebar.getByRole( 'button', {
				name: 'Use Sandbox for testing',
				exact: true,
			} );
			await sandboxLink.click();

			// Warning banner should reappear.
			await expect( sidebar.locator( '.components-notice.is-warning' ) ).toBeVisible( {
				timeout: 3000,
			} );
		} );

		test( 'shows inline error on Credentials step with invalid credentials', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await advanceWizardToCredentials( page, canvas );
			const connectButton = sidebar.getByRole( 'button', { name: 'Connect', exact: true } );

			await sidebar.getByLabel( 'Client ID', { exact: true } ).fill( 'bad_id' );
			await sidebar.getByLabel( 'Client Secret', { exact: true } ).fill( 'bad_secret' );
			await connectButton.click();

			// Inline error shown within the wizard.
			await expect( sidebar.locator( '.components-notice.is-error' ) ).toBeVisible( {
				timeout: 5000,
			} );
			// Must NOT have advanced past Credentials step.
			await expect( connectButton ).toBeVisible();
		} );

		test( 'back navigation preserves entered data', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await advanceWizardToCredentials( page, canvas );

			const clientIdInput = sidebar.getByLabel( 'Client ID', { exact: true } );
			await clientIdInput.fill( 'ATestClientId' );

			// Back to Dashboard step.
			await sidebar.getByRole( 'button', { name: '← Back', exact: true } ).click();

			// Forward again to Credentials step.
			await sidebar
				.getByRole( 'button', { name: 'I have my credentials — Next', exact: true } )
				.click();

			// Client ID should still be populated.
			await expect( clientIdInput ).toHaveValue( 'ATestClientId' );
		} );

		test( 'connect goes straight to the form', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await connectThroughWizard( page, canvas );

			// Connecting closes the wizard and opens the form directly.
			await expect( sidebar.locator( '.jetpack-paypal-payment-buttons__connect' ) ).toBeHidden();
			await expect( sidebar.getByLabel( 'Product Name', { exact: true } ) ).toBeVisible();
		} );
	} );

	// ---------------------------------------------------------------
	// 2. Create Button Flow
	// ---------------------------------------------------------------
	test.describe( 'Create Button Flow', () => {
		test( 'shows the button form in the sidebar when connected', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await openBlockSidebar(
				page,
				canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' )
			);

			await expect( sidebar.getByLabel( 'Product Name', { exact: true } ) ).toBeVisible( {
				timeout: 10000,
			} );
			await expect( sidebar.getByLabel( 'Price', { exact: true } ) ).toBeVisible();
			await expect( sidebar.getByLabel( 'Currency', { exact: true } ) ).toBeVisible();
		} );

		test( 'holds the payment back while the form is empty', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );
			const created = recordCreateRequests( page );

			await page.getByRole( 'button', { name: 'Save draft' } ).click();

			// The save sync says which button it skipped and why.
			await expectSnackbar(
				page,
				'The PayPal button "Untitled" was not sent to PayPal: Product name is required.'
			);
			await expect( page.locator( '.editor-post-saved-state' ) ).toContainText( 'Saved', {
				timeout: 10000,
			} );

			expect( created ).toEqual( [] );

			// The checkout button stays disabled until the block has a link.
			await expect(
				canvas.locator(
					'.wp-block-jetpack-paypal-payment-buttons .jetpack-paypal-button-preview__checkout-button'
				)
			).toHaveClass( /is-disabled/ );
		} );

		test( 'creates the link on save and enables the checkout button', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			await fillButtonForm( page, { name: 'Test Product', price: '29.99' } );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			const created = recordCreateRequests( page );

			// Saving creates the link, which enables the checkout button.
			await page.getByRole( 'button', { name: 'Save draft' } ).click();

			await expect(
				block.locator( '.jetpack-paypal-button-preview__checkout-button' )
			).not.toHaveClass( /is-disabled/, { timeout: 5000 } );
			expect( created ).toHaveLength( 1 );
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
			await fillButtonForm( page, { name: 'Frontend Widget', price: '19.99' } );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await page.getByRole( 'button', { name: 'Save draft' } ).click();

			// Wait for the link: it enables the checkout button.
			await expect(
				block.locator( '.jetpack-paypal-button-preview__checkout-button' )
			).not.toHaveClass( /is-disabled/, { timeout: 5000 } );

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
	} );

	// ---------------------------------------------------------------
	// 4. Error Flow
	// ---------------------------------------------------------------
	test.describe( 'Error Flow', () => {
		test( 'holds the payment back when the product name is empty', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await openBlockSidebar(
				page,
				canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' )
			);

			// Fill only price, leave name empty.
			await sidebar.getByLabel( 'Price', { exact: true } ).fill( '10.00' );

			const created = recordCreateRequests( page );
			await page.getByRole( 'button', { name: 'Save draft' } ).click();

			await expectSnackbar(
				page,
				'The PayPal button "Untitled" was not sent to PayPal: Product name is required.'
			);
			await expect( page.locator( '.editor-post-saved-state' ) ).toContainText( 'Saved', {
				timeout: 10000,
			} );

			expect( created ).toEqual( [] );
		} );

		test( 'holds the payment back when the price is zero', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await openBlockSidebar(
				page,
				canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' )
			);
			const nameInput = sidebar.getByLabel( 'Product Name', { exact: true } );

			await nameInput.fill( 'Test' );
			await sidebar.getByLabel( 'Price', { exact: true } ).fill( '0' );

			// Blur the price field to trigger validation.
			await nameInput.click();

			const created = recordCreateRequests( page );
			await page.getByRole( 'button', { name: 'Save draft' } ).click();

			await expectSnackbar(
				page,
				'The PayPal button "Test" was not sent to PayPal: Price must be a positive number.'
			);
			await expect( page.locator( '.editor-post-saved-state' ) ).toContainText( 'Saved', {
				timeout: 10000,
			} );

			expect( created ).toEqual( [] );
		} );

		test( 'shows field validation error after blurring empty product name', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const sidebar = await openBlockSidebar(
				page,
				canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' )
			);

			const nameInput = sidebar.getByLabel( 'Product Name', { exact: true } );
			await nameInput.click();
			await nameInput.fill( '' );
			await sidebar.getByLabel( 'Price', { exact: true } ).click(); // blur

			// The field's help shows the error.
			const nameError = sidebar.getByText( 'Product name is required.', { exact: true } );
			await expect( nameError ).toBeVisible( { timeout: 3000 } );
		} );

		test( 'shows the PayPal error in a snackbar', async ( { page } ) => {
			// Override create endpoint to return 400 error.
			await setupPayPalMocks( page );
			await page.route( paypalRoute( '/buttons' ), route => {
				if ( route.request().method() === 'POST' ) {
					return route.fulfill( {
						status: 400,
						contentType: 'application/json',
						body: JSON.stringify( MOCK_RESPONSES.error400 ),
					} );
				}
				// Pass GETs on to the list mock in setupPayPalMocks.
				route.fallback();
			} );

			await goToNewPost( page );
			await insertPayPalBlock( page );
			await fillButtonForm( page );

			await page.getByRole( 'button', { name: 'Save draft' } ).click();

			await expectSnackbar(
				page,
				`PayPal did not save "Test Product": ${ MOCK_RESPONSES.error400.message }`
			);
			// The post still saves.
			await expect( page.locator( '.editor-post-saved-state' ) ).toContainText( 'Saved', {
				timeout: 10000,
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
			await page.locator( 'button[aria-label="Options"]' ).click();
			await page.locator( 'button[role="menuitemradio"]:has-text("Code editor")' ).click();
			await page.waitForSelector( '.editor-post-text-editor', { timeout: 5000 } );
			await page.locator( '.editor-post-text-editor' ).fill( legacyBlockMarkup );

			// Switch back to visual editor via the Options menu.
			await page.locator( 'button[aria-label="Options"]' ).click();
			await page.locator( 'button[role="menuitemradio"]:has-text("Visual editor")' ).click();
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

			// Navigate to block editor so wp.apiFetch is loaded with the REST root and nonce.
			await page.goto( '/wp-admin/post-new.php' );
			await page.waitForSelector( '.edit-post-visual-editor', { timeout: 30000 } );

			// apiFetch builds the REST URL for the site's permalink setting and throws on an error response.
			const postUrl = await page.evaluate( async markup => {
				const post = await window.wp.apiFetch( {
					path: '/wp/v2/posts',
					method: 'POST',
					data: {
						title: 'Legacy PayPal Block Test',
						content: markup,
						status: 'publish',
					},
				} );
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
		test( 'logging out shows the wizard for new blocks', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			const sidebar = await openBlockSidebar( page, block );

			// Connected: the sidebar shows the button form.
			await expect( sidebar.getByLabel( 'Product Name', { exact: true } ) ).toBeVisible( {
				timeout: 10000,
			} );

			const accountMenu = sidebar.getByRole( 'button', {
				name: 'PayPal account options',
				exact: true,
			} );
			await accountMenu.waitFor( { state: 'visible', timeout: 5000 } );
			await accountMenu.click( { force: true } );

			// After disconnect, mock returns disconnected state.
			await page.route( paypalRoute( '/connection' ), route => {
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( MOCK_RESPONSES.connectionDisconnected ),
				} );
			} );

			// The item's name includes the account email, so match its start.
			const logOutItem = page.getByRole( 'menuitem', { name: /^Log out/ } );
			await expect( logOutItem ).toBeVisible( { timeout: 5000 } );
			await logOutItem.click();

			// Confirm the log out, which runs the disconnect.
			const logOutDialog = page.getByRole( 'dialog', { name: 'Log out from PayPal', exact: true } );
			await expect( logOutDialog ).toBeVisible( { timeout: 3000 } );
			await logOutDialog.getByRole( 'button', { name: 'Log out', exact: true } ).click();

			// The canvas shows the placeholder and the sidebar shows the connection wizard.
			await expect( block.locator( '.jetpack-paypal-payment-buttons__placeholder' ) ).toBeVisible( {
				timeout: 5000,
			} );
			await expect( sidebar.locator( '.jetpack-paypal-payment-buttons__connect' ) ).toBeVisible();
		} );

		test( 'deleting from the link details menu removes the link and keeps the form values', async ( {
			page,
		} ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );
			await fillButtonForm( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			const checkoutButton = block.locator( '.jetpack-paypal-button-preview__checkout-button' );
			await page.getByRole( 'button', { name: 'Save draft' } ).click();

			// Wait for the link: it enables the checkout button.
			await expect( checkoutButton ).not.toHaveClass( /is-disabled/, { timeout: 5000 } );

			const sidebar = await openBlockSidebar( page, block );

			const linkMenu = sidebar.getByRole( 'button', { name: 'Payment link options', exact: true } );
			await linkMenu.waitFor( { state: 'visible', timeout: 5000 } );
			await linkMenu.click( { force: true } );

			const deleteItem = page.getByRole( 'menuitem', { name: 'Delete', exact: true } );
			await expect( deleteItem ).toBeVisible( { timeout: 3000 } );
			await deleteItem.click();

			// The delete button stays disabled until the merchant acknowledges the warning.
			const deleteConfirmDialog = page.getByRole( 'dialog', {
				name: 'Delete payment link',
				exact: true,
			} );
			await expect( deleteConfirmDialog ).toBeVisible( { timeout: 3000 } );
			const deletePermanently = deleteConfirmDialog.getByRole( 'button', {
				name: 'Delete permanently',
				exact: true,
			} );
			await expect( deletePermanently ).toBeDisabled();
			await deleteConfirmDialog.getByLabel( 'I understand this cannot be undone.' ).check();
			await deletePermanently.click();

			// The link is gone: the checkout button is disabled and the form keeps its values.
			await expect( checkoutButton ).toHaveClass( /is-disabled/, { timeout: 5000 } );
			await expect( sidebar.getByLabel( 'Product Name', { exact: true } ) ).toHaveValue(
				'Test Product'
			);
		} );

		test( 'deleting from the toolbar removes the link and keeps the form values', async ( {
			page,
		} ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );
			await fillButtonForm( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			const checkoutButton = block.locator( '.jetpack-paypal-button-preview__checkout-button' );
			await page.getByRole( 'button', { name: 'Save draft' } ).click();

			// Wait for the link: it enables the checkout button.
			await expect( checkoutButton ).not.toHaveClass( /is-disabled/, { timeout: 5000 } );

			// Delete from the block toolbar.
			await block.click();
			const toolbar = page.locator( '.block-editor-block-toolbar' );
			const toolbarDeleteBtn = toolbar.getByRole( 'button', {
				name: 'Delete payment link',
				exact: true,
			} );
			await expect( toolbarDeleteBtn ).toBeVisible( { timeout: 3000 } );
			await toolbarDeleteBtn.click();

			// Acknowledge the warning, then confirm the destructive action.
			const confirmDialog = page.getByRole( 'dialog', {
				name: 'Delete payment link',
				exact: true,
			} );
			await expect( confirmDialog ).toBeVisible( { timeout: 3000 } );
			await confirmDialog.getByLabel( 'I understand this cannot be undone.' ).check();
			await confirmDialog
				.getByRole( 'button', { name: 'Delete permanently', exact: true } )
				.click();

			// The link is gone: the checkout button is disabled and the form keeps its values.
			await expect( checkoutButton ).toHaveClass( /is-disabled/, { timeout: 5000 } );
			const sidebar = await openBlockSidebar( page, block );
			await expect( sidebar.getByLabel( 'Product Name', { exact: true } ) ).toHaveValue(
				'Test Product'
			);
		} );
	} );

	// ---------------------------------------------------------------
	// 7. Production Default (WOOPTP-163)
	// ---------------------------------------------------------------
	test.describe( 'Production Default', () => {
		test( 'connect sends the production environment', async ( { page } ) => {
			// Use a custom disconnected mock that defaults to production environment.
			await setupPayPalMocks( page, {
				connection: {
					connected: false,
					environment: 'production',
					partner_referrals_available: true,
				},
			} );

			// Capture the connect POST body to check its environment.
			let connectRequestBody = null;
			await page.route( paypalRoute( '/connect' ), route => {
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

			await connectThroughWizard( page, canvas );

			expect( connectRequestBody?.environment ).toBe( 'production' );
		} );
	} );

	// ---------------------------------------------------------------
	// 8. Token Pre-validation / 403 Payment Links Error (WOOPTP-164)
	// ---------------------------------------------------------------
	test.describe( 'Token Pre-validation', () => {
		test( '403 from PayPal shows Payment Links guidance error', async ( { page } ) => {
			await setupDisconnectedMocks( page );

			// Mock connect to return a 403 -- app lacks Payment Links scope.
			await page.route( paypalRoute( '/connect' ), route => {
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

			const sidebar = await advanceWizardToCredentials( page, canvas );
			const connectButton = sidebar.getByRole( 'button', { name: 'Connect', exact: true } );

			await sidebar.getByLabel( 'Client ID', { exact: true } ).fill( 'AValidClientId123456789' );
			await sidebar.getByLabel( 'Client Secret', { exact: true } ).fill( 'valid_client_secret' );
			await connectButton.click();

			// Should show the 403 guidance error.
			const errorNotice = sidebar.locator( '.components-notice.is-error' );
			await expect( errorNotice ).toBeVisible( { timeout: 5000 } );
			await expect( errorNotice ).toContainText( /Payment Links|Developer Dashboard/i );

			// Should stay on Credentials step (not advance, no partial connection).
			await expect( connectButton ).toBeVisible();
		} );

		test( '403 keeps the wizard on the Credentials step', async ( { page } ) => {
			await setupDisconnectedMocks( page );

			// First connect returns 403.
			await page.route( paypalRoute( '/connect' ), route => {
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

			const sidebar = await advanceWizardToCredentials( page, canvas );

			await sidebar.getByLabel( 'Client ID', { exact: true } ).fill( 'AValidClientId123456789' );
			await sidebar.getByLabel( 'Client Secret', { exact: true } ).fill( 'valid_client_secret' );
			await sidebar.getByRole( 'button', { name: 'Connect', exact: true } ).click();

			// Wait for error.
			await expect( sidebar.locator( '.components-notice.is-error' ) ).toBeVisible( {
				timeout: 5000,
			} );

			// Connection status should still be disconnected -- wizard is still showing.
			await expect(
				sidebar.getByRole( 'heading', { name: 'Step 2 of 2: Enter Credentials', exact: true } )
			).toBeVisible();
			await expect( sidebar.getByLabel( 'Product Name', { exact: true } ) ).toBeHidden();
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
			await page.locator( 'button[aria-label="Block Inserter"]' ).click();
			await page.locator( 'input[placeholder="Search"]' ).fill( 'PayPal' );

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

	// ---------------------------------------------------------------
	// 10. Format Switcher (WOOPTP-389)
	// ---------------------------------------------------------------
	test.describe( 'Format Switcher', () => {
		/**
		 * Select the block, open the Settings sidebar and return the "Embed as" select.
		 *
		 * The switcher is in the sidebar in the top document, under the link details.
		 * It shows once the block has a payment link.
		 *
		 * @param {object} page  - Playwright page.
		 * @param {object} block - Block locator inside the canvas.
		 * @return {Promise<object>} The `Embed as` select locator.
		 */
		async function openFormatSwitcher( page, block ) {
			const sidebar = await openBlockSidebar( page, block );

			const switcher = sidebar.locator( '.jetpack-paypal-payment-buttons__format-switcher select' );
			await expect( switcher ).toBeVisible( { timeout: 5000 } );

			return switcher;
		}

		test( 'format switcher still drives the format after the button is created', async ( {
			page,
		} ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );
			await fillButtonForm( page );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await page.getByRole( 'button', { name: 'Save draft' } ).click();

			const switcher = await openFormatSwitcher( page, block );
			await expect( switcher ).toHaveValue( 'BUTTON' );

			await switcher.selectOption( 'QR' );

			await expect( switcher ).toHaveValue( 'QR' );
			await expect( block.locator( '.jetpack-paypal-button-preview--qr' ) ).toBeVisible();
		} );

		test( 'changing the format reuses the link on save', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			const canvas = await insertPayPalBlock( page );
			await fillButtonForm( page, { name: 'Format Switch Test', price: '25.00' } );

			const block = canvas.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await page.getByRole( 'button', { name: 'Save draft' } ).click();

			const switcher = await openFormatSwitcher( page, block );
			const created = recordCreateRequests( page );

			await switcher.selectOption( 'QR' );

			await expect( switcher ).toHaveValue( 'QR' );
			await expect( block.locator( '.jetpack-paypal-button-preview--qr' ) ).toBeVisible();

			// Saving after the switch reuses the link. The sync runs before the post
			// saves, so any create has gone out by 'Saved'.
			await page.getByRole( 'button', { name: 'Save draft' } ).click();
			await expect( page.locator( '.editor-post-saved-state' ) ).toContainText( 'Saved', {
				timeout: 10000,
			} );

			expect( created ).toEqual( [] );
		} );
	} );
} );
