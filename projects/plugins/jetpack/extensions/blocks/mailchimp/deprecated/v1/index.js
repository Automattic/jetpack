import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { isEmpty, omit, pick, some } from 'lodash';

const deprecatedAttributes = [
	'submitButtonText',
	'backgroundButtonColor',
	'textButtonColor',
	'submitButtonClasses',
	'customBackgroundButtonColor',
	'customTextButtonColor',
];

const migrateAttributes = oldAttributes => ( {
	text: oldAttributes.submitButtonText || __( 'Join my email list', 'jetpack' ),
	textColor: oldAttributes.textButtonColor,
	customTextColor: oldAttributes.customTextButtonColor,
	backgroundColor: oldAttributes.backgroundButtonColor,
	customBackgroundColor: oldAttributes.customBackgroundButtonColor,
} );

export default {
	attributes: {
		emailPlaceholder: {
			type: 'string',
			default: __( 'Enter your email', 'jetpack' ),
		},
		submitButtonText: {
			type: 'string',
			default: __( 'Join my email list', 'jetpack' ),
		},
		backgroundButtonColor: {
			type: 'string',
		},
		textButtonColor: {
			type: 'string',
		},
		submitButtonClasses: {
			type: 'string',
		},
		customBackgroundButtonColor: {
			type: 'string',
		},
		customTextButtonColor: {
			type: 'string',
		},
		consentText: {
			type: 'string',
			default: __(
				'By clicking submit, you agree to share your email address with the site owner and Mailchimp to receive marketing, updates, and other emails from the site owner. Use the unsubscribe link in those emails to opt out at any time.',
				'jetpack'
			),
		},
		interests: {
			type: 'array',
			default: [],
		},
		processingLabel: {
			type: 'string',
			default: __( 'Processing…', 'jetpack' ),
		},
		signupFieldTag: {
			type: 'string',
		},
		signupFieldValue: {
			type: 'string',
		},
		successLabel: {
			type: 'string',
			default: __( "Success! You're on the list.", 'jetpack' ),
		},
		errorLabel: {
			type: 'string',
			default: __(
				"Whoops! There was an error and we couldn't process your subscription. Please reload the page and try again.",
				'jetpack'
			),
		},
		preview: {
			type: 'boolean',
			default: false,
		},
	},
	migrate: attributes => {
		const newAttributes = omit( attributes, deprecatedAttributes );
		const buttonAttributes = migrateAttributes( attributes );
		const newInnerBlocks = [
			createBlock( 'jetpack/button', {
				element: 'button',
				uniqueId: 'mailchimp-widget-id',
				...buttonAttributes,
			} ),
		];

		return [ newAttributes, newInnerBlocks ];
	},
	isEligible: ( attributes, innerBlocks ) =>
		isEmpty( innerBlocks ) || some( pick( attributes, deprecatedAttributes ), Boolean ),
	save: () => null,
};
