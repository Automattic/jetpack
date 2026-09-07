import { classifyUploadFailure } from '../upload-failure';
import type { UploadItem } from '../../../src/dashboard/hooks/use-upload';

const failed = ( errorCode?: string ): Pick< UploadItem, 'status' | 'errorCode' > => ( {
	status: 'failed',
	errorCode,
} );

describe( 'classifyUploadFailure', () => {
	it( 'attributes a token failure on a broken connection to the connection', () => {
		expect( classifyUploadFailure( failed( 'videopress_no_upload_token' ), true ) ).toBe(
			'connection'
		);
	} );

	it( 'does not blame the connection for a token failure when none is reported', () => {
		// WordPress.com can decline to mint a token for its own reasons.
		expect( classifyUploadFailure( failed( 'videopress_no_upload_token' ), false ) ).toBe(
			'other'
		);
	} );

	it( 'does not blame the connection for an unrelated failure on a broken site', () => {
		// The file that was simply too large must not be reported as a connection problem.
		expect( classifyUploadFailure( failed(), true ) ).toBe( 'other' );
		expect( classifyUploadFailure( failed( 'some_other_code' ), true ) ).toBe( 'other' );
	} );

	it( 'returns "other" for an upload that has not failed', () => {
		expect( classifyUploadFailure( { status: 'uploading', errorCode: undefined }, true ) ).toBe(
			'other'
		);
	} );
} );
