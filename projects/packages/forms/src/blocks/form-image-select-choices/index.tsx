/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { gallery as icon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

const name = 'form-image-select-choices';

const settings = {
	apiVersion: 3,
	title: __( 'Image choices', 'jetpack-forms' ),
	description: __( 'A list of image choices for an image select field.', 'jetpack-forms' ),
	icon,
	parent: [ 'jetpack/field-image-select' ],
	usesContext: [ 'jetpack/field-image-select-is-supersized', 'jetpack/field-share-attributes' ],
	edit,
	save,
};

export default {
	name,
	settings,
};
