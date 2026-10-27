<?php
/**
 * Sends Jetpack's upgrade and manage links for a feature on WoA to WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Answers the `jetpack_feature_upgrade` filter for the features a WordPress.com plan includes.
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
	 * Send a feature's upgrade to the WordPress.com plans, and its manage link to where WordPress.com serves it.
	 *
	 * @param array  $upgrade          Where the upgrade goes: `path`, `name`, `back_url`, and optionally `url` and `manage_url`.
	 * @param string $slug             The My Jetpack feature slug.
	 * @param bool   $site_has_feature Whether the site already has the feature.
	 * @return array
	 */
	public static function filter_feature_upgrade( $upgrade, $slug, $site_has_feature ) {
		if ( ! isset( self::PAGES[ $slug ] ) ) {
			return $upgrade;
		}

		$page = self::PAGES[ $slug ];

		if ( $site_has_feature ) {
			return array_merge( (array) $upgrade, array( 'manage_url' => $page::get_live_feature_url() ) );
		}

		return array(
			'path' => '',
			'name' => 'WordPress.com Business', // Product name, do not translate.
			'url'  => $page::get_plan_upgrade_url( (string) ( $upgrade['back_url'] ?? '' ) ),
		);
	}
}
