import { SocialStoreState } from '../types';
import { getEnabledConnections } from './connection-data';
import settings from './jetpack-settings';
/**
 * Whether the share limit is enabled.
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @returns {boolean} Whether the share limit is enabled
 */
export function isShareLimitEnabled( state: SocialStoreState ) {
	return state.sharesData?.is_share_limit_enabled ?? false;
}

/**
 * Whether to show the share limits.
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @returns {boolean} Whether to show the share limits
 */
export function showShareLimits( state: SocialStoreState ) {
	if ( settings.hasPaidPlan( state ) || state.hasPaidPlan ) {
		return false;
	}
	return isShareLimitEnabled( state );
}

/**
 * Returns the current share limit.
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @returns {number} Current share limit
 */
export function getShareLimit( state: SocialStoreState ) {
	return state.sharesData?.share_limit ?? 30;
}

/**
 * Returns the total number of shares already used.
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @returns {number} Total number of shares used
 */
export function getSharesUsedCount( state: SocialStoreState ) {
	return state.sharesData?.publicized_count ?? 0;
}

/**
 * Returns the number of shares scheduled.
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @returns {number} Number of shares scheduled
 */
export function getScheduledSharesCount( state: SocialStoreState ) {
	return state.sharesData?.to_be_publicized_count ?? 0;
}

/**
 * Returns the total number of shares used and scheduled.
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @returns {number} Total number of shares used and scheduled
 */
export function getTotalSharesCount( state: SocialStoreState ) {
	return getSharesUsedCount( state ) + getScheduledSharesCount( state );
}

/**
 * Number of posts shared this month
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @returns {number} Number of posts shared this month
 */
export function getSharedPostsCount( state: SocialStoreState ) {
	return state.sharesData?.shared_posts_count ?? 0;
}

/**
 * Whether to show the advanced plan nudge.
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @returns {boolean} Whether to show the advanced plan nudge
 */
export function shouldShowAdvancedPlanNudge( state ) {
	return state.sharesData?.show_advanced_plan_upgrade_nudge ?? false;
}

export type NumberOfSharesRemainingOptions = {
	/**
	 * Whether to include scheduled shares
	 */
	includeScheduled?: boolean;

	/**
	 * Whether to include the current post selected connections
	 */
	includeEnabledConnections?: boolean;
};

/**
 * Returns the number of shares remaining.
 *
 * @param {SocialStoreState} state - Global state tree
 * @param {NumberOfSharesRemainingOptions} options - Options
 *
 * @returns {number} Number of shares remaining
 */
export function numberOfSharesRemaining(
	state: SocialStoreState,
	options: NumberOfSharesRemainingOptions = {}
) {
	if ( ! showShareLimits( state ) ) {
		return Infinity;
	}

	// Allow partial options to be passed in
	const { includeScheduled, includeEnabledConnections } = {
		includeScheduled: true,
		includeEnabledConnections: true,
		...options,
	};

	const sharesUsed = getSharesUsedCount( state );
	const sharesLimit = getShareLimit( state );
	const scheduledShares = includeScheduled ? getScheduledSharesCount( state ) : 0;
	const enabledConnections = includeEnabledConnections ? getEnabledConnections( state ) : [];

	return Math.max( sharesLimit - sharesUsed - scheduledShares - enabledConnections.length, 0 );
}
