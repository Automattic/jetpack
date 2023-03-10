import definedAttributes from './attributes';
import getSubscriptionsShortcode from './get-subscriptions-shortcode';

/**
 * Deprecation reason:
 *
 * Shortcode generation changed to omit undefined attributes.
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
	save: ( { className, attributes } ) => getSubscriptionsShortcode( className, attributes ),
};
