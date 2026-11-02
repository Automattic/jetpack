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
	 * The tier whose themes each need a subscription of their own.
	 */
	const PARTNER = 'partner';

	/**
	 * The plan each tier needs, by tier slug.
	 *
	 * These are the plans that grant the tier's capability, so buying one satisfies
	 * site_can_use(). A tier that is not listed needs no plan.
	 */
	const MINIMUM_PLAN = array(
		'personal'    => 'personal-bundle',
		'premium'     => 'personal-bundle',
		'partner'     => 'personal-bundle',
		'woocommerce' => 'business-bundle',
		'sensei'      => 'business-bundle',
		'community'   => 'business-bundle',
	);

	/**
	 * The plan a tier needs.
	 *
	 * @param string $tier Tier slug.
	 * @return string Plan slug, empty for a tier that needs none.
	 */
	public static function plan_for( string $tier ): string {
		return self::MINIMUM_PLAN[ $tier ] ?? '';
	}

	/**
	 * What to call the plan a tier needs, for a card that offers the upgrade.
	 *
	 * @param string $tier Tier slug.
	 * @return string Plan name, empty for a tier that needs none.
	 */
	public static function plan_name_for( string $tier ): string {
		switch ( self::plan_for( $tier ) ) {
			case 'personal-bundle':
				return __( 'Personal plan', 'jetpack-mu-wpcom' );
			case 'value_bundle':
				return __( 'Premium plan', 'jetpack-mu-wpcom' );
			case 'business-bundle':
				return __( 'Business plan', 'jetpack-mu-wpcom' );
			default:
				return '';
		}
	}

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
	 * Necessary but not sufficient for the partner tier, which every paid plan includes while each
	 * partner theme still needs its own subscription that no plan feature reports.
	 *
	 * @param string $tier Tier slug.
	 * @return bool True for the free tier, which needs no plan. For the rest, false when the
	 *              platform cannot answer, so an unknown host offers nothing.
	 */
	public static function site_can_use( string $tier ): bool {
		// There is no free-themes capability, so asking the platform would deny every free theme.
		if ( self::FREE === $tier ) {
			return true;
		}

		return function_exists( 'wpcom_site_has_feature' )
			&& (bool) wpcom_site_has_feature( self::feature_for( $tier ) );
	}
}
