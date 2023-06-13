export class ApiError extends Error {
	public name = 'ApiError';
	constructor(
		public location: string,
		public status: number | 'failed_to_sync' | 'json_parse_error' | 'json_empty' | 'schema_error',
		public message: string
	) {
		super( message );

		/**
		 * This makes `foo instanceof ApiError` work.
		 * To make instanceof work correctly
		 * set the prototype explicitly.
		 *
		 * @see https://stackoverflow.com/a/41102306/1015046
		 */
		Object.setPrototypeOf( this, ApiError.prototype );
	}
}
