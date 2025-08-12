import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { mobile } from '@wordpress/icons';
import defaultSettings from '../shared/settings';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

const name = 'field-phone';
const settings = {
	...defaultSettings,
	title: __( 'International Phone Number', 'jetpack-forms' ),
	keywords: [
		__( 'Phone', 'jetpack-forms' ),
		__( 'Cellular phone', 'jetpack-forms' ),
		__( 'Mobile', 'jetpack-forms' ),
		__( 'International', 'jetpack-forms' ),
	],
	description: __( 'Collect phone numbers from site visitors.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: <Icon icon={ mobile } />,
	},
	edit,
	attributes: {
		...defaultSettings.attributes,
		showCountrySelector: {
			type: 'boolean',
		},
		countryList: {
			type: 'array',
		},
		default: {
			type: 'string',
			default: '',
			role: 'content',
		},
		onChangeDefaultCountry: {
			type: 'function',
		},
	},
	providesContext: {
		...defaultSettings.providesContext,
		'jetpack/field-prefix-options': 'countryList',
		'jetpack/field-prefix-default': 'default',
		'jetpack/field-phone-country-toggle': 'showCountrySelector',
	},
	allowedBlocks: [ 'jetpack/label', 'jetpack/phone-input' ],
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Phone', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/phone-input',
			},
		],
	},
};

export default {
	name,
	settings,
};
