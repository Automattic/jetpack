/**
 * Internal dependencies
 */
import { initialData } from '../../admin/lib/initial-data';

const allowedVideoExtensionsAndMimetypes = initialData?.allowedVideoExtensions || {};

const allowedVideoExtensions = Object.keys( allowedVideoExtensionsAndMimetypes ).filter(
	// No .videopress file
	extension => extension !== 'videopress'
);

const fileInputExtensions = allowedVideoExtensions
	.map( extension => `.${ extension }` )
	.join( ',' );

export { allowedVideoExtensionsAndMimetypes, allowedVideoExtensions, fileInputExtensions };
