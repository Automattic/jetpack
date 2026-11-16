// Broader than an RFC address on purpose, but the domain must carry a dot, so a Firefox stack frame
// such as `render@https://host/x.js:1:1` is not mistaken for one and erased. The local part stops at
// a slash and at the delimiters of a query string, so an address written into a URL path or a
// parameter value costs that one segment and not the path around it. Every part stays bounded and
// the domain is matched label by label: unbounded, a long run of text holding no address backtracks
// quadratically.
const EMAIL = /[^\s<>()[\]{}",;:@&=/]{1,64}@(?:[A-Za-z0-9-]{1,63}\.){1,8}[A-Za-z]{2,24}/g;

export const EMAIL_MASK = '[email]';

/**
 * Replaces every email address in decoded text with the mask.
 *
 * @param text - Text that may carry an address, already percent-decoded.
 * @return The text with each address masked.
 */
export function maskEmails( text: string ): string {
	return text.replace( EMAIL, EMAIL_MASK );
}

/**
 * Percent-encodes a decoded value, leaving any mask in it readable.
 *
 * @param value - A decoded value, possibly masked.
 * @return The value, encoded for a query string.
 */
export function encodeMasked( value: string ): string {
	return value.split( EMAIL_MASK ).map( encodeURIComponent ).join( EMAIL_MASK );
}
