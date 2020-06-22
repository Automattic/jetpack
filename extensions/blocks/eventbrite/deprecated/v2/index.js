/**
 * External dependencies
 */
import { isEmpty, omit, pick, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import save from './save';

const urlValidator = url => ! url || url.startsWith( 'http' );

const deprecatedAttributes = [
	'text',
	'backgroundColor',
	'textColor',
	'customBackgroundColor',
	'customTextColor',
	'borderRadius',
];

export default {
	attributes: {
		url: {
			type: 'string',
			validator: urlValidator,
		},
		eventId: {
			type: 'number',
		},
		style: {
			type: 'string',
		},
		// Modal button attributes, used for Button & Modal embed type.
		text: {
			type: 'string',
			default: _x( 'Register', 'verb: e.g. register for an event.', 'jetpack' ),
		},
		backgroundColor: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		customBackgroundColor: {
			type: 'string',
		},
		customTextColor: {
			type: 'string',
		},
		borderRadius: {
			type: 'number',
		},
	},
	migrate: attributes => {
		const { className } = attributes;

		const newAttributes = {
			...omit( attributes, deprecatedAttributes ),
			className: className && className.replace( 'is-style-outline', '' ),
		};
		const buttonAttributes = pick( attributes, deprecatedAttributes );

		const newInnerBlocks = [
			createBlock( 'jetpack/button', {
				element: 'a',
				text:
					buttonAttributes.text || _x( 'Register', 'verb: e.g. register for an event.', 'jetpack' ),
				...buttonAttributes,
				uniqueId: 'eventbrite-widget-id',
				className:
					className && -1 !== className.indexOf( 'is-style-outline' ) ? 'is-style-outline' : '',
			} ),
		];

		return [ newAttributes, newInnerBlocks ];
	},
	isEligible: ( attributes, innerBlocks ) =>
		'modal' === attributes.style &&
		( isEmpty( innerBlocks ) || some( pick( attributes, deprecatedAttributes ), Boolean ) ),
	save,
};
