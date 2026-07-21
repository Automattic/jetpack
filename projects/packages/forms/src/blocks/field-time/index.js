import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import edit from './edit.jsx';
import blockIcon from './icon.jsx';
import save from './save.jsx';

export const name = 'field-time';

export const form_editor = {
	category: 'advanced',
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
};
