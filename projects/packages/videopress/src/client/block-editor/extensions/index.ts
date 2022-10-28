/**
 * External dependencies
 */
import debugFactory from 'debug';
import { VideoPressExtensionProp } from './global';

const debug = debugFactory( 'videopress:extensions' );

const extensions = window?.videoPressExtensions || {};

debug( 'Extensions: %o', extensions );

/**
 * Helper function to check if a given extension is enabled.
 *
 * @param {string} extension - The extension to check.
 * @returns {boolean} - Whether the extension is enabled.
 */
export function isExtensionEnabled( extension: string ) {
	const vpExtension = extensions.find( ( ext: VideoPressExtensionProp ) => ext.name === extension );
	return !! vpExtension?.isEnabled;
}
