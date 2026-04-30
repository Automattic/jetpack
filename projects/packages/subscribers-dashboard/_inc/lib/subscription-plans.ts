import formatCurrency from '@automattic/format-currency';
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
			label = plan.title ? `Comp: ${ plan.title }` : 'Comp';
		} else if ( isFree ) {
			label = 'Free';
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
