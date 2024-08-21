import { getSocialScriptData } from './script-data';

/**
 * Returns the shares data.
 *
 * @return {import('../types/types').SharesData} Shares data
 */
export function getSharesData() {
	return getSocialScriptData().shares_data;
}
/**
 * Returns the total number of shares already used.
 *
 * @return {number} Total number of shares used
 */
export function getSharesUsedCount() {
	return getSharesData().publicized_count ?? 0;
}

/**
 * Returns the number of shares scheduled.
 *
 * @return {number} Number of shares scheduled
 */
export function getScheduledSharesCount() {
	return getSharesData().to_be_publicized_count ?? 0;
}

/**
 * Returns the total number of shares used and scheduled.
 *
 * @return {number} Total number of shares used and scheduled
 */
export function getTotalSharesCount() {
	const count = getSharesUsedCount() + getScheduledSharesCount();

	return Math.max( count, 0 );
}

/**
 * Number of posts shared this month
 *
 * @return {number} Number of posts shared this month
 */
export function getSharedPostsCount() {
	return getSharesData().shared_posts_count ?? 0;
}
