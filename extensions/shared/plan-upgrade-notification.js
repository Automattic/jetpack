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
 * Shows a notification when a plan is marked as purchased
 * after redirection from WPCOM.
 */

/**
 * Returns a URL where the current site's plan can be viewed from.
 * [Relative to current domain for JP sites]
 *
 * @return {string} A URL where the current site plan is viewable.
 */
function getPlanUrl() {
	if ( undefined !== typeof window && window.location ) {
		if ( isSimpleSite() ) {
			return `https://wordpress.com/plans/my-plan/${ getSiteFragment().replace( '::', '/' ) }`;
		}
		// Potentially a JP site may have a wordpress root: https//foo.com/custom/wp/root
		// Unlikely, but technically also possible: https//foo.com/custom/wp/wp-admin/root
		return `${ window.location.protocol }//${ getSiteFragment().replace(
			'::',
			'/'
		) }/wp-admin/admin.php?page=jetpack#/my-plan`;
	}
}

if ( undefined !== typeof window && window.location ) {
	const { query } = parseUrl( window.location.href, true );

	if ( query.plan_upgraded ) {
		const planUrl = getPlanUrl();

		apiFetch( { path: '/jetpack/v4/site' } )
			.then( response => {
				const data = JSON.parse( response.data );
				const planName = data.plan.product_name;

				dispatch( 'core/notices' ).createNotice(
					'success',
					__( `Congratulations! Your site is now on the ${ planName } plan.`, 'jetpack' ),
					{
						isDismissible: true,
						actions: [
							{
								url: planUrl,
								label: __( 'View my plan', 'jetpack' ),
							},
						],
					}
				);
			} )
			.catch( () => {
				dispatch( 'core/notices' ).createNotice(
					'success',
					__( `Congratulations! Your site is now on a paid plan.`, 'jetpack' ),
					{
						isDismissible: true,
						actions: [
							{
								url: planUrl,
								label: __( 'View my plan', 'jetpack' ),
							},
						],
					}
				);
			} );
	}
}
