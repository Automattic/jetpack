import { Path } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon.js';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.js';
import save from './save.js';

export const name = 'field-date';

export const form_editor = {
	category: 'advanced',
};

export const settings = {
	...defaultSettings,
	supports: {
		...defaultSettings.supports,
	},
	title: __( 'Date picker', 'jetpack-forms' ),
	keywords: [
		__( 'Calendar', 'jetpack-forms' ),
		_x( 'day month year', 'block search term', 'jetpack-forms' ),
	],
	description: __( 'Capture date information with a date picker.', 'jetpack-forms' ),
	icon: {
		src: renderMaterialIcon(
			<Path
				fillRule="evenodd"
				d="M4.5 7H19.5V19C19.5 19.2761 19.2761 19.5 19 19.5H5C4.72386 19.5 4.5 19.2761 4.5 19V7ZM3 5V7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5ZM11 9.25H7V13.25H11V9.25Z"
			/>
		),
	},
	edit,
	providesContext: {
		...defaultSettings.providesContext,
		'jetpack/field-date-format': 'dateFormat',
	},
	attributes: {
		...defaultSettings.attributes,
		dateFormat: {
			type: 'string',
			default: 'yy-mm-dd',
		},
	},
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Date', 'jetpack-forms' ),
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
