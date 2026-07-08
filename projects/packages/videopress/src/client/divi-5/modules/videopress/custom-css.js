/**
 * Custom CSS field definitions for the Divi 5 VideoPress module, sourced from
 * `module.json` and labelled for the Visual Builder.
 */
import { __ } from '@wordpress/i18n';
import metadata from './module.json';

// Label the fields for the Visual Builder without mutating the imported
// `module.json` (which is re-exported as the module metadata).
export const cssFields = {
	videoPlayer: {
		...metadata.customCssFields.videoPlayer,
		label: __( 'Video Player', 'jetpack-videopress-pkg' ),
	},
};
