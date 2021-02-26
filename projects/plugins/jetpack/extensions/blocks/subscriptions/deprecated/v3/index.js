/**
 * Internal dependencies
 */
import definedAttributes from './attributes';
import getSubscriptionsShortcode from './get-subscriptions-shortcode';

export default {
	attributes: definedAttributes,
	save: ( { className, attributes } ) => getSubscriptionsShortcode( className, attributes ),
};
