import type { JSONValue } from './json-types';

/**
 * JavaScript offers no guarantee that caught objects in catch blocks are actually
 * Error objects. This method fixes that, for type safety. :)
 *
 * @param {*}               data           - Any thrown error data to interpret as an Error (or subclass)
 * @param {JSONValue|Error} defaultMessage - A default message to throw if no sensible error can be found.
 * @return {Error} the data guaranteed to be an Error or subclass thereof.
 */
export function standardizeError( data: JSONValue | Error, defaultMessage?: string ): Error {
	if ( data instanceof Error ) {
		return data;
	}

	if ( typeof data === 'string' || data instanceof String ) {
		return new Error( data.toString() );
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	if ( data.message ) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return new Error( data.message );
	}

	if ( defaultMessage ) {
		return new Error( defaultMessage );
	}

	return new Error( JSON.stringify( data ) );
}
