<?php
/**
 * Sends Jetpack's upgrade and plan links on WordPress.com sites to WordPress.com's plans.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Answers the `jetpack_feature_upgrade` and `jetpack_my_jetpack_plan_urls` filters of My Jetpack and the Monetize page with WordPress.com's plans.
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
	 * The plan feature the upgrade flow filters on, for My Jetpack features without a hosting page.
	 *
	 * The flow offers the plans the site's WordPress.com feature map lists for a value, and reads Calypso's plan definitions for a value that map doesn't define.
	 *
	 * @var array<string, string>
	 */
	const PLAN_FEATURES = array(
		'google-analytics' => 'google-analytics',
		'jetpack-forms'    => 'field-file',
		'monetize'         => self::MONETIZE_PLAN_FEATURE,
		// Calypso lists no podcasting feature, and every plan above Personal grants it, so the flow offers them all.
		'podcast'          => '',
		'social'           => 'republicize',
		'videopress'       => 'videopress',
	);

	/**
	 * The slug the Monetize page's upgrade links pass to `jetpack_feature_upgrade`.
	 *
	 * @var string
	 */
	const MONETIZE_SLUG = 'monetize-dashboard';

	/**
	 * The plan feature the flow filters Monetize's upgrade on: Calypso's plan lists name ads `wordads-instant`.
	 *
	 * @var string
	 */
	const MONETIZE_PLAN_FEATURE = 'wordads-instant';

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
	 * Send a feature's upgrade to the WordPress.com plans that include it; a site that has it keeps Jetpack's own manage link.
	 *
	 * @param array  $upgrade          Where the upgrade goes: `path`, `name`, `back_url`, and optionally `url`.
	 * @param string $slug             The My Jetpack feature slug.
	 * @param bool   $site_has_feature Whether the site already has the feature.
	 * @return array
	 */
	public static function filter_feature_upgrade( $upgrade, $slug, $site_has_feature ) {
		if ( $site_has_feature ) {
			return $upgrade;
		}

		$back_url = (string) ( $upgrade['back_url'] ?? '' );

		if ( isset( self::PAGES[ $slug ] ) ) {
			$page = self::PAGES[ $slug ];

			return array(
				'path' => '',
				'name' => 'WordPress.com', // Product name, do not translate.
				'url'  => $page::get_plan_upgrade_url( $back_url ),
			);
		}

		if ( isset( self::PLAN_FEATURES[ $slug ] ) ) {
			return array(
				'path' => '',
				'name' => 'WordPress.com', // Product name, do not translate.
				'url'  => self::get_plan_upgrade_url( self::PLAN_FEATURES[ $slug ], $back_url, admin_url( 'admin.php?page=my-jetpack' ) ),
			);
		}

		return $upgrade;
	}

	/**
	 * Send the Monetize page's upgrade links to the WordPress.com plans with ads, which come back to the page.
	 *
	 * Staging and fully managed agency sites can't buy a plan, so they get no upgrade link, as in filter_plan_urls().
	 *
	 * @since $$next-version$$
	 *
	 * @param array  $upgrade Where the upgrade goes: `path`, `name`, `back_url`, and optionally `url`.
	 * @param string $slug    The feature slug.
	 * @return array
	 */
	public static function filter_monetize_upgrade( $upgrade, $slug ) {
		if ( self::MONETIZE_SLUG !== $slug ) {
			return $upgrade;
		}

		if ( get_option( 'wpcom_is_staging_site' ) || is_fully_managed_agency_site() ) {
			return array( 'url' => '' ) + $upgrade;
		}

		return array(
			'path' => '',
			'name' => 'WordPress.com', // Product name, do not translate.
			'url'  => self::get_plan_upgrade_url( self::MONETIZE_PLAN_FEATURE, (string) ( $upgrade['back_url'] ?? '' ), admin_url( 'admin.php?page=jetpack-monetize' ) ),
		);
	}

	/**
	 * WordPress.com's plan upgrade flow, which comes back to the page the link was on after checkout or Back.
	 *
	 * @param string $feature  The plan feature to filter plans on, as Calypso names it; '' offers every higher plan.
	 * @param string $back_url The page the link is on.
	 * @param string $fallback Where to come back to when `$back_url` is empty or off this site.
	 * @return string
	 */
	private static function get_plan_upgrade_url( $feature, $back_url, $fallback ) {
		$back = '' === $back_url ? '' : wp_validate_redirect( $back_url, '' );
		$back = rawurlencode( $back ? $back : $fallback );

		return add_query_arg(
			array_filter(
				array(
					'siteSlug'    => rawurlencode( wpcom_get_site_slug() ),
					'feature'     => $feature,
					'back_to'     => $back,
					'redirect_to' => $back,
				)
			),
			'https://wordpress.com/setup/plan-upgrade'
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
