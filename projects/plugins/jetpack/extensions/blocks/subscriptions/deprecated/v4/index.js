/**
 * Internal dependencies
 */
import definedAttributes from '../v3/attributes';
import getSubscriptionsShortcode from '../v3/get-subscriptions-shortcode';

export default {
	attributes: definedAttributes,
	migrate: attributes => {
		return {
			...attributes,
			fontSize: `${ attributes.fontSize }px`,
			customFontSize: `${ attributes.customFontSize }px`,
		};
	},
	save: ( { className, attributes } ) =>
		getSubscriptionsShortcode( className, attributes, 'check-text-defaults' ),
};
