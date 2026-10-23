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
	 * The hosting feature page behind each My Jetpack feature slug, which knows where the feature lives.
	 *
	 * @var array<string, class-string<WPCOM_Hosting_Feature_Page>>
	 */
	const FEATURES = array(
		'backup'            => WPCOM_Backup::class,
		'protect-dashboard' => WPCOM_Scan::class,
	);

	/**
	 * Send a feature's upgrade to the WordPress.com plans, and its manage link to where WordPress.com serves it.
	 *
	 * @param array  $upgrade  Where the upgrade goes: `path`, `name`, and optionally `url` and `manage_url`.
	 * @param string $slug     The My Jetpack feature slug.
	 * @param bool   $included Whether the site already has the feature.
	 * @return array
	 */
	public static function filter_feature_upgrade( $upgrade, $slug, $included ) {
		$page = self::FEATURES[ $slug ] ?? null;

		if ( null === $page || ! class_exists( $page ) ) {
			return $upgrade;
		}

		if ( $included ) {
			return array_merge( (array) $upgrade, array( 'manage_url' => $page::get_live_feature_url() ) );
		}

		return array(
			'path' => '',
			'name' => 'WordPress.com Business', // Product name, do not translate.
			'url'  => self::get_plans_url( wpcom_get_site_slug() ),
		);
	}

	/**
	 * The WordPress.com plans page, with Business picked: the lowest plan that includes these features.
	 *
	 * @param string $site_slug The site's WordPress.com slug.
	 * @return string
	 */
	public static function get_plans_url( $site_slug ) {
		return 'https://wordpress.com/plans/' . $site_slug . '?plan=business-bundle';
	}
}
