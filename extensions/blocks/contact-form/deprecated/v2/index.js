/**
 * External dependencies
 */
import { omit, some, pick } from 'lodash';
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

const deprecatedAttributes = [
	'submitButtonText',
	'backgroundButtonColor',
	'textButtonColor',
	'customBackgroundButtonColor',
	'customTextButtonColor',
	'submitButtonClasses',
];

export default {
	attributes: {
		submitButtonText: {
			type: 'string',
			default: __( 'Submit', 'jetpack' ),
		},
		backgroundButtonColor: {
			type: 'string',
		},
		textButtonColor: {
			type: 'string',
		},
		customBackgroundButtonColor: {
			type: 'string',
		},
		customTextButtonColor: {
			type: 'string',
		},
		submitButtonClasses: {
			type: 'string',
		},
	},
	migrate: ( attributes, innerBlocks ) => {
		const newAttributes = omit( attributes, deprecatedAttributes );

		const buttonAttributes = {
			text: attributes.submitButtonText || __( 'Submit', 'jetpack' ),
			backgroundColor: attributes.backgroundButtonColor,
			textColor: attributes.textButtonColor,
			customBackgroundColor: attributes.customBackgroundButtonColor,
			customTextColor: attributes.customTextButtonColor,
			className: attributes.submitButtonClasses,
		};

		const newInnerBlocks = innerBlocks.concat(
			createBlock( 'jetpack/button', {
				element: 'button',
				...buttonAttributes,
			} )
		);

		return [ newAttributes, newInnerBlocks ];
	},
	isEligible: attributes => some( pick( attributes, deprecatedAttributes ), Boolean ),
	save: InnerBlocks.Content,
};
