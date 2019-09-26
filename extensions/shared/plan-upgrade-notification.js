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
import { isSimpleSite } from './site-type-utils';

/**
 * Shows a notification when a plan is marked as purchased
 * after redirection from WPCOM.
 */

if ( undefined !== typeof window && window.location ) {
	const { query } = parseUrl( window.location.href, true );

	if ( query.plan_upgraded ) {
		const path = isSimpleSite() ? `sites/${ window.location.host }` : '/jetpack/v4/site';

		if ( isSimpleSite() ) {
			apiFetch.use(
				apiFetch.createRootURLMiddleware( 'https://public-api.wordpress.com/rest/v1.2/' )
			);
		}

		apiFetch( { path, parse: true } )
			.then( response => {
				const planName = response.data.plan.product_name;
				const planUrl = `https://wordpress.com/plans/my-plan/${ window.location.host }`;

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
					__( `Congratulations! Your site is now on a paid plan.`, 'jetpack' )
				);
			} );
	}
}
