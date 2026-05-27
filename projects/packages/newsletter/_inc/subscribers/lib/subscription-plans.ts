import formatCurrency from '@automattic/format-currency';
import { __, sprintf } from '@wordpress/i18n';
import type { Subscriber, SubscriptionPlan } from '../data/types';

export type ResolvedPlan = {
	plan: string;
	is_complimentary: boolean;
	is_free: boolean;
	title?: string;
	startDate?: string;
	endDate?: string | null;
};

/**
 * Format a subscriber's plans for display, mirroring Calypso's `useSubscriptionPlans` hook.
 *
 * - Drops legacy gift subscriptions (`is_gift && !is_comp`).
 * - Maps `is_comp` → `is_complimentary` and computes `is_free` from `renewal_price`.
 * - Renders comp plans as "Comp: {title}", free as "Free", paid as "{interval} ({price})".
 *
 * @param subscriber - Subscriber.
 * @return Resolved plan rows.
 */
export function getResolvedPlans( subscriber: Subscriber ): ResolvedPlan[] {
	const plans = subscriber.plans ?? [];

	return plans.reduce< ResolvedPlan[] >( ( acc, plan: SubscriptionPlan ) => {
		if ( plan.is_gift && ! plan.is_comp ) {
			return acc;
		}

		const isComplimentary = !! plan.is_comp;
		const isFree = ! isComplimentary && ( plan.renewal_price ?? 0 ) === 0;

		let label: string;
		if ( isComplimentary ) {
			label = plan.title
				? sprintf(
						/* translators: %s: title of the paid plan being comped, e.g. "Comp: Gold". */
						__( 'Comp: %s', 'jetpack-newsletter' ),
						plan.title
				  )
				: __( 'Comp', 'jetpack-newsletter' );
		} else if ( isFree ) {
			label = __( 'Free', 'jetpack-newsletter' );
		} else {
			const interval = plan.renew_interval || plan.renewal_period || '';
			const price = formatPrice( plan.renewal_price, plan.currency );
			label = price ? `${ interval } (${ price })`.trim() : interval;
		}

		acc.push( {
			plan: label,
			is_complimentary: isComplimentary,
			is_free: isFree,
			title: plan.title,
			startDate: plan.start_date,
			endDate: plan.end_date,
		} );

		return acc;
	}, [] );
}

/**
 * Resolve a subscriber's overall subscription type, applying the same priority
 * `SubscriptionTypeCell` renders: paid wins over comp, comp over free. Shared with
 * the DataViews "Subscription type" filter so filtering and the rendered badge
 * agree (a free-only subscriber must read as `free`, not `paid`).
 *
 * @param subscriber - Subscriber.
 * @return The subscription type.
 */
export function getSubscriptionType( subscriber: Subscriber ): 'paid' | 'comp' | 'free' {
	const plans = getResolvedPlans( subscriber );
	if ( plans.some( plan => ! plan.is_complimentary && ! plan.is_free ) ) {
		return 'paid';
	}
	if ( plans.some( plan => plan.is_complimentary ) ) {
		return 'comp';
	}
	return 'free';
}

/**
 * Format a price using `@automattic/format-currency`. Returns an empty string when either
 * the amount or currency is missing, or when the formatter can't produce a value.
 *
 * @param amount   - Numeric amount.
 * @param currency - ISO currency code.
 * @return Formatted price string or empty.
 */
function formatPrice( amount?: number, currency?: string ): string {
	if ( amount == null || ! currency ) {
		return '';
	}
	return formatCurrency( amount, currency ) ?? '';
}
