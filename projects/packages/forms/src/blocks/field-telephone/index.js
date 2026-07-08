import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { mobile } from '@wordpress/icons';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.js';
import save from './save.js';

export const name = 'field-telephone';

export const form_editor = {
	category: 'contact-info',
};

export const settings = {
	...defaultSettings,
	title: __( 'Phone number field', 'jetpack-forms' ),
	keywords: [
		__( 'Phone', 'jetpack-forms' ),
		__( 'Cellular phone', 'jetpack-forms' ),
		__( 'Mobile', 'jetpack-forms' ),
	],
	description: __( 'Collect phone numbers from site visitors.', 'jetpack-forms' ),
	icon: {
		src: <Icon icon={ mobile } />,
	},
	edit,
	attributes: {
		...defaultSettings.attributes,
		showCountrySelector: {
			type: 'boolean',
		},
		default: {
			type: 'string',
		},
		searchPlaceholder: {
			type: 'string',
			default: '',
		},
	},
	supports: {
		...defaultSettings.supports,
		interactivity: true,
	},
	providesContext: {
		...defaultSettings.providesContext,
		'jetpack/field-prefix-default': 'default',
		'jetpack/field-phone-search-placeholder': 'searchPlaceholder',
		'jetpack/field-phone-country-toggle': 'showCountrySelector',
	},
	allowedBlocks: [ 'jetpack/label', 'jetpack/phone-input' ],
	deprecated,
	save,
	example: {
		attributes: {
			default: 'US',
		},
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Phone', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/phone-input',
				attributes: {},
			},
		],
	},
};

export default {
	name,
	settings,
	form_editor,
};
