import { SocialStoreState } from '../types';

/**
 * Returns the total number of shares already used.
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @return {number} Total number of shares used
 */
export function getSharesUsedCount( state: SocialStoreState ) {
	return state.sharesData?.publicized_count ?? 0;
}

/**
 * Returns the number of shares scheduled.
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @return {number} Number of shares scheduled
 */
export function getScheduledSharesCount( state: SocialStoreState ) {
	return state.sharesData?.to_be_publicized_count ?? 0;
}

/**
 * Returns the total number of shares used and scheduled.
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @return {number} Total number of shares used and scheduled
 */
export function getTotalSharesCount( state: SocialStoreState ) {
	const count = getSharesUsedCount( state ) + getScheduledSharesCount( state );

	return Math.max( count, 0 );
}

/**
 * Number of posts shared this month
 *
 * @param {SocialStoreState} state - Global state tree
 *
 * @return {number} Number of posts shared this month
 */
export function getSharedPostsCount( state: SocialStoreState ) {
	return state.sharesData?.shared_posts_count ?? 0;
}
