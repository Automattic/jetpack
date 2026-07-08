import { __, _x } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.js';
import blockIcon from './icon.jsx';
import save from './save.js';

export const name = 'field-date';

export const form_editor = {
	category: 'advanced',
};

export const settings = {
	...defaultSettings,
	title: __( 'Date picker', 'jetpack-forms' ),
	keywords: [
		__( 'Calendar', 'jetpack-forms' ),
		_x( 'day month year', 'block search term', 'jetpack-forms' ),
	],
	description: __( 'Capture date information with a date picker.', 'jetpack-forms' ),
	icon: blockIcon,
	edit,
	providesContext: {
		...defaultSettings.providesContext,
		'jetpack/field-date-format': 'dateFormat',
	},
	attributes: {
		...defaultSettings.attributes,
		dateFormat: {
			type: 'string',
			default: 'yy-mm-dd',
		},
	},
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Date', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'text',
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
