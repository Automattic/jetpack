<?php
/**
 * Sends Jetpack's upgrade and plan links on WoA to WordPress.com's plans.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Answers My Jetpack's `jetpack_feature_upgrade` and `jetpack_my_jetpack_plan_urls` filters with WordPress.com's plans.
 */
class WPCOM_Feature_Upgrades {

	/**
	 * The hosting feature page behind each My Jetpack feature slug.
	 *
	 * @var array<string, class-string<WPCOM_Hosting_Feature_Page>>
	 */
	const PAGES = array(
		'backup'            => WPCOM_Backup::class,
		'protect-dashboard' => WPCOM_Scan::class,
	);

	/**
	 * Plans with none above them: Commerce, and Woo Hosted Pro, whose stores the upgrade flow keeps on Woo Hosted plans.
	 *
	 * Slugs, because `Current_Plan` gives Commerce the same `business` class as Business.
	 *
	 * @var string[]
	 */
	const TOP_PLANS = array(
		'ecommerce-bundle',
		'ecommerce-bundle-monthly',
		'ecommerce-bundle-2y',
		'ecommerce-bundle-3y',
		'woo_hosted_pro_plan_monthly',
		'woo_hosted_pro_plan_yearly',
	);

	/**
	 * Send a feature's upgrade to the WordPress.com plans; a site that has it keeps Jetpack's own manage link.
	 *
	 * @param array  $upgrade          Where the upgrade goes: `path`, `name`, `back_url`, and optionally `url`.
	 * @param string $slug             The My Jetpack feature slug.
	 * @param bool   $site_has_feature Whether the site already has the feature.
	 * @return array
	 */
	public static function filter_feature_upgrade( $upgrade, $slug, $site_has_feature ) {
		if ( $site_has_feature || ! isset( self::PAGES[ $slug ] ) ) {
			return $upgrade;
		}

		$page = self::PAGES[ $slug ];

		return array(
			'path' => '',
			'name' => 'WordPress.com Business', // Product name, do not translate.
			'url'  => $page::get_plan_upgrade_url( (string) ( $upgrade['back_url'] ?? '' ) ),
		);
	}

	/**
	 * Send My Jetpack's plan links to the WordPress.com plan upgrade flow and the site's purchases.
	 *
	 * @param array $urls Where the `purchase` and `manage` links go, or false to hide one.
	 * @return array
	 */
	public static function filter_plan_urls( $urls ) {
		$urls = (array) $urls;

		// As the Simple My Jetpack page and the Upgrades and Purchases menus do, offer these sites no plan links.
		if ( get_option( 'wpcom_is_staging_site' ) || is_fully_managed_agency_site() ) {
			$urls['purchase'] = false;
			$urls['manage']   = false;

			return $urls;
		}

		$site_slug  = wpcom_get_site_slug();
		$my_jetpack = rawurlencode( admin_url( 'admin.php?page=my-jetpack' ) );

		// No `feature`, which would narrow the plans the flow offers to those with one feature.
		$upgrade_url = add_query_arg(
			array(
				'siteSlug'    => rawurlencode( $site_slug ),
				'back_to'     => $my_jetpack,
				'redirect_to' => $my_jetpack,
			),
			'https://wordpress.com/setup/plan-upgrade'
		);

		$urls['purchase'] = self::has_top_plan() ? false : $upgrade_url;
		$urls['manage']   = 'https://wordpress.com/purchases/subscriptions/' . $site_slug;

		return $urls;
	}

	/**
	 * Whether the site's plan has none above it for the upgrade flow to offer.
	 *
	 * @return bool
	 */
	private static function has_top_plan() {
		// Tests fill the expiry notices' wrapper; without it, wpcomsh answers directly.
		if ( function_exists( 'wpcom_expiry_get_purchases' ) ) {
			$purchases = wpcom_expiry_get_purchases();
		} elseif ( function_exists( 'wpcom_get_site_purchases' ) ) {
			$purchases = wpcom_get_site_purchases();
		} else {
			$purchases = array();
		}

		foreach ( (array) $purchases as $purchase ) {
			if ( in_array( $purchase->product_slug ?? '', self::TOP_PLANS, true ) ) {
				return true;
			}
		}

		return false;
	}
}
