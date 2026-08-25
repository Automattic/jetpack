import { UPLOAD_TOKEN_ERROR_CODE, UploadTokenError } from '../index';

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
