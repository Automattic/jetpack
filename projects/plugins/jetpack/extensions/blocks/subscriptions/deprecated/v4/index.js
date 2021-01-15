/**
 * Internal dependencies
 */
import definedAttributes from '../v3/attributes';
import getSubscriptionsShortcode from '../v3/get-subscriptions-shortcode';

export default {
	attributes: definedAttributes,
	save: ( { className, attributes } ) =>
		getSubscriptionsShortcode( className, attributes, 'check-text-defaults' ),
};
