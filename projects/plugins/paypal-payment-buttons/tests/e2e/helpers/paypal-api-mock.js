/**
 * PayPal API mock for Playwright E2E tests.
 *
 * Answers WordPress REST API calls to /wpcom/v2/paypal/* with deterministic
 * responses, so tests never hit real PayPal endpoints. Unmocked calls are aborted.
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
	signupLink: {
		action_url: 'https://www.sandbox.paypal.com/bizsignup/partner/entry?referralToken=TESTMOCK',
		referral_id: 'TESTMOCK',
		environment: 'sandbox',
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

const NAMESPACE = '/wpcom/v2/paypal';

// Unmocked PayPal requests, keyed by page.
const unmockedRequests = new WeakMap();

/**
 * Build the `attributes` the create route adds to its response. Mirrors
 * PayPal_Attribute_Mapper::api_response_to_attributes() for the fields the e2e specs send.
 * The editor resets a missing key to its block.json default.
 *
 * @param {object} resource - The payment as the route returns it.
 * @return {object} The payment as block attributes.
 */
function toAttributes( resource ) {
	const [ item ] = resource.line_items;

	return {
		isApiManaged: true,
		resourceId: resource.id,
		paymentLink: resource.payment_link,
		productName: item.name,
		// Per-option prices replace unit_amount.
		...( item.unit_amount
			? { currencyCode: item.unit_amount.currency_code, price: item.unit_amount.value }
			: {} ),
		collectShippingAddress: !! item.collect_shipping_address,
		integrationMode: resource.integration_mode,
		// The mock has no code_snippets, so scriptSrc is empty.
		scriptSrc: '',
	};
}

/**
 * Match a PayPal REST route under pretty or plain permalinks.
 *
 * The route is in the path (`/wp-json/wpcom/v2/paypal/…`), or in the `rest_route`
 * param under plain permalinks, as in the e2e Docker site. Other query args are ignored.
 *
 * @param {string|RegExp} path - The route after the namespace, e.g. `/connection`. A string matches exactly.
 * @return {Function} Takes a URL or URL string, returns whether it is that route.
 */
function paypalRoute( path ) {
	return url => {
		const { pathname, searchParams } = new URL( url );
		const route = searchParams.get( 'rest_route' ) ?? pathname.replace( /^.*?\/wp-json/, '' );

		if ( ! route.startsWith( `${ NAMESPACE }/` ) ) {
			return false;
		}

		const subPath = route.slice( NAMESPACE.length );
		return typeof path === 'string' ? subPath === path : path.test( subPath );
	};
}

/**
 * Get the PayPal requests the catch-all aborted on a page.
 *
 * @param {import('@playwright/test').Page} page - Playwright page.
 * @return {string[]} Method and URL of each one.
 */
function getUnmockedRequests( page ) {
	return unmockedRequests.get( page ) ?? [];
}

/**
 * Set up PayPal API route mocks for a Playwright page.
 *
 * @param {import('@playwright/test').Page} page      - Playwright page.
 * @param {object}                          overrides - Optional response overrides keyed by route name.
 */
async function setupPayPalMocks( page, overrides = {} ) {
	const responses = { ...MOCK_RESPONSES, ...overrides };

	// Record and abort every PayPal request the mocks below leave unhandled.
	// Registered first so it runs last (Playwright tries the newest route first).
	const unmocked = [];
	unmockedRequests.set( page, unmocked );
	await page.route( paypalRoute( /^/ ), route => {
		unmocked.push( `${ route.request().method() } ${ route.request().url() }` );
		return route.abort();
	} );

	// GET /wpcom/v2/paypal/connection
	await page.route( paypalRoute( '/connection' ), route => {
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( responses.connection ),
		} );
	} );

	// POST /wpcom/v2/paypal/connect
	await page.route( paypalRoute( '/connect' ), route => {
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
		route.fallback();
	} );

	// POST /wpcom/v2/paypal/onboarding/signup-link, requested as soon as the Welcome step shows.
	await page.route( paypalRoute( '/onboarding/signup-link' ), route => {
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( responses.signupLink ),
		} );
	} );

	// POST /wpcom/v2/paypal/disconnect
	await page.route( paypalRoute( '/disconnect' ), route => {
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( responses.disconnect ),
		} );
	} );

	// The button as last created or updated, returned by GET /buttons/PLB-*.
	let created = {
		...responses.createButton,
		attributes: toAttributes( responses.createButton ),
	};

	// POST/GET /wpcom/v2/paypal/buttons (create/list)
	await page.route( paypalRoute( '/buttons' ), route => {
		if ( route.request().method() === 'POST' ) {
			const body = route.request().postDataJSON();

			// Return a response that reflects the submitted data.
			const response = {
				...responses.createButton,
				line_items: body?.line_items || responses.createButton.line_items,
			};

			created = { ...response, attributes: toAttributes( response ) };
			return route.fulfill( {
				status: 201,
				contentType: 'application/json',
				body: JSON.stringify( created ),
			} );
		}

		// GET /buttons (list)
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( { resources: [] } ),
		} );
	} );

	// PUT/DELETE/GET /wpcom/v2/paypal/buttons/PLB-*
	await page.route( paypalRoute( /^\/buttons\/PLB-[A-Za-z0-9]+$/ ), route => {
		// apiFetch sends PUT and DELETE as a POST with the real method in X-HTTP-Method-Override.
		const method =
			route.request().headers()[ 'x-http-method-override' ] ?? route.request().method();

		if ( method === 'PUT' ) {
			const { include_snippets: readBack, ...sent } = route.request().postDataJSON();
			const resource = { ...created, ...sent };
			created = { ...resource, attributes: toAttributes( resource ) };

			// Like the real route: the payment read back when asked, else what was sent plus the id.
			return route.fulfill( {
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify( readBack ? created : { ...sent, id: created.id } ),
			} );
		}

		if ( method === 'DELETE' ) {
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
			body: JSON.stringify( created ),
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

export {
	MOCK_RESPONSES,
	getUnmockedRequests,
	paypalRoute,
	setupPayPalMocks,
	setupDisconnectedMocks,
};
