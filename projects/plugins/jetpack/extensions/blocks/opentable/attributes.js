import { __ } from '@wordpress/i18n';
import { compact, isEmpty } from 'lodash';

const optionValues = options => options.map( option => option.value );

export const languageOptions = [
	{ value: 'en-US', label: 'English' },
	{ value: 'fr-CA', label: 'Français' },
	{ value: 'de-DE', label: 'Deutsch' },
	{ value: 'es-MX', label: 'Español' },
	{ value: 'ja-JP', label: '日本語' },
	{ value: 'nl-NL', label: 'Nederlands' },
	{ value: 'it-IT', label: 'Italiano' },
];
export const languageValues = optionValues( languageOptions );

export const buttonStyle = {
	name: 'button',
	label: __( 'Button (210 x 113 pixels)', 'jetpack' ),
};

export const getStyleOptions = rid =>
	compact( [
		{ name: 'standard', label: __( 'Standard (224 x 301 pixels)', 'jetpack' ), isDefault: true },
		{ name: 'tall', label: __( 'Tall (288 x 490 pixels)', 'jetpack' ) },
		{ name: 'wide', label: __( 'Wide (840 x 150 pixels)', 'jetpack' ) },
		( ! rid || rid.length === 1 ) && buttonStyle,
	] );

export const getStyleValues = rid => getStyleOptions( rid ).map( option => option.name );

const siteLocale = window?.Jetpack_Editor_Initial_State?.siteLocale ?? 'en-US';

const defaultLanguage =
	! isEmpty( siteLocale ) && languageValues.includes( siteLocale ) ? siteLocale : 'en-US';

export const defaultAttributes = {
	rid: {
		default: [],
		type: 'array',
	},
	style: {
		default: 'standard',
		type: 'string',
		validValues: getStyleValues(),
	},
	iframe: {
		default: true,
		type: 'boolean',
	},
	domain: {
		default: 'com',
		type: 'string',
	},
	lang: {
		default: defaultLanguage,
		type: 'string',
		validValues: languageValues,
	},
	newtab: {
		default: false,
		type: 'boolean',
	},
	negativeMargin: {
		default: false,
		type: 'boolean',
	},
};
