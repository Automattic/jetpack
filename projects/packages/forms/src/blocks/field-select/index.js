import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.jsx';
import blockIcon from './icon.jsx';
import save from './save.jsx';

export const name = 'field-select';

export const form_editor = {
	category: 'choice',
};

export const settings = {
	...defaultSettings,
	title: __( 'Dropdown field', 'jetpack-forms' ),
	keywords: [
		__( 'Choose', 'jetpack-forms' ),
		__( 'Dropdown', 'jetpack-forms' ),
		__( 'Option', 'jetpack-forms' ),
	],
	description: __(
		'Add a compact select box, that when expanded, allows visitors to choose one value from the list.',
		'jetpack-forms'
	),
	icon: blockIcon,
	edit,
	attributes: {
		...defaultSettings.attributes,
		options: {
			type: 'array',
			default: [ '' ],
			role: 'content',
		},
	},
	deprecated,
	save,
	example: {
		attributes: {
			options: [
				__( 'First option', 'jetpack-forms' ),
				__( 'Second option', 'jetpack-forms' ),
				__( 'Third option', 'jetpack-forms' ),
			],
		},
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Dropdown', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: { type: 'dropdown', placeholder: __( 'Select one option', 'jetpack-forms' ) },
			},
		],
	},
};

export default {
	name,
	settings,
	form_editor,
};
