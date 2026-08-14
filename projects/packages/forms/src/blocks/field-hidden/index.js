import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import defaultSettings from '../shared/settings/index.js';
import edit from './edit.jsx';
import save from './save.js';

export const name = 'field-hidden';

export const form_editor = {
	category: 'advanced',
};

export const settings = {
	...defaultSettings,
	title: __( 'Hidden field', 'jetpack-forms' ),
	description: __(
		'Invisible to site visitors. Allows you to store extra values with each form submission.',
		'jetpack-forms'
	),
	icon: {
		src: unseen,
	},
	edit,
	save,
	attributes: {
		id: { type: 'string', default: '' },
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
	form_editor,
};
