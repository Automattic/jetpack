/**
 * Internal dependencies
 */
import definedAttributes from './attributes';
import getSubscriptionsShortcode from './get-subscriptions-shortcode';

export default {
	attributes: definedAttributes,
	migrate: attributes => {
		return {
			...attributes,
			fontSize: `${ attributes.fontSize }px`,
			customFontSize: `${ attributes.customFontSize }px`,
		};
	},
	save: ( { className, attributes } ) => getSubscriptionsShortcode( className, attributes ),
};
