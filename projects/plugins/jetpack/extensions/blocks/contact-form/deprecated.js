import { InnerBlocks } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { omit } from 'lodash';
import defaultAttributes from './attributes';

const deprecatedAttributes = [
	'submit_button_text',
	'has_form_settings_set',
	'submitButtonText',
	'backgroundButtonColor',
	'textButtonColor',
	'customBackgroundButtonColor',
	'customTextButtonColor',
	'submitButtonClasses',
	'hasFormSettingsSet',
];

const v2 = {
	attributes: {
		...defaultAttributes,
	},
	supports: {
		html: false,
	},
	save: () => <InnerBlocks.Content />,
};

const v1 = {
	attributes: {
		submit_button_text: {
			type: 'string',
			default: __( 'Submit', 'jetpack' ),
		},
		has_form_settings_set: {
			type: 'string',
			default: null,
		},
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
		...defaultAttributes,
	},
	migrate: ( attributes, innerBlocks ) => {
		const newAttributes = omit( attributes, deprecatedAttributes );

		const buttonAttributes = {
			text:
				attributes.submitButtonText || attributes.submit_button_text || __( 'Submit', 'jetpack' ),
			backgroundColor: attributes.backgroundButtonColor,
			textColor: attributes.textButtonColor,
			customBackgroundColor: attributes.customBackgroundButtonColor,
			customTextColor: attributes.customTextButtonColor,
		};

		const newInnerBlocks = innerBlocks.concat(
			createBlock( 'jetpack/button', {
				element: 'button',
				...buttonAttributes,
			} )
		);

		return [ newAttributes, newInnerBlocks ];
	},
	isEligible: attr => {
		if ( attr.has_form_settings_set || attr.hasFormSettingsSet ) {
			return true;
		}

		return false;
	},
	save: () => <InnerBlocks.Content />,
};

export default [ v2, v1 ];
