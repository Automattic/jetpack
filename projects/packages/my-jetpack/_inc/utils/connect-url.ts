import { CONNECTION_FROM, getUserConnectionUrl } from '@automattic/jetpack-connection';
import { MyJetpackRoutes } from '../constants';

export type ConnectionScreenRoute = `${ typeof MyJetpackRoutes.Connection }?from=${ string }`;

/**
 * A link that connects the user's account, then returns them to `returnTo` without the plans page.
 *
 * @param from     - A standard entry-point name, such as `my_jetpack_header`; any other format gets the legacy connection screen.
 * @param returnTo - The absolute URL to return to; Calypso ignores a relative one. Defaults to the current page.
 * @return The URL.
 */
export function getConnectUrl( from: string, returnTo: string = window.location.href ): string {
	// Calypso ignores `skip_pricing` for a standard name; it keeps a legacy fallback off the plans page.
	return getUserConnectionUrl( { from, redirect_url: returnTo, skip_pricing: true } );
}

/**
 * The name a product's own connect links send, such as `my_jetpack_products_backup`.
 *
 * @param slug - My Jetpack's product slug.
 * @return The name.
 */
export function productsFrom( slug: string ): string {
	// An older shared jetpack-connection script may lack CONNECTION_FROM: use the `my-jetpack` its links send.
	return CONNECTION_FROM?.myJetpackProducts( slug ) ?? 'my-jetpack';
}

/**
 * The route to the connection screen, with `from` in its query.
 *
 * @param from - The entry-point name, such as `my_jetpack_products_backup`.
 * @return The route, such as `/connection?from=my_jetpack_products_backup`.
 */
export function connectionScreenRoute( from: string ): ConnectionScreenRoute {
	return `${ MyJetpackRoutes.Connection }?from=${ encodeURIComponent( from ) }`;
}
