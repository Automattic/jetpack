import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.jsx';
import edit from './edit.jsx';
import blockIcon from './icon.jsx';
import save from './save.jsx';

export const name = 'field-radio';

export const form_editor = {
	category: 'choice',
};

export const settings = {
	...defaultSettings,
	title: __( 'Single choice (radio)', 'jetpack-forms' ),
	keywords: [
		__( 'Choose', 'jetpack-forms' ),
		__( 'Select', 'jetpack-forms' ),
		__( 'Option', 'jetpack-forms' ),
	],
	description: __(
		'Offer users a list of choices, and allow them to select a single option.',
		'jetpack-forms'
	),
	icon: blockIcon,
	edit,
	allowedBlocks: [ 'jetpack/label', 'jetpack/field-options' ],
	deprecated,
	save,
	styles: [
		{ name: 'list', label: __( 'List', 'jetpack-forms' ), isDefault: true },
		{ name: 'button', label: __( 'Button', 'jetpack-forms' ) },
	],
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Choose one option', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/options',
				attributes: {
					type: 'radio',
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
				],
			},
		],
	},
};

export default {
	name,
	settings,
	form_editor,
};
