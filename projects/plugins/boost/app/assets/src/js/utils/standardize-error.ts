/**
 * JavaScript offers no guarantee that caught objects in catch blocks are actually
 * Error objects. This method fixes that, for type safety. :)
 *
 * @param {*}      data           - Any thrown error data to interpret as an Error (or subclass)
 * @param {string} defaultMessage - A default message to throw if no sensible error can be found.
 * @return {Error} the data guaranteed to be an Error or subclass thereof.
 */
export function standardizeError( data: any, defaultMessage?: string ): Error {
	if ( data instanceof Error ) {
		return data;
	}

	if ( typeof data === 'string' || data instanceof String ) {
		return new Error( data.toString() );
	}

	if ( data.message ) {
		return new Error( data.message );
	}

	if ( defaultMessage ) {
		return new Error( defaultMessage );
	}

	return new Error( JSON.stringify( data ) );
}
