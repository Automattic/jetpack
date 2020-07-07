/**
 * Internal dependencies
 */
import attributes from '../v3/attributes';
import getSubscriptionsShortcode from '../v3/get-subscriptions-shortcode';

export default {
	attributes,
	save: ( { className, attrs } ) =>
		getSubscriptionsShortcode( className, attrs, 'check-text-defaults' ),
};
