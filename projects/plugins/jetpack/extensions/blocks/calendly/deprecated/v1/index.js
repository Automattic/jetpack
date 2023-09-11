import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import colorValidator from '../../../../shared/colorValidator';

/**
 * Deprecation reason:
 *
 * Submit button replaced with Jetpack Button inner block.
 *
 * Button properties stored in the Calendly block attributes were made
 * consistent with the Button block's. The original link content was then
 * replaced with the Button inner block.
 */

const urlValidator = url => ! url || url.startsWith( 'https://calendly.com/' );
const migrateAttributes = oldAttributes => ( {
	text: oldAttributes.submitButtonText || __( 'Schedule time with me', 'jetpack' ),
	textColor: oldAttributes.submitButtonTextColor || oldAttributes.textButtonColor,
	customTextColor: oldAttributes.customTextButtonColor,
	backgroundColor: oldAttributes.submitButtonBackgroundColor || oldAttributes.backgroundButtonColor,
	customBackgroundColor: oldAttributes.customBackgroundButtonColor,
	url: oldAttributes.url,
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
		// Filter out deprecated attributes, collecting the rest in newAttributes.
		const {
			submitButtonText,
			submitButtonTextColor,
			submitButtonBackgroundColor,
			submitButtonClasses,
			backgroundButtonColor,
			textButtonColor,
			customBackgroundButtonColor,
			customTextButtonColor,
			...newAttributes
		} = attributes;

		const buttonAttributes = migrateAttributes( attributes );
		const newInnerBlocks = [
			createBlock( 'jetpack/button', {
				element: 'a',
				uniqueId: 'calendly-widget-id',
				...buttonAttributes,
			} ),
		];

		return [ newAttributes, newInnerBlocks ];
	},
	save: ( { attributes: { url } } ) => <a href={ url }>{ url }</a>,
};
