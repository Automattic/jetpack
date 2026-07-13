import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.jsx';
import blockIcon from './icon.jsx';
import save from './save.jsx';

export const name = 'field-text';

export const form_editor = {
	category: 'basic',
};

export const settings = {
	...defaultSettings,
	title: __( 'Text input field', 'jetpack-forms' ),
	description: __( 'Collect short text responses from site visitors.', 'jetpack-forms' ),
	icon: blockIcon,
	edit,
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Text', 'jetpack-forms' ),
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
