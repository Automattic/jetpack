/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Title and description for the syncing screen. Storeless sites (WooCommerce
 * inactive) wait on Jetpack's generic sync, so the copy drops "store".
 *
 * @param state              - Current screen state.
 * @param state.hasError     - Whether the sync errored or stalled.
 * @param state.hasStoreData - Whether the site has store data to sync.
 * @return The title and description to render.
 */
export function describeSync( {
	hasError,
	hasStoreData,
}: {
	hasError: boolean;
	hasStoreData: boolean;
} ): { title: string; description: string } {
	const title = hasError
		? __( 'Sync interrupted', 'jetpack-premium-analytics' )
		: __( "We're preparing your data", 'jetpack-premium-analytics' );

	let description;
	if ( hasError ) {
		description = hasStoreData
			? __(
					'Something went wrong while syncing your store data. Please try again.',
					'jetpack-premium-analytics'
			  )
			: __(
					'Something went wrong while syncing your site data. Please try again.',
					'jetpack-premium-analytics'
			  );
	} else {
		description = hasStoreData
			? __(
					'Your store data is being synced. This may take a few minutes depending on the size of your store.',
					'jetpack-premium-analytics'
			  )
			: __(
					'Your site data is being synced. This may take a few minutes.',
					'jetpack-premium-analytics'
			  );
	}

	return { title, description };
}
