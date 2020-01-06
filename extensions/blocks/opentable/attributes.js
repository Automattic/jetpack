/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { compact, reduce } from 'lodash';

const optionValues = options => options.map( option => option.value );

export const languageOptions = [
	{ value: 'en-US', label: 'English-US' },
	{ value: 'fr-CA', label: 'Français-CA' },
	{ value: 'de-DE', label: 'Deutsch-DE' },
	{ value: 'es-MX', label: 'Español-MX' },
	{ value: 'ja-JP', label: '日本語-JP' },
	{ value: 'nl-NL', label: 'Nederlands-NL' },
	{ value: 'it-IT', label: 'Italiano-IT' },
];
export const languageValues = optionValues( languageOptions );

export const getStyleOptions = rid =>
	compact( [
		{ value: 'standard', label: __( 'Standard (224 x 301 pixels)', 'jetpack' ) },
		{ value: 'tall', label: __( 'Tall (288 x 490 pixels)', 'jetpack' ) },
		{ value: 'wide', label: __( 'Wide (840 x 350 pixels)', 'jetpack' ) },
		( ! rid || rid.length === 1 ) && {
			value: 'button',
			label: __( 'Button (210 x 113 pixels)', 'jetpack' ),
		},
	] );
export const getStyleValues = rid => optionValues( getStyleOptions( rid ) );

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
		default: 'en-US',
		type: 'string',
		validValues: languageValues,
	},
	newtab: {
		default: false,
		type: 'boolean',
	},
};

export const getValidatedAttributes = ( attributeDetails, attributesToValidate ) =>
	reduce(
		attributesToValidate,
		( ret, attribute, attributeKey ) => {
			const { type, validator, validValues, default: defaultVal } = attributeDetails[
				attributeKey
			];
			if ( 'boolean' === type ) {
				ret[ attributeKey ] = !! attribute;
			} else if ( validator ) {
				ret[ attributeKey ] = validator( attribute ) ? attribute : defaultVal;
			} else if ( validValues ) {
				ret[ attributeKey ] = validValues.includes( attribute ) ? attribute : defaultVal;
			} else {
				ret[ attributeKey ] = attribute;
			}
			return ret;
		},
		{}
	);
