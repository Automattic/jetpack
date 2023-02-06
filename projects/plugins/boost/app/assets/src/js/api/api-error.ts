import { __, sprintf } from '@wordpress/i18n';
import { castToString } from '../utils/cast-to-string';
import { isJsonObject, JSONObject } from '../utils/json-types';

/**
 * Special error subclass returned by API Calls with extra
 * information.
 */
export class ApiError extends Error {
	public constructor(
		public readonly httpCode: number,
		public readonly body: JSONObject | string | null,
		public readonly parseError: Error | null
	) {
		super();
	}

	/**
	 * Override Error.message to generate a message based on http code and json body.
	 */
	get message(): string {
		switch ( this.httpCode ) {
			case 403: {
				return this.getRestApiErrorMessage();
			}

			// For HTTP 200 responses, look for JSON parsing issues.
			case 200: {
				if ( this.parseError ) {
					return sprintf(
						/* Translators: %s refers to a browser-supplied error message (hopefully already in the right language) */
						__(
							'Received invalid response while communicating with your WordPress site: %s',
							'jetpack-boost'
						),
						this.parseError.message
					);
				}

				break;
			}
		}

		return sprintf(
			/* Translators: %d refers to numeric HTTP error code */
			__( 'HTTP %d error received while communicating with the server.', 'jetpack-boost' ),
			this.httpCode
		);
	}

	/**
	 * Returns the body of this in a string format for display. Pretty printed JSON if valid, raw dump if not.
	 */
	public getDisplayBody(): string {
		if ( isJsonObject( this.body ) ) {
			return JSON.stringify( this.body, null, '  ' );
		}
		return castToString( this.body, '' ).substring( 0, 1000 );
	}

	/**
	 * Returns an error message appropriate for a site whose API doesn't seem to be available.
	 */
	getRestApiErrorMessage(): string {
		return __(
			"Your site's REST API does not seem to be accessible. Jetpack Boost requires access to your REST API in order to receive site performance scores. Please make sure that your site's REST API is active and accessible, and try again.",
			'jetpack-boost'
		);
	}
}
