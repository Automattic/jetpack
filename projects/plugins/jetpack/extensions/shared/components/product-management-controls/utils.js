import { __ } from '@wordpress/i18n';
import { PRODUCT_TYPE_PAYMENT_PLAN, PRODUCT_TYPE_SUBSCRIPTION } from './constants';

/**
 * This list is supposed to be used by the ProductManagementControls component
 * and the jetpack/membership-products store, based on a given product type.
 * We've chosen this centralized approach instead of the more common `sprintf`
 * because it's a bit clearer, generates less cognitive load on the
 * component's consumers, and it's easier to maintain.
 *
 * @see p1648029677784879-slack-CDLH4C1UZ
 */
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
		// The PAYMENT_PLAN message is intentionally the same as SUBSCRIPTION.
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
	'invalid product configured for this block': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __(
			'Invalid payment plan configured for this block.',
			'jetpack'
		),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __(
			'Invalid subscription configured for this block.',
			'jetpack'
		),
	},
	'the button will be hidden from your visitors until you select a valid product': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __(
			'The button will be hidden from your visitors until you select a valid payment plan.',
			'jetpack'
		),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __(
			'The subscribe button will be hidden from your visitors until you select a valid subscription.',
			'jetpack'
		),
	},
	'mark this product as a donation': {
		[ PRODUCT_TYPE_PAYMENT_PLAN ]: __( 'Mark this payment plan as a donation', 'jetpack' ),
		[ PRODUCT_TYPE_SUBSCRIPTION ]: __( 'Mark this subscription as a donation', 'jetpack' ),
	},
};

export function getMessageByProductType( message, productType = PRODUCT_TYPE_PAYMENT_PLAN ) {
	return messages?.[ message ]?.[ productType ] || null;
}

const titles = {
	'false,1 month': __( 'Monthly Subscription', 'jetpack' ),
	'true,1 month': __( 'Monthly Donation', 'jetpack' ),
	'false,1 year': __( 'Yearly Subscription', 'jetpack' ),
	'true,1 year': __( 'Yearly Donation', 'jetpack' ),
	'false,one-time': __( 'Subscription', 'jetpack' ),
	'true,one-time': __( 'Donation', 'jetpack' ),
};

export function getTitleByProps( isDonation, interval ) {
	const key = [ isDonation, interval ];
	return titles[ key ] ?? '';
}
