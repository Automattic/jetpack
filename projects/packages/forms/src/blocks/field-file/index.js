import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
import { getIconColor } from '../contact-form/util/block-icons';
import defaultSettings from '../shared/settings';
import edit from './edit';
import save from './save';

const name = 'field-file';
const settings = {
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
		foreground: getIconColor(),
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
};
