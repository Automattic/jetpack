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
const fallback = 'An error occurred. Please try again.';

// Stands in for the connection package's getRegistrationErrorDisplay(), which the card gets from the shared script:
// mapped copy for a known code, else the site's message without markup, and nothing for a status-only or markup-only one.
const mapForbidden = error => {
	if ( 'site_inaccessible_403' === error.response?.code ) {
		return { message: 'Something blocked WordPress.com.', detail: undefined };
	}
	const text = ( error.response?.message ?? '' )
		.replace( /<[^<>]*>/g, ' ' )
		.replace( /\s+/g, ' ' )
		.trim();
	return { message: /^\d*$/.test( text ) ? undefined : text, detail: undefined };
};

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
			'the helper’s cleaned-up site message for a code it does not map',
			() => createRequestError( { code: 'made_up', message: 'Check <b>your</b> firewall.' }, 'x' ),
			mapForbidden,
			{ message: 'Check your firewall.', detail: null },
		],
		[
			'the fallback for a status-only message the helper drops',
			() => createRequestError( { code: 'made_up', message: '500' }, 'x' ),
			mapForbidden,
			{ message: fallback, detail: null },
		],
		[
			'the fallback for a markup-only message the helper drops',
			() => createRequestError( { code: 'made_up', message: '<br /><b></b>' }, 'x' ),
			mapForbidden,
			{ message: fallback, detail: null },
		],
		[
			'the error’s own message when the request got no response body',
			() => new Error( 'Site registration failed.' ),
			mapForbidden,
			{ message: 'Site registration failed.', detail: null },
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
