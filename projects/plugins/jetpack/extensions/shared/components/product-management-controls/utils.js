/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PRODUCT_TYPE_PAYMENT_PLAN, PRODUCT_TYPE_SUBSCRIPTION } from './constants';

const messages = {
	'add a new product': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __( 'Add a new payment plan', 'jetpack' ),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __( 'Add a new subscription', 'jetpack' ),
	},
	'product not found': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __( 'Payment plan not found', 'jetpack' ),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __( 'Subscription not found', 'jetpack' ),
	},
	'select a product': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __( 'Select a payment plan', 'jetpack' ),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __( 'Select a subscription', 'jetpack' ),
	},
	'default new product title': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __( 'Monthly Subscription', 'jetpack' ),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __( 'Monthly Subscription', 'jetpack' ),
	},
	'manage your products': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __( 'Manage your payment plans.', 'jetpack' ),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __( 'Manage your subscriptions.', 'jetpack' ),
	},
	'saving product': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __( 'Saving payment plan…', 'jetpack' ),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __( 'Saving subscription…', 'jetpack' ),
	},
	'add product': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __( 'Add payment plan', 'jetpack' ),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __( 'Add subscription', 'jetpack' ),
	},
	'product requires a name': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __( 'Payment plan requires a name', 'jetpack' ),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __( 'Subscription requires a name', 'jetpack' ),
	},
	'product requires a valid price': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __( 'Payment plan requires a valid price', 'jetpack' ),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __( 'Subscription requires a valid price', 'jetpack' ),
	},
	'successfully created product': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __( 'Successfully created payment plan', 'jetpack' ),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __( 'Successfully created subscription', 'jetpack' ),
	},
	'there was an error when adding the product': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __(
			'There was an error when adding the payment plan.',
			'jetpack'
		),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __(
			'There was an error when adding the subscription.',
			'jetpack'
		),
	},
};

export function getMessageByProductType( message, productType = PRODUCT_TYPE_PAYMENT_PLAN ) {
	return messages?.[ message ]?.[ productType ] || null;
}
