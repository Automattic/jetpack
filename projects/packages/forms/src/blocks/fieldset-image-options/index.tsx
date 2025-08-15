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

const name = 'fieldset-image-options';

const settings = {
	apiVersion: 3,
	title: __( 'Image options', 'jetpack-forms' ),
	description: __( 'A list of image options for an image select field.', 'jetpack-forms' ),
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
