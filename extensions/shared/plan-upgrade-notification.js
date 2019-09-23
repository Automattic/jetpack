/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import '@wordpress/notices';
import { parse as parseUrl } from 'url';

/**
 * Shows a notification when a plan is marked as purchased
 * after redirection from WPCOM.
 */

if ( undefined !== typeof window && window.location ) {
	const { query } = parseUrl( window.location.href, true );

	if ( query.plan_upgraded ) {
		const path = '/jetpack/v4/site';

		apiFetch( { path } )
			.then( response => {
				const data = JSON.parse( response.data );
				const productName = data.plan.product_name;
				const viewSitePlanlink = `https://wordpress.com/plans/my-plan/${ window.location.host }`;

				dispatch( 'core/notices' ).createNotice(
					'success',
					__( `Congratulations! Your site is now on the ${ productName } plan.`, 'jetpack' ),
					{
						isDismissible: true,
						actions: [
							{
								url: viewSitePlanlink,
								label: __( 'View my plan', 'jetpack' ),
							},
						],
					}
				);
			} )
			.catch( () => {
				const viewSitePlanlink = `https://wordpress.com/plans/my-plan/${ window.location.host }`;

				dispatch( 'core/notices' ).createNotice(
					'success',
					__( `Congratulations! Your site is now on a paid plan.`, 'jetpack' ),
					{
						isDismissible: true,
						actions: [
							{
								url: viewSitePlanlink,
								label: __( '[View my plan]', 'jetpack' ),
							},
						],
					}
				);
			} );
	}
}
