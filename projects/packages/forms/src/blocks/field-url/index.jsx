import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.jsx';
import save from './save.jsx';

export const name = 'field-url';

export const form_editor = {
	category: 'contact-info',
};

export const settings = {
	...defaultSettings,
	title: __( 'Website field', 'jetpack-forms' ),
	keywords: [
		__( 'url', 'jetpack-forms' ),
		__( 'internet page', 'jetpack-forms' ),
		__( 'link', 'jetpack-forms' ),
		__( 'website', 'jetpack-forms' ),
	],
	description: __( 'Collect a website address from your site visitors.', 'jetpack-forms' ),
	icon: {
		src: <Icon icon={ globe } />,
	},
	edit,
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Website', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'url',
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
