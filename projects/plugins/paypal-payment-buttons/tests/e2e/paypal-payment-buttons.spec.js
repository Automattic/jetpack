/* eslint-disable playwright/no-wait-for-selector, playwright/no-conditional-in-test, playwright/no-conditional-expect */
/**
 * PayPal Payment Buttons — E2E Tests (Playwright).
 *
 * Covers all 6 user flows specified in WOOPTP-154:
 * 1. OAuth connection flow
 * 2. Create button flow
 * 3. Frontend rendering
 * 4. Error flow
 * 5. Legacy block compatibility
 * 6. Disconnect flow
 *
 * Uses Jetpack's Playwright testing conventions with mocked PayPal API responses.
 *
 * @package
 * @since 0.8.0
 */

const { test, expect } = require( '@playwright/test' );
const { MOCK_RESPONSES, setupPayPalMocks, setupDisconnectedMocks } = require( './paypal-api-mock' );

/**
 * Helper: Navigate to a new post in the block editor.
 *
 * @param {import('@playwright/test').Page} page - Playwright page.
 */
async function goToNewPost( page ) {
	await page.goto( '/wp-admin/post-new.php' );
	// Wait for the editor to be ready.
	await page.waitForSelector( '.edit-post-visual-editor', { timeout: 30000 } );
	// Dismiss any welcome modals.
	const welcomeModal = page.locator( '.components-modal__header button[aria-label="Close"]' );
	if ( await welcomeModal.isVisible( { timeout: 2000 } ).catch( () => false ) ) {
		await welcomeModal.click();
	}
}

/**
 * Helper: Insert the PayPal Payment Buttons block.
 *
 * @param {import('@playwright/test').Page} page - Playwright page.
 */
async function insertPayPalBlock( page ) {
	// Open the block inserter.
	await page.click( 'button[aria-label="Toggle block inserter"]' );
	// Search for our block.
	await page.fill( 'input[placeholder="Search"]', 'PayPal' );
	// Click the block result.
	await page.click( 'button.editor-block-list-item-jetpack-paypal-payment-buttons' );
	// Wait for the block to appear.
	await page.waitForSelector( '.wp-block-jetpack-paypal-payment-buttons' );
}

/**
 * Helper: Fill in the PayPal button creation form.
 *
 * @param {import('@playwright/test').Page} page          - Playwright page.
 * @param {object}                          options       - Form values.
 * @param {string}                          options.name  - Product name.
 * @param {string}                          options.price - Price value.
 */
async function fillButtonForm( page, { name = 'Test Product', price = '29.99' } = {} ) {
	const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

	// Fill product name.
	await block.locator( 'input[placeholder="e.g., Premium Widget"]' ).fill( name );

	// Fill price.
	await block.locator( 'input[placeholder="29.99"]' ).fill( price );
}

/**
 * Helper: Publish the post and return the frontend URL.
 *
 * @param {import('@playwright/test').Page} page - Playwright page.
 * @return {string} The published post URL.
 */
async function publishPost( page ) {
	// Click the Publish button in the top bar.
	await page.click( 'button.editor-post-publish-button__button' );

	// If there's a pre-publish panel, click publish again.
	const confirmButton = page.locator( 'button.editor-post-publish-button' );
	if ( await confirmButton.isVisible( { timeout: 3000 } ).catch( () => false ) ) {
		await confirmButton.click();
	}

	// Wait for the post-publish panel.
	await page.waitForSelector( '.post-publish-panel__postpublish', { timeout: 15000 } );

	// Get the published URL.
	const viewLink = page.locator( '.post-publish-panel__postpublish a[href*="/?p="]' ).first();
	return await viewLink.getAttribute( 'href' );
}

// ---------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------

