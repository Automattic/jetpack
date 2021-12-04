/**
 * Internal dependencies
 */
import definedAttributes from '../v3/attributes';
import save from './save';

/**
 * Deprecation reason
 *
 * Added new block attribute `successMessage`, which was already available to the shortcode.
 */
export default {
	attributes: definedAttributes,
	migrate: attributes => {
		const { fontSize, customFontSize } = attributes;
		return {
			...attributes,
			fontSize: fontSize ? `${ fontSize }px` : undefined,
			customFontSize: customFontSize ? `${ customFontSize }px` : undefined,
			successMessage:
				'Success! An email was just sent to confirm your subscription. Please find the email now and click "Confirm Follow" to start subscribing.',
		};
	},
	save,
};
