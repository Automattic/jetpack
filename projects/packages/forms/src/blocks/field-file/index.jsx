import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
import defaultSettings from '../shared/settings/index.js';
import edit from './edit.jsx';
import save from './save.jsx';

export const name = 'field-file';

export const form_editor = {
	category: 'advanced',
};

/**
 * Conditional logic: how this field's value is compared.
 *
 * Declared per block so the rule builder can offer the right operators and value
 * input. A block that omits this simply gets no conditional-logic support.
 */
export const conditional_logic = {
	type: 'file',
};

export const settings = {
	...defaultSettings,
	attributes: {
		...defaultSettings.attributes,
		/*
		 * Lowercase, where the other field blocks use camelCase (`iconStyle`, `dateFormat`).
		 *
		 * Either works. Contact_Form_Field runs its attributes through shortcode_atts() against an
		 * all-lowercase list of defaults and drops anything that does not match, but a field block
		 * serializes to `[contact-field …]` text on its way there, and WordPress's own
		 * shortcode_parse_atts() lowercases attribute names as it reads that text back — which is why
		 * the camelCase ones arrive intact.
		 *
		 * Named to match the PHP side so it does not depend on that round-trip happening. The
		 * attributes reach the constructor directly when a field is parsed inside a form that is
		 * already being processed, and nothing lowercases them on that path.
		 */
		maxfiles: {
			type: 'number',
			default: 1,
		},
	},
	title: __( 'File upload field', 'jetpack-forms' ),
	keywords: [
		__( 'File', 'jetpack-forms' ),
		__( 'Upload', 'jetpack-forms' ),
		__( 'Attachment', 'jetpack-forms' ),
		__( 'Dropzone', 'jetpack-forms' ),
	],
	description: __( 'Allow visitors to upload files through your form.', 'jetpack-forms' ),
	icon: {
		src: <Icon icon={ upload } />,
	},
	edit,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'File upload', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/dropzone',
			},
		],
	},
};

export default {
	name,
	settings,
	form_editor,
	conditional_logic,
};