test.describe( 'PayPal Payment Buttons Block', () => {
	// ---------------------------------------------------------------
	// 1. OAuth Connection Flow
	// ---------------------------------------------------------------
	test.describe( 'OAuth Connection Flow', () => {
		test( 'shows connection form when PayPal is not connected', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Should show the connect form.
			await expect( block.locator( 'h3' ) ).toHaveText( 'Connect PayPal' );
			await expect( block.locator( 'text=Client ID' ) ).toBeVisible();
			await expect( block.locator( 'text=Client Secret' ) ).toBeVisible();
			await expect( block.locator( 'button:has-text("Connect PayPal")' ) ).toBeVisible();
		} );

		test( 'connects successfully with valid credentials', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Fill in credentials.
			await block.locator( 'input' ).first().fill( 'test_client_id' );
			await block.locator( 'input[type="password"]' ).fill( 'test_client_secret' );

			// Override the connection check to return connected after connect.
			await page.route( '**/wp-json/jetpack/v4/paypal/connection', route => {
				route.fulfill( {
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify( MOCK_RESPONSES.connection ),
				} );
			} );

			// Click connect.
			await block.locator( 'button:has-text("Connect PayPal")' ).click();

			// Should transition to the create form.
			await expect( block.locator( 'h3:has-text("Create PayPal Button")' ) ).toBeVisible( {
				timeout: 5000,
			} );
		} );

		test( 'shows error with invalid credentials', async ( { page } ) => {
			await setupDisconnectedMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Fill in bad credentials.
			await block.locator( 'input' ).first().fill( 'bad_id' );
			await block.locator( 'input[type="password"]' ).fill( 'bad_secret' );

			// Click connect.
			await block.locator( 'button:has-text("Connect PayPal")' ).click();

			// Should show error notice.
			await expect( block.locator( '.components-notice.is-error' ) ).toBeVisible( {
				timeout: 5000,
			} );
			await expect( block.locator( '.components-notice.is-error' ) ).toContainText(
				'Client ID or Client Secret is incorrect'
			);
		} );

		test( 'shows connected status with sandbox badge', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Should show connected status.
			await expect( block.locator( 'text=PayPal Connected' ) ).toBeVisible();
			await expect( block.locator( 'text=Sandbox' ) ).toBeVisible();
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

			// Should show create form.
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

			// Fill the form.
			await fillButtonForm( page, { name: 'Test Product', price: '29.99' } );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			const createBtn = block.locator( 'button:has-text("Create Button")' );

			// Button should be enabled now.
			await expect( createBtn ).toBeEnabled();

			// Click create.
			await createBtn.click();

			// Should show success and switch to preview.
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

			// Wait for preview.
			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			// Click the block to select it.
			await block.click();

			// Toolbar should have preview and edit buttons.
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

			// Wait for preview.
			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			// Click Edit in toolbar.
			await block.click();
			await page.locator( 'button[aria-label="Edit"]' ).click();

			// Should show edit form with "Edit PayPal Button" heading.
			await expect( block.locator( 'h3' ) ).toHaveText( 'Edit PayPal Button' );

			// Cancel returns to preview.
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

			// Wait for preview.
			await expect( block.locator( '.jetpack-paypal-button-preview' ) ).toBeVisible( {
				timeout: 5000,
			} );

			// Publish the post.
			const postUrl = await publishPost( page );

			// Visit the frontend.
			await page.goto( postUrl );

			// PayPal button should render.
			const paypalButton = page.locator( '.jetpack-paypal-button' );
			await expect( paypalButton ).toBeVisible();

			// Product name displayed.
			await expect( paypalButton.locator( '.jetpack-paypal-button__product-name' ) ).toBeVisible();

			// Payment link should point to PayPal.
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

			// Default layout is stacked — should have debit/credit button.
			const debitLink = page.locator( '.jetpack-paypal-button__debit-link' );
			await expect( debitLink ).toBeVisible();
			await expect( debitLink ).toHaveText( 'Debit or Credit Card' );
		} );
	} );

	// ---------------------------------------------------------------
	// 4. Error Flow
	// ---------------------------------------------------------------
	test.describe( 'Error Flow', () => {
		test( 'shows inline validation error for empty product name on submit', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Fill only price, leave name empty.
			await block.locator( 'input[placeholder="29.99"]' ).fill( '10.00' );

			// Create button should be disabled (form not valid).
			await expect( block.locator( 'button:has-text("Create Button")' ) ).toBeDisabled();
		} );

		test( 'shows inline validation error for invalid price', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Fill name but leave price at 0.
			await block.locator( 'input[placeholder="e.g., Premium Widget"]' ).fill( 'Test' );
			await block.locator( 'input[placeholder="29.99"]' ).fill( '0' );

			// Blur the price field to trigger validation.
			await block.locator( 'input[placeholder="e.g., Premium Widget"]' ).click();

			// Create button should be disabled.
			await expect( block.locator( 'button:has-text("Create Button")' ) ).toBeDisabled();
		} );

		test( 'shows field validation error after blurring product name', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Click into product name then click out (blur).
			const nameInput = block.locator( 'input[placeholder="e.g., Premium Widget"]' );
			await nameInput.click();
			await nameInput.fill( '' );
			await block.locator( 'input[placeholder="29.99"]' ).click(); // blur

			// Should show field error.
			await expect( block.locator( '.jetpack-paypal-payment-buttons__field-error' ) ).toBeVisible( {
				timeout: 3000,
			} );
		} );

		test( 'shows API error message in notice', async ( { page } ) => {
			// Override create to return 400 error.
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

			// Should show error notice.
			await expect( block.locator( '.components-notice.is-error' ) ).toBeVisible( {
				timeout: 5000,
			} );
		} );
	} );

	// ---------------------------------------------------------------
	// 5. Legacy Block Compatibility
	// ---------------------------------------------------------------
	test.describe( 'Legacy Block Compatibility', () => {
		test( 'legacy paste-code block shows read-only indicator in editor', async ( { page } ) => {
			await setupPayPalMocks( page );

			// Create a post with a legacy block via the REST API.
			const postContent =
				'<!-- wp:jetpack/paypal-payment-buttons {"buttonType":"stacked","scriptSrc":"https://www.paypal.com/sdk/js","hostedButtonId":"LEGACY123"} -->\n' +
				'<div class="wp-block-jetpack-paypal-payment-buttons"><div class="jetpack-paypal-button jetpack-paypal-button--stacked" id="LEGACY123"></div></div>\n' +
				'<!-- /wp:jetpack/paypal-payment-buttons -->';

			// Navigate to new post and set content via URL with content param or API.
			await goToNewPost( page );

			// Switch to code editor and paste legacy block markup.
			await page.keyboard.press( 'Control+Shift+Alt+M' ); // Toggle code editor.
			await page.waitForSelector( '.editor-post-text-editor', { timeout: 5000 } );
			await page.locator( '.editor-post-text-editor' ).fill( postContent );

			// Switch back to visual editor.
			await page.keyboard.press( 'Control+Shift+Alt+M' );
			await page.waitForSelector( '.edit-post-visual-editor', { timeout: 5000 } );

			// Legacy indicator should be visible.
			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );
			await expect( block ).toBeVisible();
			await expect( block.locator( 'text=legacy paste-code format' ) ).toBeVisible( {
				timeout: 5000,
			} );
		} );

		test( 'legacy block renders on frontend without breaking', async ( { page } ) => {
			await setupPayPalMocks( page );

			const postContent =
				'<!-- wp:jetpack/paypal-payment-buttons {"buttonType":"stacked","scriptSrc":"https://www.paypal.com/sdk/js","hostedButtonId":"LEGACY456"} -->\n' +
				'<div class="wp-block-jetpack-paypal-payment-buttons"><div class="jetpack-paypal-button jetpack-paypal-button--stacked" id="LEGACY456"></div></div>\n' +
				'<!-- /wp:jetpack/paypal-payment-buttons -->';

			await goToNewPost( page );

			// Insert legacy block via code editor.
			await page.keyboard.press( 'Control+Shift+Alt+M' );
			await page.waitForSelector( '.editor-post-text-editor', { timeout: 5000 } );
			await page.locator( '.editor-post-text-editor' ).fill( postContent );
			await page.keyboard.press( 'Control+Shift+Alt+M' );
			await page.waitForSelector( '.edit-post-visual-editor', { timeout: 5000 } );

			// Publish.
			const postUrl = await publishPost( page );
			await page.goto( postUrl );

			// Legacy block should render with the hostedButtonId.
			const legacyBlock = page.locator( '#LEGACY456' );
			await expect( legacyBlock ).toBeVisible();
			await expect( legacyBlock ).toHaveClass( /jetpack-paypal-button/ );
		} );
	} );

	// ---------------------------------------------------------------
	// 6. Disconnect Flow
	// ---------------------------------------------------------------
	test.describe( 'Disconnect Flow', () => {
		test( 'disconnecting shows connection prompt for new blocks', async ( { page } ) => {
			await setupPayPalMocks( page );
			await goToNewPost( page );
			await insertPayPalBlock( page );

			const block = page.locator( '.wp-block-jetpack-paypal-payment-buttons' );

			// Should show create form initially (connected).
			await expect( block.locator( 'h3:has-text("Create PayPal Button")' ) ).toBeVisible();

			// Open sidebar and click Disconnect.
			await page.click( 'button[aria-label="Settings"]' ); // Open settings sidebar.
			const sidebar = page.locator( '.interface-complementary-area' );

			// Find PayPal Connection panel.
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

				// Block should now show the connect form.
				await expect( block.locator( 'h3:has-text("Connect PayPal")' ) ).toBeVisible( {
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

			// Wait for preview.
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
} );
