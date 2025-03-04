import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { getSocialScriptData } from '../../utils';

/**
 * Get the shares data from the store or script data
 * @param select - Select function
 * @return The shares data
 */
const getSharesData = select => {
	// On WordPress.com platform sites, use script data directly
	if ( isWpcomPlatformSite() ) {
		return getSocialScriptData().shares_data || {};
	}

	const data = select( coreStore ).getEntityRecord( 'wpcom/v2', 'jetpack-social' );
	return data || getSocialScriptData().shares_data || {};
};

/**
 * Helper function to get the count of shares already used
 * @param data - Shares data object
 * @return Number of shares used
 */
const getSharesUsedCount = data => {
	return data?.publicized_count ?? 0;
};

/**
 * Helper function to get the count of scheduled shares
 * @param data - Shares data object
 * @return Number of scheduled shares
 */
const getScheduledSharesCount = data => {
	return data?.to_be_publicized_count ?? 0;
};

/**
 * Returns the total number of shares used and scheduled.
 */
export const getTotalSharesCount = createRegistrySelector( select => (): number => {
	const data = getSharesData( select );
	const count = getSharesUsedCount( data ) + getScheduledSharesCount( data );
	return Math.max( count, 0 );
} );

/**
 * Number of posts shared this month
 */
export const getSharedPostsCount = createRegistrySelector( select => (): number => {
	const data = getSharesData( select );
	return data?.shared_posts_count ?? 0;
} );

/**
 * Get whether the sharing limits are enabled.
 */
export const isShareLimitEnabled = createRegistrySelector( select => (): boolean => {
	const data = getSharesData( select );
	return data?.is_share_limit_enabled ?? false;
} );
