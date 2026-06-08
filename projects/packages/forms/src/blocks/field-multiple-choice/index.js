import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.js';
import blockIcon from './icon.jsx';
import save from './save.js';

export const name = 'field-checkbox-multiple';

export const form_editor = {
	category: 'choice',
};

export const settings = {
	...defaultSettings,
	title: __( 'Multiple choice (checkbox)', 'jetpack-forms' ),
	keywords: [ __( 'Choose multiple', 'jetpack-forms' ), __( 'Option', 'jetpack-forms' ) ],
	description: __(
		'Offer users a list of choices, and allow them to select multiple options.',
		'jetpack-forms'
	),
	icon: blockIcon,
	edit,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Choose several options', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/options',
				attributes: {
					type: 'checkbox',
				},
				innerBlocks: [
					{
						name: 'jetpack/option',
						attributes: {
							label: __( 'First option', 'jetpack-forms' ),
						},
					},
					{
						name: 'jetpack/option',
						attributes: {
							label: __( 'Second option', 'jetpack-forms' ),
						},
					},
					{
						name: 'jetpack/option',
						attributes: {
							label: __( 'Third option', 'jetpack-forms' ),
						},
					},
				],
			},
		],
	},
	allowedBlocks: [ 'jetpack/label', 'jetpack/field-options' ],
	deprecated,
	save,
	styles: [
		{ name: 'list', label: __( 'List', 'jetpack-forms' ), isDefault: true },
		{ name: 'button', label: __( 'Button', 'jetpack-forms' ) },
	],
};

export default {
	name,
	settings,
	form_editor,
};
