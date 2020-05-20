/**
 * External dependencies
 */
import { isEmpty, omit, pick, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import colorValidator from '../../../../shared/colorValidator';

const urlValidator = url => ! url || url.startsWith( 'https://calendly.com/' );
const deprecatedAttributes = [
	'submitButtonText',
	'submitButtonTextColor',
	'submitButtonBackgroundColor',
	'submitButtonClasses',
	'backgroundButtonColor',
	'textButtonColor',
	'customBackgroundButtonColor',
	'customTextButtonColor',
];
const migrateAttributes = oldAttributes => ( {
	text: oldAttributes.submitButtonText || __( 'Schedule time with me', 'jetpack' ),
	textColor: oldAttributes.submitButtonTextColor || oldAttributes.textButtonColor,
	customTextColor: oldAttributes.customTextButtonColor,
	backgroundColor: oldAttributes.submitButtonBackgroundColor || oldAttributes.backgroundButtonColor,
	customBackgroundColor: oldAttributes.customBackgroundButtonColor,
} );

export default {
	attributes: {
		backgroundColor: {
			type: 'string',
			default: 'ffffff',
			validator: colorValidator,
		},
		submitButtonText: {
			type: 'string',
			default: __( 'Schedule time with me', 'jetpack' ),
		},
		submitButtonTextColor: {
			type: 'string',
		},
		submitButtonBackgroundColor: {
			type: 'string',
		},
		submitButtonClasses: { type: 'string' },
		hideEventTypeDetails: {
			type: 'boolean',
			default: false,
		},
		primaryColor: {
			type: 'string',
			default: '00A2FF',
			validator: colorValidator,
		},
		textColor: {
			type: 'string',
			default: '4D5055',
			validator: colorValidator,
		},
		style: {
			type: 'string',
			default: 'inline',
			validValues: [ 'inline', 'link' ],
		},
		url: {
			type: 'string',
			validator: urlValidator,
		},
		backgroundButtonColor: {
			type: 'string',
		},
		textButtonColor: {
			type: 'string',
		},
		customBackgroundButtonColor: {
			type: 'string',
			validator: colorValidator,
		},
		customTextButtonColor: {
			type: 'string',
			validator: colorValidator,
		},
	},
	migrate: attributes => {
		const newAttributes = omit( attributes, deprecatedAttributes );
		const buttonAttributes = migrateAttributes( pick( attributes, deprecatedAttributes ) );
		const newInnerBlocks = [
			createBlock( 'jetpack/button', {
				element: 'button',
				...buttonAttributes,
			} ),
		];

		return [ newAttributes, newInnerBlocks ];
	},
	isEligible: ( attributes, innerBlocks ) =>
		isEmpty( innerBlocks ) || some( pick( attributes, deprecatedAttributes ), Boolean ),
	save: ( { attributes: { url } } ) => <a href={ url }>{ url }</a>,
};
