/**
 * External dependencies
 */
import debugFactory from 'debug';
/*
 * Types
 */
import { VideoPressExtensionProps } from './types';

const debug = debugFactory( 'videopress:extensions' );

const extensions = window?.videoPressExtensions || [];

debug( 'Extensions: %o', extensions );

/**
 * Helper function to check if a given extension is enabled.
 *
 * @param {string} extension - The extension to check.
 * @returns {boolean} - Whether the extension is enabled.
 */
export function isExtensionEnabled( extension: string ) {
	const vpExtension = extensions.find(
		( ext: VideoPressExtensionProps ) => ext.name === extension
	);
	return vpExtension?.isEnabled;
}

/**
 * Hellper function to check if the given extension is beta.
 *
 * @param {string} extension - The extension to check.
 * @returns {boolean} - Whether the extension is beta.
 */
export function isBetaExtension( extension: string ) {
	const vpExtension = extensions.find(
		( ext: VideoPressExtensionProps ) => ext.name === extension
	);
	return vpExtension?.isBeta;
}
