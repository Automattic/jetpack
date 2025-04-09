import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import INNER_BLOCKS_DEPRECATION from '../shared/deprecations/inner-blocks-deprecation';
import deprecateFieldStyles from '../shared/util/deprecate-field-styles';

export default [
	{
		...INNER_BLOCKS_DEPRECATION,
		attributes: {
			...INNER_BLOCKS_DEPRECATION.attributes,
			label: {
				type: 'string',
				default: __( 'Consent', 'jetpack-forms' ),
			},
			consentType: {
				type: 'string',
				default: 'implicit',
			},
			implicitConsentMessage: {
				type: 'string',
				default: __(
					"By submitting your information, you're giving us permission to email you. You may unsubscribe at any time.",
					'jetpack-forms'
				),
			},
			explicitConsentMessage: {
				type: 'string',
				default: __( 'Can we send you an email from time to time?', 'jetpack-forms' ),
			},
		},
		migrate( attributes ) {
			const { restAttributes, labelStyles } = deprecateFieldStyles( attributes );
			const newInnerBlocks = [
				createBlock( 'jetpack/option', {
					defaultLabel: __( 'Add option…', 'jetpack-forms' ),
					hideInput: attributes.consentType === 'implicit',
					isStandalone: true,
					label: attributes.label,
					requiredText: attributes.requiredText,
					style: labelStyles,
				} ),
			];

			return [ restAttributes, newInnerBlocks ];
		},
	},
];
