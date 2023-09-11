/**
 * WordPress dependencies
 */
import { isURL, getProtocol } from '@wordpress/url';

/**
 * Determines if a URL points to a local file.
 *
 * @param {string} url 	- URL to check.
 * @returns {boolean} 	- True if the URL points to a local file.
 */
export default function isLocalFile( url ) {
	return !! url && isURL( url ) && getProtocol( url ) === 'file:';
}
