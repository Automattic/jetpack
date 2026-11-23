import { getSiteData } from '@automattic/jetpack-script-data';
import { formatCurrency } from '@automattic/number-formatters';
import { dateI18n, getSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import type { PaidSubscription } from '../../data/subscribers';

/**
 * Whether a subscription is a one-time payment, which is removed rather than cancelled.
 *
 * @param subscription - The subscription.
 * @return Whether it's one-time.
 */
export function isOneTime( subscription: PaidSubscription ): boolean {
	return subscription.interval === 'one-time';
}

/**
 * How often a subscription is paid, e.g. `Monthly`.
 *
 * @param subscription - The subscription.
 * @return The label, or the interval as WordPress.com sent it when it's not one the dashboard knows.
 */
export function intervalLabel( subscription: PaidSubscription ): string {
	switch ( subscription.interval ) {
		case '1 month':
			return __( 'Monthly', 'jetpack-monetize' );
		case '1 year':
			return __( 'Yearly', 'jetpack-monetize' );
		case 'one-time':
			return __( 'One-time', 'jetpack-monetize' );
		default:
			return subscription.interval;
	}
}

/**
 * A subscription's price with its interval, e.g. `$5.00/month`.
 *
 * @param subscription - The subscription.
 * @return The label.
 */
export function subscriptionPriceLabel( subscription: PaidSubscription ): string {
	const price = formatCurrency( subscription.renewalPrice, subscription.currency );

	switch ( subscription.interval ) {
		case '1 month':
			/* translators: %s: a price, e.g. $5.00. */
			return sprintf( __( '%s/month', 'jetpack-monetize' ), price );
		case '1 year':
			/* translators: %s: a price, e.g. $50.00. */
			return sprintf( __( '%s/year', 'jetpack-monetize' ), price );
		case 'one-time':
			/* translators: %s: a price, e.g. $5.00. */
			return sprintf( __( '%s, one time', 'jetpack-monetize' ), price );
		default:
			return price;
	}
}

/**
 * When a subscription started, as a date in the site's timezone.
 *
 * @param subscription - The subscription.
 * @return The date, or an empty string when WordPress.com sent none.
 */
export function startDateLabel( subscription: PaidSubscription ): string {
	if ( ! subscription.startDate ) {
		return '';
	}
	// WordPress.com sends a UTC `Y-m-d H:i:s` with no zone, which would otherwise parse as browser-local.
	const utc = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test( subscription.startDate )
		? `${ subscription.startDate.replace( ' ', 'T' ) }Z`
		: subscription.startDate;
	return dateI18n( getSettings().formats.date, utc );
}

/**
 * The subscriber's payments in the site's Stripe dashboard, which tags them with their WordPress.com user ID.
 *
 * @param subscription - The subscription.
 * @return The URL.
 */
export function getStripeUrl( subscription: PaidSubscription ): string {
	return addQueryArgs( 'https://dashboard.stripe.com/search', {
		query: `metadata:${ subscription.userId }`,
	} );
}

/**
 * The CSV of the site's paid subscribers, which WordPress.com builds.
 *
 * @return The URL, or null without a WordPress.com blog ID.
 */
export function getExportUrl(): string | null {
	const blogId = Number( getSiteData()?.wpcom?.blog_id );
	if ( ! blogId ) {
		return null;
	}
	return addQueryArgs( 'https://dashboard.wordpress.com/wp-admin/index.php', {
		page: 'subscribers',
		blog: blogId,
		blog_subscribers: 'csv',
		type: 'paid-supporter',
	} );
}
