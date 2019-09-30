/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
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
 * @return {string} A URL where the current site plan is viewable.
 */
function getPlanUrl() {
	if ( undefined !== typeof window && window.location ) {
		if ( isSimpleSite() ) {
			return `https://wordpress.com/plans/my-plan/${ getSiteFragment() }`;
		}
		// Potentially a JP site may have a wordpress root: https//foo.com/custom/wp/root
		// Unlikely, but technically also possible: https//foo.com/custom/wp/wp-admin/root
		return `${ window.location.protocol }//${ getSiteFragment().replace(
			'::',
			'/'
		) }/wp-admin/admin.php?page=jetpack#/my-plan`;
	}
}

/**
 * Shows a notification when a plan is marked as purchased
 * after redirection from WPCOM.
 */
( async () => {
	if ( undefined !== typeof window && window.location ) {
		const { query } = parseUrl( window.location.href, true );
		let planName = null;

		if ( query.plan_upgraded ) {
			getPlanNameFromApi: try {
				// not updating if simple site
				if ( isSimpleSite() ) {
					break getPlanNameFromApi;
				}

				const jetpackSiteInfo = await apiFetch( { path: '/jetpack/v4/site' } );
				const data = JSON.parse( jetpackSiteInfo.data );

				planName = data.plan.product_name;
			} finally {
				dispatch( 'core/notices' ).createNotice(
					'success',
					planName
						? __( `Congratulations! Your site is now on the ${ planName } plan.`, 'jetpack' )
						: __( `Congratulations! Your site is now on a paid plan.`, 'jetpack' ),
					{
						isDismissible: true,
						actions: [
							{
								url: getPlanUrl(),
								label: __( 'View my plan', 'jetpack' ),
							},
						],
					}
				);
			}
		}
	}
} )();
