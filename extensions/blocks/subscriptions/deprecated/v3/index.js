/**
 * Internal dependencies
 */
import attributes from './attributes';
import getSubscriptionsShortcode from './get-subscriptions-shortcode';

export default {
	attributes,
	save: ( { className, attrs } ) => getSubscriptionsShortcode( className, attrs ),
};
