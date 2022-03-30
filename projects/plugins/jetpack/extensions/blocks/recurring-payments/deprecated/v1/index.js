/**
 * External dependencies
 */
import { isEmpty, omit, pick, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const deprecatedAttributes = [
	'submitButtonText',
	'submitButtonClasses',
	'backgroundButtonColor',
	'textButtonColor',
	'customBackgroundButtonColor',
	'customTextButtonColor',
	'align',
];

const migrateAttributes = oldAttributes => ( {
	text: oldAttributes.submitButtonText,
	textColor: oldAttributes.textButtonColor,
	customTextColor: oldAttributes.customTextButtonColor,
	backgroundColor: oldAttributes.backgroundButtonColor,
	customBackgroundColor: oldAttributes.customBackgroundButtonColor,
} );

export default {
	attributes: {
		planId: {
			type: 'integer',
		},
		submitButtonText: {
			type: 'string',
		},
		submitButtonClasses: {
			type: 'string',
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
		align: {
			type: 'string',
		},
	},
	migrate: attributes => {
		const newButtonWrapperAttributes = omit( attributes, deprecatedAttributes );
		const buttonAttributes = migrateAttributes( attributes );
		const newInnerBlocks = [
			createBlock( 'jetpack/button', {
				element: 'a',
				uniqueId: 'recurring-payments-id',
				...buttonAttributes,
			} ),
		];

		const buttonWrapper = createBlock(
			'jetpack/recurring-payments-button',
			newButtonWrapperAttributes,
			newInnerBlocks
		);

		const newAttributes = {};
		if ( attributes.align ) {
			newAttributes.align = attributes.align;
		}

		return [ newAttributes, [ buttonWrapper ] ];
	},
	isEligible: ( attributes, innerBlocks ) =>
		isEmpty( innerBlocks ) || some( pick( attributes, deprecatedAttributes ), Boolean ),
	save: () => null,
};
