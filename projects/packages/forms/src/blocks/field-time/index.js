import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import edit from './edit.jsx';
import blockIcon from './icon.jsx';
import save from './save.jsx';

export const name = 'field-time';

export const form_editor = {
	category: 'advanced',
};

/**
 * Conditional logic: how this field's value is compared.
 *
 * Declared per block so the rule builder can offer the right operators and value
 * input. A block that omits this simply gets no conditional-logic support.
 */
export const conditional_logic = {
	type: 'time',
};

export const settings = {
	...defaultSettings,
	title: __( 'Time input field', 'jetpack-forms' ),
	description: __( 'Capture time information with a time picker.', 'jetpack-forms' ),
	icon: blockIcon,
	edit,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Time', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'time',
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
