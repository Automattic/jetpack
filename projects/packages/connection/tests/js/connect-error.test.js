const assert = require( 'node:assert/strict' );
const { before, describe, it } = require( 'node:test' );

let createRequestError;
let getConnectErrorDisplay;

before( async () => {
	( { createRequestError, getConnectErrorDisplay } =
		await import( '../../src/connectors/js/connect-error.mjs' ) );
} );

const forbidden = {
	code: 'site_inaccessible_403',
	message: 'Error setting up your site. HTTP 403.',
	data: { status: 400 },
};
const fallback = 'Connection failed. Please try again.';

// Stands in for the connection package's getRegistrationErrorDisplay(), which the card gets from the shared script.
const mapForbidden = error =>
	'site_inaccessible_403' === error.response?.code
		? { message: 'Something blocked WordPress.com.', detail: undefined }
		: { message: undefined, detail: undefined };

describe( 'createRequestError', () => {
	it( 'keeps the response body, so its code can be mapped', () => {
		const error = createRequestError( forbidden, 'Site registration failed.' );

		assert.equal( error.message, 'Error setting up your site. HTTP 403.' );
		assert.equal( error.response.code, 'site_inaccessible_403' );
	} );

	it( 'uses the fallback message when the response was not JSON', () => {
		const error = createRequestError( null, 'Site registration failed.' );

		assert.equal( error.message, 'Site registration failed.' );
		assert.equal( error.response, undefined );
	} );
} );

describe( 'getConnectErrorDisplay', () => {
	for ( const [ name, makeError, helper, expected ] of [
		[
			'the mapped message for a code the helper knows',
			() => createRequestError( forbidden, 'x' ),
			mapForbidden,
			{ message: 'Something blocked WordPress.com.', detail: null },
		],
		[
			'the raw message for a code the helper does not map',
			() => createRequestError( { code: 'made_up', message: 'Raw text.' }, 'x' ),
			mapForbidden,
			{ message: 'Raw text.', detail: null },
		],
		[
			'the raw message when an older shared script has no helper',
			() => createRequestError( forbidden, 'x' ),
			undefined,
			{ message: 'Error setting up your site. HTTP 403.', detail: null },
		],
		[
			'the fallback when the error has no message',
			() => new Error(),
			mapForbidden,
			{ message: fallback, detail: null },
		],
	] ) {
		it( `shows ${ name }`, () => {
			assert.deepEqual( getConnectErrorDisplay( makeError(), helper, fallback ), expected );
		} );
	}

	it( 'passes the detail line through', () => {
		const withDetail = () => ( {
			message: 'Your site can’t reach WordPress.com.',
			detail: 'cURL error 6',
		} );

		assert.deepEqual(
			getConnectErrorDisplay( createRequestError( forbidden, 'x' ), withDetail, fallback ),
			{
				message: 'Your site can’t reach WordPress.com.',
				detail: 'cURL error 6',
			}
		);
	} );
} );
