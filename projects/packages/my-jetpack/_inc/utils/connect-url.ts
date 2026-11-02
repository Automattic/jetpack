import { getUserConnectionUrl } from '@automattic/jetpack-connection';
import { MyJetpackRoutes } from '../constants';

export type ConnectionScreenRoute = `${ typeof MyJetpackRoutes.Connection }?from=${ string }`;

/**
 * A link that connects the user's account, then returns them to `returnTo` without the plans page.
 *
 * @param from     - The entry-point name, such as `my_jetpack_header`.
 * @param returnTo - The absolute URL to return to; Calypso ignores a relative one. Defaults to the current page.
 * @return The URL.
 */
export function getConnectUrl( from: string, returnTo: string = window.location.href ): string {
	return getUserConnectionUrl( { from, redirect_url: returnTo, skip_pricing: false } );
}

/**
 * The route to the connection screen, which forwards `from` to the connection it starts.
 *
 * @param from - The entry-point name, such as `my_jetpack_products_backup`.
 * @return The route, such as `/connection?from=my_jetpack_products_backup`.
 */
export function connectionScreenRoute( from: string ): ConnectionScreenRoute {
	return `${ MyJetpackRoutes.Connection }?from=${ encodeURIComponent( from ) }`;
}
