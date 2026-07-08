import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.js';
import blockIcon from './icon.jsx';
import save from './save.js';

export const name = 'field-checkbox';

export const form_editor = {
	category: 'choice',
};

export const settings = {
	...defaultSettings,
	title: __( 'Checkbox', 'jetpack-forms' ),
	keywords: [ __( 'Confirm', 'jetpack-forms' ), __( 'Accept', 'jetpack-forms' ) ],
	description: __( 'Confirm or select information with a single checkbox.', 'jetpack-forms' ),
	icon: blockIcon,
	edit,
	attributes: {
		...defaultSettings.attributes,
		defaultValue: {
			type: 'string',
			default: '',
		},
	},
	providesContext: {
		...defaultSettings.providesContext,
		'jetpack/field-default-value': 'defaultValue',
	},
	deprecated,
	save,
	example: {
		attributes: { defaulValue: '' },
		innerBlocks: [
			{
				name: 'jetpack/option',
				attributes: {
					label: __( 'Option', 'jetpack-forms' ),
					isStandalone: true,
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
