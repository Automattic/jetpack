import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.jsx';
import save from './save.jsx';

export const name = 'field-email';

export const form_editor = {
	category: 'contact-info',
};

export const settings = {
	...defaultSettings,
	title: __( 'Email field', 'jetpack-forms' ),
	keywords: [ __( 'e-mail', 'jetpack-forms' ), __( 'mail', 'jetpack-forms' ), 'email' ],
	description: __( 'Collect email addresses from your visitors.', 'jetpack-forms' ),
	icon: {
		src: <Icon icon={ envelope } />,
	},
	edit,
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Email', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'email',
				},
			},
		],
	},
};

export default {
	name,
	settings,
	form_editor,
};
