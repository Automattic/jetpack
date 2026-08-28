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
