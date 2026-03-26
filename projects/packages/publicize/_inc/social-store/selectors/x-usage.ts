import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { getCurrentPeriod } from '../../components/x-usage/utils';
import { hasSocialPaidFeatures } from '../../utils/script-data';
import { EMPTY_ARRAY, FREE_PLAN_LIMIT, PAID_PLAN_LIMIT } from '../constants';

export type XUsageItem = {
	period: string;
	used: number;
	pending: number;
	total: number;
};

/**
 * Get the list of X usage items.
 *
 * @return The list of X usage items.
 */
export const getXUsage = createRegistrySelector( select => (): Array< XUsageItem > => {
	const data = select( coreStore ).getEntityRecords< XUsageItem >(
		'wpcom/v2',
		'publicize/x-usage'
	);

	return data ?? EMPTY_ARRAY;
} );

/**
 * Get a specific X usage item by period.
 *
 * @param _state - State object.
 * @param period - The period identifier (e.g. 'yyyy-mm' or 'free').
 *
 * @return The X usage item.
 */
export function getXUsageFor( _state: unknown, period: string ) {
	return getXUsage().find( item => item.period === period );
}

/**
 * Returns whether the X usage list is being fetched.
 */
export const isFetchingXUsage = createRegistrySelector( select => (): boolean => {
	const { isResolving } = select( coreStore );

	return isResolving( 'getEntityRecords', [ 'wpcom/v2', 'publicize/x-usage' ] );
} );

/**
 * Returns the quota limit for the current plan.
 *
 * @return The quota limit.
 */
function getQuotaLimit() {
	return hasSocialPaidFeatures() ? PAID_PLAN_LIMIT : FREE_PLAN_LIMIT;
}

/**
 * Returns the default period based on plan type.
 *
 * @return The default period identifier.
 */
function getDefaultPeriod() {
	return hasSocialPaidFeatures() ? getCurrentPeriod() : 'free';
}

/**
 * Returns whether the X sharing quota has been exceeded.
 *
 * @param state  - State object.
 * @param period - The period identifier. Defaults based on plan type.
 *
 * @return Whether the quota is exceeded. Defaults to false when data is missing.
 */
export function isXQuotaExceeded( state: object, period?: string ): boolean {
	const resolvedPeriod = period ?? getDefaultPeriod();
	const usageItem = getXUsageFor( state, resolvedPeriod );

	if ( ! usageItem ) {
		return false;
	}

	return usageItem.total >= getQuotaLimit();
}

/**
 * Returns whether the user can share to X right now (current period).
 *
 * @param state - State object.
 *
 * @return Whether sharing to X is allowed now. Defaults to true when data is missing.
 */
export function canShareToXNow( state: object ): boolean {
	return ! isXQuotaExceeded( state );
}

/**
 * Returns whether the user can schedule an X share.
 *
 * Behavior:
 * - Free plan, quota exhausted → false (lifetime limit)
 * - Paid plan, no period specified → true (user can pick a future month)
 * - Paid plan, period specified → checks that period's usage against quota
 *
 * @param state  - State object.
 * @param period - Optional period to check (e.g. 'yyyy-mm'). When omitted,
 *               paid plans always return true; free plans check lifetime quota.
 *
 * @return Whether scheduling an X share is allowed.
 */
export function canScheduleXShareFor( state: object, period?: string | null ): boolean {
	// Free plan: always check the lifetime 'free' period.
	if ( ! hasSocialPaidFeatures() ) {
		return ! isXQuotaExceeded( state );
	}

	// Paid plan without a specific period: allow scheduling (user can pick a future month).
	if ( ! period ) {
		return true;
	}

	// Paid plan with a specific period: check that period's quota.
	return ! isXQuotaExceeded( state, period );
}

/**
 * Returns the number of remaining X shares for the current period.
 *
 * @param state  - State object.
 * @param period - The period identifier. Defaults based on plan type.
 *
 * @return The number of remaining shares, never negative.
 */
export function getXQuotaRemaining( state: object, period?: string ): number {
	const resolvedPeriod = period ?? getDefaultPeriod();
	const usageItem = getXUsageFor( state, resolvedPeriod );

	return Math.max( 0, getQuotaLimit() - ( usageItem?.total ?? 0 ) );
}
