/**
 * PayPal API mock for Playwright E2E tests.
 *
 * Intercepts WordPress REST API calls to /jetpack/v4/paypal/* and returns
 * deterministic responses. Avoids hitting real PayPal endpoints during tests.
 *
 * @package
 * @since 0.8.0
 */

/**
 * Default mock PayPal API responses.
 */
const MOCK_RESPONSES = {
	connection: {
		connected: true,
		environment: 'production',
	},
	connectionDisconnected: {
		connected: false,
		environment: 'sandbox',
		partner_referrals_available: true,
	},
	connect: {
		connected: true,
		environment: 'sandbox',
		message: 'PayPal account connected successfully.',
	},
	disconnect: {
		connected: false,
		message: 'PayPal account disconnected.',
	},
	createButton: {
		id: 'PLB-TESTMOCK001',
		type: 'BUY_NOW',
		integration_mode: 'LINK',
		reusable: 'MULTIPLE',
		status: 'ACTIVE',
		payment_link: 'https://www.sandbox.paypal.com/ncp/payment/TESTMOCK001',
		line_items: [
			{
				name: 'Test Product',
				unit_amount: {
					currency_code: 'USD',
					value: '29.99',
				},
				quantity: '1',
			},
		],
	},
	updateButton: {
		id: 'PLB-TESTMOCK001',
		type: 'BUY_NOW',
		integration_mode: 'LINK',
		reusable: 'MULTIPLE',
		status: 'ACTIVE',
		payment_link: 'https://www.sandbox.paypal.com/ncp/payment/TESTMOCK001',
		line_items: [
			{
				name: 'Updated Product',
				unit_amount: {
					currency_code: 'USD',
					value: '39.99',
				},
				quantity: '1',
			},
		],
	},
	deleteButton: {
		deleted: true,
		resource_id: 'PLB-TESTMOCK001',
		message: 'Payment resource deleted successfully.',
	},
	error400: {
		code: 'paypal_api_invalid_request',
		message: 'Please fix the following: name is required',
		data: { status: 400 },
	},
	error403: {
		code: 'paypal_api_not_authorized',
		message: 'Your PayPal account is not authorized for Payment Links & Buttons.',
		data: { status: 403 },
	},
	error404: {
		code: 'paypal_api_resource_not_found',
		message: 'This PayPal button no longer exists.',
		data: { status: 404 },
	},
	connectError: {
		code: 'paypal_credentials_invalid',
		message: 'The Client ID or Client Secret is incorrect.',
		data: { status: 401 },
	},
};

/**
 * Match helper — uses regex-based route matching to handle query strings.
 * WordPress apiFetch appends ?_locale=user to all requests.
 */

/**
 * Set up PayPal API route mocks for a Playwright page.
 *
 * Uses regex patterns to match URLs with query strings (e.g., ?_locale=user).
 *
 * @param {import('@playwright/test').Page} page      - Playwright page.
 * @param {object}                          overrides - Optional response overrides keyed by route name.
 */
async function setupPayPalMocks( page, overrides = {} ) {
	const responses = { ...MOCK_RESPONSES, ...overrides };

	// GET /jetpack/v4/paypal/connection (with optional query string)
	await page.route( /\/wp-json\/jetpack\/v4\/paypal\/connection(\?|$)/, route => {
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( responses.connection ),
		} );
	} );

	// POST /jetpack/v4/paypal/connect (with optional query string)
	await page.route( /\/wp-json\/jetpack\/v4\/paypal\/connect(\?|$)/, route => {
		if ( route.request().method() === 'POST' ) {
			const body = route.request().postDataJSON();

			// Simulate bad credentials.
			if ( body?.client_id === 'bad_id' || body?.client_secret === 'bad_secret' ) {
				return route.fulfill( {
					status: 401,
					contentType: 'application/json',
					body: JSON.stringify( responses.connectError ),
				} );
			}

			return route.fulfill( {
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify( responses.connect ),
			} );
		}
		route.continue();
	} );

	// POST /jetpack/v4/paypal/disconnect (with optional query string)
	await page.route( /\/wp-json\/jetpack\/v4\/paypal\/disconnect(\?|$)/, route => {
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( responses.disconnect ),
		} );
	} );

	// POST /jetpack/v4/paypal/buttons (create/list — with optional query string)
	await page.route( /\/wp-json\/jetpack\/v4\/paypal\/buttons(\?|$)/, route => {
		if ( route.request().method() === 'POST' ) {
			const body = route.request().postDataJSON();
			const lineItem = body?.line_items?.[ 0 ];

			// Return a response that reflects the submitted data.
			const response = {
				...responses.createButton,
				line_items: body?.line_items || responses.createButton.line_items,
			};

			if ( lineItem?.name ) {
				response.line_items[ 0 ].name = lineItem.name;
			}

			return route.fulfill( {
				status: 201,
				contentType: 'application/json',
				body: JSON.stringify( response ),
			} );
		}

		// GET /buttons (list)
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( { items: [], total_items: 0 } ),
		} );
	} );

	// PUT/DELETE/GET /jetpack/v4/paypal/buttons/PLB-*
	await page.route( /\/wp-json\/jetpack\/v4\/paypal\/buttons\/PLB-/, route => {
		if ( route.request().method() === 'PUT' ) {
			return route.fulfill( {
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify( responses.updateButton ),
			} );
		}

		if ( route.request().method() === 'DELETE' ) {
			return route.fulfill( {
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify( responses.deleteButton ),
			} );
		}

		// GET single button
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( responses.createButton ),
		} );
	} );
}

/**
 * Set up disconnected state mock (PayPal not connected).
 *
 * @param {import('@playwright/test').Page} page - Playwright page.
 */
async function setupDisconnectedMocks( page ) {
	await setupPayPalMocks( page, {
		connection: MOCK_RESPONSES.connectionDisconnected,
	} );
}

module.exports = {
	MOCK_RESPONSES,
	setupPayPalMocks,
	setupDisconnectedMocks,
};
