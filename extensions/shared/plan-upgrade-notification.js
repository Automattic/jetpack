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
import { getSiteFragment } from 'extensions/shared/get-site-fragment';

/**
 * Shows a notification when a plan is marked as purchased
 * after redirection from WPCOM.
 */

if ( undefined !== typeof window && window.location ) {
	const { query } = parseUrl( window.location.href, true );

	if ( query.plan_upgraded ) {
		const planUrl = `https://wordpress.com/plans/my-plan/${ getSiteFragment() }`;

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
