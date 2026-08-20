/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import edit from './edit.tsx';
import icon from './icon.tsx';
import save from './save.tsx';

const name = 'fieldset-image-options';

const settings = {
	apiVersion: 3,
	title: __( 'Image Options', 'jetpack-forms' ),
	description: __( 'A list of image options for an image select field.', 'jetpack-forms' ),
	icon,
	parent: [ 'jetpack/field-image-select' ],
	allowedBlocks: [ 'jetpack/input-image-option' ],
	supports: {
		// FORMS-694: choice/option blocks flatten through the field shortcode
		// like inputs — visibility is inert; disable the control.
		visibility: false,
	},
	edit,
	save,
};

export default {
	name,
	settings,
};
