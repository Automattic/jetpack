import { UPLOAD_TOKEN_ERROR_CODE, UploadTokenError, isConnectionAttributedFailure } from '../index';

describe( 'UploadTokenError', () => {
	it( 'carries the code consumers branch on', () => {
		expect( new UploadTokenError().code ).toBe( UPLOAD_TOKEN_ERROR_CODE );
		expect( UPLOAD_TOKEN_ERROR_CODE ).toBe( 'videopress_no_upload_token' );
	} );

	it( 'is a real Error, so a caller that only reads `message` still works', () => {
		const error = new UploadTokenError();

		expect( error ).toBeInstanceOf( Error );
		expect( error.message ).toBe( 'No token provided' );
	} );
} );

describe( 'isConnectionAttributedFailure', () => {
	it( 'attributes a token failure on a site reporting a connection error', () => {
		expect( isConnectionAttributedFailure( UPLOAD_TOKEN_ERROR_CODE, true ) ).toBe( true );
	} );

	it( 'needs both halves: a missing token says the upload never left, not why', () => {
		expect( isConnectionAttributedFailure( UPLOAD_TOKEN_ERROR_CODE, false ) ).toBe( false );
	} );

	it( 'needs both halves: a connection error alone does not explain any failure', () => {
		expect( isConnectionAttributedFailure( undefined, true ) ).toBe( false );
	} );
} );
