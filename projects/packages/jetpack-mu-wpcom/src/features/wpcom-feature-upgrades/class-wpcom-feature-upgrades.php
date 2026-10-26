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
	 * Per My Jetpack feature slug: the hosting feature page that knows where the feature lives, and
	 * the Calypso plan feature that limits the upgrade's plans grid to plans that include it.
	 *
	 * @var array<string, array{page: class-string<WPCOM_Hosting_Feature_Page>, plan_feature: string}>
	 */
	const FEATURES = array(
		'backup'            => array(
			'page'         => WPCOM_Backup::class,
			'plan_feature' => 'backups-self-serve',
		),
		'protect-dashboard' => array(
			'page'         => WPCOM_Scan::class,
			'plan_feature' => 'scan-self-serve',
		),
	);

	/**
	 * Send a feature's upgrade to the WordPress.com plans, and its manage link to where WordPress.com serves it.
	 *
	 * @param array  $upgrade  Where the upgrade goes: `path`, `name`, `back_url`, and optionally `url` and `manage_url`.
	 * @param string $slug     The My Jetpack feature slug.
	 * @param bool   $included Whether the site already has the feature.
	 * @return array
	 */
	public static function filter_feature_upgrade( $upgrade, $slug, $included ) {
		$page = self::FEATURES[ $slug ]['page'] ?? null;

		if ( null === $page || ! class_exists( $page ) ) {
			return $upgrade;
		}

		if ( $included ) {
			return array_merge( (array) $upgrade, array( 'manage_url' => $page::get_live_feature_url() ) );
		}

		return array(
			'path' => '',
			'name' => 'WordPress.com Business', // Product name, do not translate.
			'url'  => self::get_plan_upgrade_url( $slug, (string) ( $upgrade['back_url'] ?? '' ) ),
		);
	}

	/**
	 * WordPress.com's plan upgrade flow, showing only plans with the feature, with Back to the page the link was on.
	 *
	 * The flow and checkout accept `back_to` and `redirect_to` only on the site's own host or WordPress.com.
	 *
	 * @param string $slug     A My Jetpack feature slug from FEATURES.
	 * @param string $back_url The admin page the link is on; the feature's page when empty or off this site.
	 * @return string
	 */
	public static function get_plan_upgrade_url( $slug, $back_url = '' ) {
		$page = self::FEATURES[ $slug ]['page'];
		$back = '' === $back_url ? '' : wp_validate_redirect( $back_url, '' );

		return add_query_arg(
			array(
				'siteSlug'    => rawurlencode( wpcom_get_site_slug() ),
				'feature'     => self::FEATURES[ $slug ]['plan_feature'],
				'back_to'     => rawurlencode( $back ? $back : $page::get_page_url() ),
				'redirect_to' => rawurlencode( $page::get_live_feature_url() ),
			),
			'https://wordpress.com/setup/plan-upgrade'
		);
	}
}
