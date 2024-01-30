/**
 * DataSync Error returned by the REST API.
 */
export class DataSyncError extends Error {
	public name = 'DataSyncError';
	constructor(
		public location: string,
		public status:
			| number
			| 'aborted'
			| 'error_with_message'
			| 'failed_to_sync'
			| 'json_parse_error'
			| 'json_empty'
			| 'schema_error',
		public message: string
	) {
		super( message );

		/**
		 * This makes `foo instanceof DataSyncError` work.
		 * To make instanceof work correctly
		 * set the prototype explicitly.
		 *
		 * @see https://stackoverflow.com/a/41102306/1015046
		 */
		Object.setPrototypeOf( this, DataSyncError.prototype );
	}
}
