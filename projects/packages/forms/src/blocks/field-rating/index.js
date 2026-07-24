import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import edit from './edit.jsx';
import blockIcon from './icon.jsx';
import save from './save.jsx';
import variations from './variations.jsx';

export const name = 'field-rating';

export const form_editor = {
	category: 'advanced',
};

export const settings = {
	...defaultSettings,
	title: __( 'Rating field', 'jetpack-forms' ),
	description: __( 'Allow visitors to select a rating.', 'jetpack-forms' ),
	icon: blockIcon,
	attributes: {
		...defaultSettings.attributes,
		max: {
			type: 'number',
			default: 5,
			role: 'content',
		},
		default: {
			type: 'number',
			default: 0,
			role: 'content',
		},
		iconStyle: {
			type: 'string',
			default: 'stars',
			role: 'appearance',
		},
	},
	providesContext: {
		...defaultSettings.providesContext,
		'jetpack/field-rating-max': 'max',
		'jetpack/field-rating-default': 'default',
		'jetpack/field-rating-iconStyle': 'iconStyle',
	},
	variations,
	allowedBlocks: [ 'jetpack/label', 'jetpack/input-rating' ],
	edit,
	save,
	example: {
		attributes: {
			max: 5,
			default: 3,
		},
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Rate your experience', 'jetpack-forms' ),
				},
			},
		],
	},
};

export default { name, settings, form_editor };
