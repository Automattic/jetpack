import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
import defaultSettings from '../shared/settings/index.js';
import edit from './edit.js';
import save from './save.js';

export const name = 'field-file';

export const form_editor = {
	category: 'advanced',
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
};
