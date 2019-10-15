/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import '@wordpress/notices';
import { parse as parseUrl } from 'url';

/**
 * Internal dependencies
 */
import getSiteFragment from './get-site-fragment';
import { isSimpleSite } from './site-type-utils';

/**
 * Returns a URL where the current site's plan can be viewed from.
 * [Relative to current domain for JP sites]
 *
 * @return {string|null} A URL where the current site plan is viewable - null if not retrievable.
 */
function getPlanUrl() {
	const siteFragment = getSiteFragment();

	if ( undefined !== typeof window && window.location && siteFragment ) {
		if ( isSimpleSite() ) {
			return `https://wordpress.com/plans/my-plan/${ siteFragment }`;
		}

		// Potentially a JP site may have a wordpress root: https//foo.com/custom/wp/root
		// Unlikely, but technically also possible: https//foo.com/custom/wp/wp-admin/root
		return `${ window.location.protocol }//${ siteFragment.replace(
			'::',
			'/'
		) }/wp-admin/admin.php?page=jetpack#/my-plan`;
	}

	return null;
}

/**
 * Shows a notification when a plan is marked as purchased
 * after redirection from WPCOM.
 */
( async () => {
	if ( undefined !== typeof window && window.location ) {
		const { query } = parseUrl( window.location.href, true );

		if ( query.plan_upgraded ) {
			let planName = null;

			getPlanNameFromApi: try {
				// not updating if simple site
				if ( isSimpleSite() ) {
					break getPlanNameFromApi;
				}

				const jetpackSiteInfo = await apiFetch( { path: '/jetpack/v4/site' } );
				const data = JSON.parse( jetpackSiteInfo.data );

				planName = data.plan.product_name;
			} finally {
				const planUrl = getPlanUrl();

				dispatch( 'core/notices' ).createNotice(
					'success',
					/* translators: %s is the plan name, such as Jetpack Premium. */
					planName
						? sprintf(
								__( 'Congratulations! Your site is now on the %s plan.', 'jetpack' ),
								planName
						  )
						: __( 'Congratulations! Your site is now on a paid plan.', 'jetpack' ),
					{
						isDismissible: true,
						...( planUrl && {
							actions: [
								{
									url: getPlanUrl(),
									label: __( 'View my plan', 'jetpack' ),
								},
							],
						} ),
					}
				);
			}
		}
	}
} )();
