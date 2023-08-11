import { createBlock } from '@wordpress/blocks';
import { isEmpty, omit, pick, some } from 'lodash';

const deprecatedAttributes = [
	'submitButtonText',
	'submitButtonClasses',
	'backgroundButtonColor',
	'textButtonColor',
	'customBackgroundButtonColor',
	'customTextButtonColor',
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
		const newAttributes = omit( attributes, deprecatedAttributes );
		const buttonAttributes = migrateAttributes( attributes );
		const newInnerBlocks = [
			createBlock( 'jetpack/button', {
				element: 'a',
				uniqueId: 'recurring-payments-id',
				...buttonAttributes,
			} ),
		];

		return [ newAttributes, newInnerBlocks ];
	},
	isEligible: ( attributes, innerBlocks ) =>
		isEmpty( innerBlocks ) || some( pick( attributes, deprecatedAttributes ), Boolean ),
	save: () => null,
};
