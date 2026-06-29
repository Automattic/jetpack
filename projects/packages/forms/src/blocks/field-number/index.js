import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.js';
import blockIcon from './icon.jsx';
import save from './save.js';

export const name = 'field-number';

export const form_editor = {
	category: 'basic',
};

export const settings = {
	...defaultSettings,
	title: __( 'Number input field', 'jetpack-forms' ),
	description: __( 'Collect numbers from site visitors.', 'jetpack-forms' ),
	icon: blockIcon,
	edit,
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Number', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'number',
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
