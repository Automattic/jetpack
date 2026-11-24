/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

const DAY_MS = 86400000;

export type PromoPlacement = 'options-menu' | 'settings';

/**
 * A promo as `Promo::to_array()` publishes it; the server's availability rule is not part of it.
 */
export type Promo = {
	slug: string;
	placement: PromoPlacement;
	order: number;
	title: string;
	description: string;
	cta_label: string;
	cta_url: string;
	dismissible: boolean;
	snooze_days: number;
	render_module: string | null;
};

/**
 * How often a user closed a promo, and when they last did.
 */
export type PromoDismissal = { count: number; at: string };

/**
 * Whether the close that brings a promo to this count is final: a second close, or any close when snoozing is off.
 *
 * @param closeCount - How often the promo was closed, counting this close.
 * @param snoozeDays - Days a first close lasts; 0 makes it final.
 * @return Whether the promo never returns.
 */
export function isFinalClose( closeCount: number, snoozeDays: number ): boolean {
	return closeCount >= 2 || snoozeDays <= 0;
}

/**
 * Whether a closed promo stays hidden. A second close is final, and so is an unreadable timestamp.
 *
 * @param dismissal  - The user's record for the promo, if any.
 * @param snoozeDays - Days a first close lasts; 0 makes it final.
 * @param now        - The current time in milliseconds.
 * @return Whether the promo is hidden.
 */
export function isPromoDismissed(
	dismissal: PromoDismissal | undefined,
	snoozeDays: number,
	now: number
): boolean {
	if ( ! dismissal ) {
		return false;
	}

	const closedAt = Date.parse( dismissal.at );

	if ( isFinalClose( dismissal.count, snoozeDays ) || Number.isNaN( closedAt ) ) {
		return true;
	}

	return now - closedAt < snoozeDays * DAY_MS;
}

/**
 * The promos registered for a placement, in the server's order. Empty when the server publishes none.
 *
 * @param placement - Where the promos render.
 * @return The promos.
 */
export function getPromosForPlacement( placement: PromoPlacement ): Promo[] {
	const promos = getScriptData()?.premium_analytics?.promos ?? [];

	return promos.filter( promo => promo.placement === placement );
}

/**
 * The first promo the user has not dismissed.
 *
 * @param promos    - The candidates, in display order.
 * @param dismissed - The user's dismissal records by promo slug.
 * @param now       - The current time in milliseconds.
 * @return The promo to show, or null.
 */
export function pickPromo(
	promos: Promo[],
	dismissed: Record< string, PromoDismissal >,
	now: number
): Promo | null {
	return (
		promos.find( promo => ! isPromoDismissed( dismissed[ promo.slug ], promo.snooze_days, now ) ) ??
		null
	);
}
