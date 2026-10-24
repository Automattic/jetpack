/**
 * `code` carried by the error raised when the upload JWT can't be obtained.
 */
export const UPLOAD_TOKEN_ERROR_CODE = 'videopress_no_upload_token';

/**
 * The error raised when the upload JWT can't be obtained.
 */
export class UploadTokenError extends Error {
	public readonly code = UPLOAD_TOKEN_ERROR_CODE;

	/** Build the error consumed by connection-recovery guidance. */
	constructor() {
		super( 'No token provided' );
		this.name = 'UploadTokenError';
	}
}
