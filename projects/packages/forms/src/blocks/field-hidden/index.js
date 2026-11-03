import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import defaultSettings from '../shared/settings/index.js';
import edit from './edit.jsx';
import save from './save.js';

export const name = 'field-hidden';

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
	type: 'hidden',
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
	conditional_logic,
};
