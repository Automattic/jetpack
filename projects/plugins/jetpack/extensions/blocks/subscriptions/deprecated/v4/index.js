import definedAttributes from '../v3/attributes';
import getSubscriptionsShortcode from '../v3/get-subscriptions-shortcode';

/**
 * Deprecation reason:
 *
 * Saving the default submit button text into the shortcode prevented that text
 * from being translated for non-English locales.
 *
 * The `check-text-defaults` flag passed to the `getSubscriptionsShortcode`
 * function means it will render the English defaults into the shortcode which
 * can then in turn be detected as "default" text when parsing the shortcode and
 * then translated appropriately.
 */
export default {
	attributes: definedAttributes,
	migrate: attributes => {
		const { fontSize, customFontSize } = attributes;
		return {
			...attributes,
			fontSize: fontSize ? `${ fontSize }px` : undefined,
			customFontSize: customFontSize ? `${ customFontSize }px` : undefined,
		};
	},
	save: ( { className, attributes } ) =>
		getSubscriptionsShortcode( className, attributes, 'check-text-defaults' ),
};
