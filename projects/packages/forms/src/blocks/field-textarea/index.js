import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.jsx';
import blockIcon from './icon.jsx';
import save from './save.jsx';

export const name = 'field-textarea';

export const form_editor = {
	category: 'basic',
};

/**
 * Conditional logic: how this field's value is compared.
 *
 * Declared per block so the rule builder can offer the right operators and value
 * input. A block that omits this simply gets no conditional-logic support.
 */
export const conditional_logic = {
	type: 'string',
};

export const settings = {
	...defaultSettings,
	title: __( 'Multi-line text field', 'jetpack-forms' ),
	keywords: [
		__( 'Textarea', 'jetpack-forms' ),
		'textarea',
		__( 'Multiline text', 'jetpack-forms' ),
	],
	description: __( 'Capture longform text responses from site visitors.', 'jetpack-forms' ),
	icon: blockIcon,
	edit,
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Message', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'textarea',
				},
			},
		],
	},
};

export default {
	name,
	settings,
	form_editor,
	conditional_logic,
};
