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
	// `skip_pricing`: see connectionScreenRoute().
	return getUserConnectionUrl( { from, redirect_url: returnTo, skip_pricing: true } );
}

// An older shared jetpack-connection script may lack CONNECTION_FROM: the `*From()` helpers below fall back to the `my-jetpack` its links send.

/**
 * The name a product's own connect links send, such as `my_jetpack_products_backup`.
 *
 * @param slug - My Jetpack's product slug.
 * @return The name.
 */
export function productsFrom( slug: string ): string {
	return CONNECTION_FROM?.myJetpackProducts( slug ) ?? 'my-jetpack';
}

/**
 * The name a recommendation's connect link sends, such as `my_jetpack_recommendations_newsletter`.
 *
 * @param slug - My Jetpack's product slug.
 * @return The name.
 */
export function recommendationsFrom( slug: string ): string {
	return CONNECTION_FROM?.myJetpackRecommendations( slug ) ?? 'my-jetpack';
}

/**
 * The route to the connection screen, with `from` in its query.
 *
 * @param from                - The entry-point name, such as `my_jetpack_products_backup`.
 * @param options             - Options.
 * @param options.skipPricing - Whether the connection skips the plans page.
 * @return The route, such as `/connection?from=my_jetpack_products_backup`.
 */
export function connectionScreenRoute(
	from: string,
	{ skipPricing = false }: { skipPricing?: boolean } = {}
): ConnectionScreenRoute {
	const route: ConnectionScreenRoute = `${ MyJetpackRoutes.Connection }?from=${ encodeURIComponent(
		from
	) }`;
	// Calypso ignores `skip_pricing` for a standard name; it keeps a legacy `my-jetpack` fallback off the plans page.
	return skipPricing ? `${ route }&skip_pricing=true` : route;
}
