import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.js';
import blockIcon from './icon.jsx';
import save from './save.js';

export const name = 'field-textarea';

export const form_editor = {
	category: 'basic',
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
};
