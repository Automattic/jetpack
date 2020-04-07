/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';

const deprecated = [
	{
		attributes: {
			subject: {
				type: 'string',
				default: '',
			},
			to: {
				type: 'string',
				default: '',
			},
			submit_button_text: {
				type: 'string',
				default: __( 'Submit', 'jetpack' ),
			},
			has_form_settings_set: {
				type: 'string',
				default: null,
			},
		},
		migrate: attr => {
			return {
				submitButtonText: attr.submit_button_text,
				hasFormSettingsSet: attr.has_form_settings_set,
				to: attr.to,
				subject: attr.subject,
			};
		},

		isEligible: attr => {
			// when the deprecated, snake_case values are default, no need to migrate
			if (
				! attr.has_form_settings_set &&
				( ! attr.submit_button_text || attr.submit_button_text === 'Submit' )
			) {
				return false;
			}
			return true;
		},

		save: InnerBlocks.Content,
	},
];

export default deprecated;
