<?php
/**
 * Resolves proxy endpoints to their area formatter.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST\Formatters;

/**
 * Maps an analytics area (the first endpoint segment, e.g. `stats`) to the single
 * formatter that owns it. One formatter per area; per-resource differences are
 * the formatter's concern. Endpoints in an unregistered area get no formatter and
 * are proxied unchanged.
 */
class Formatter_Registry {

	/**
	 * Area => formatter class.
	 *
	 * @var array<string, class-string<Widget_Formatter>>
	 */
	private const FORMATTERS = array(
		'stats' => Stats_Formatter::class,
	);

	/**
	 * The formatter for an endpoint's area, or null when the area is unregistered.
	 *
	 * @param string $endpoint Proxied analytics sub-path (e.g. `stats/top-posts`).
	 *
	 * @return Widget_Formatter|null
	 */
	public static function for_endpoint( string $endpoint ): ?Widget_Formatter {
		$area = self::area( $endpoint );
		if ( '' === $area || ! isset( self::FORMATTERS[ $area ] ) ) {
			return null;
		}

		$class = self::FORMATTERS[ $area ];

		return new $class();
	}

	/**
	 * The area segment (the first path segment) of an endpoint.
	 *
	 * @param string $endpoint Proxied analytics sub-path.
	 *
	 * @return string
	 */
	private static function area( string $endpoint ): string {
		$segments = explode( '/', trim( $endpoint, '/' ) );

		return $segments[0] ?? '';
	}
}
