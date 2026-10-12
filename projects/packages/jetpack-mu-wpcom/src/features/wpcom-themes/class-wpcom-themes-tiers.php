<?php
/**
 * Class WPCom_Themes_Tiers.
 * What a site's plan includes, by theme tier.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Answers which theme tiers a site's plan includes.
 *
 * Entitlement only. Whether a surface shows a tier it cannot install is that surface's own
 * decision: core's Add Themes tabs hide partner themes because they need their own subscription,
 * while the Marketplace tab lists them to sell them.
 */
class WPCom_Themes_Tiers {

	/**
	 * The tier every site can use.
	 */
	const FREE = 'free';

	/**
	 * The tier of a theme as WordPress.com returns it.
	 *
	 * @param stdClass $theme A theme from the WordPress.com themes API.
	 * @return string Tier slug, premium for a theme that reports none.
	 */
	public static function tier_of( $theme ): string {
		return $theme->theme_tier->slug ?? 'premium';
	}

	/**
	 * The capability name gating a tier.
	 *
	 * @param string $tier Tier slug.
	 * @return string
	 */
	public static function feature_for( string $tier ): string {
		return $tier . '-themes';
	}

	/**
	 * Whether this site's plan includes a tier.
	 *
	 * @param string $tier Tier slug.
	 * @return bool False when the platform cannot answer, so an unknown host offers nothing.
	 */
	public static function site_can_use( string $tier ): bool {
		if ( self::FREE === $tier ) {
			return true;
		}

		return function_exists( 'wpcom_site_has_feature' )
			&& (bool) wpcom_site_has_feature( self::feature_for( $tier ) );
	}
}
