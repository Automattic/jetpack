import { getIconColor } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import defaultSettings from '../shared/settings';
import edit from './edit';
import save from './save';

const name = 'field-hidden';
const settings = {
	...defaultSettings,
	title: __( 'Hidden field', 'jetpack-forms' ),
	description: __(
		'Invisible to site visitors. Allows you to store extra values with each form submission.',
		'jetpack-forms'
	),
	icon: {
		foreground: getIconColor(),
		src: unseen,
	},
	edit,
	save,
	attributes: {
		label: { type: 'string', default: '' },
		default: { type: 'string', default: '' },
	},
	example: {
		attributes: {
			label: __( 'Company_ID', 'jetpack-forms' ),
			default: __( 'ACME Inc.', 'jetpack-forms' ),
		},
	},
};

export default {
	name,
	settings,
};
