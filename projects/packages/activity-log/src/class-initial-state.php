<?php
/**
 * The Activity Log React initial state.
 *
 * @package automattic/jetpack-activity-log
 */

namespace Automattic\Jetpack\Activity_Log;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\My_Jetpack\Products as My_Jetpack_Products;
use Automattic\Jetpack\Status;
use function add_query_arg;
use function admin_url;
use function apply_filters;
use function esc_url_raw;
use function function_exists;
use function get_bloginfo;
use function get_current_blog_id;
use function get_locale;
use function get_option;
use function get_site_url;
use function rawurlencode;
use function wp_create_nonce;
use function wp_get_current_user;
use function wp_json_encode;
use function wp_parse_url;

/**
 * The Activity Log React initial state.
 */
class Initial_State {
	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private function get_data() {
		$gmt_offset      = get_option( 'gmt_offset' );
		$timezone_string = get_option( 'timezone_string' );
		$home_host       = wp_parse_url( get_site_url(), PHP_URL_HOST );
		$site_suffix     = ( new Status() )->get_site_suffix();
		$is_wpcom_simple = Jetpack_Activity_Log::is_wpcom_simple();
		$has_access      = REST_Controller::has_activity_logs_access();
		$upgrade         = array(
			'slug'               => 'security',
			'title'              => 'Jetpack Security',
			'wpcom_product_slug' => 'jetpack_security_t1_yearly',
		);
		if ( ! $has_access && ! $is_wpcom_simple && method_exists( My_Jetpack_Products::class, 'get_bundle_offer' ) ) {
			$upgrade = My_Jetpack_Products::get_bundle_offer( 'security' );
		}

		return array(
			'upgrade'       => $upgrade,
			'jetpackStatus' => array(
				'calypsoSlug'        => $site_suffix,
				/**
				 * Filters the in-admin address "Restore backup" opens, with `{rewindId}` as the placeholder.
				 * Empty keeps the Jetpack Cloud restore flow.
				 *
				 * @since 0.7.0
				 *
				 * @param string $template Restore URL template, or an empty string.
				 */
				'restoreUrlTemplate' => (string) apply_filters( 'jetpack_activity_log_restore_url_template', '' ),
				/**
				 * Filters the in-admin address a link to a backup opens, with `{rewindId}` as the placeholder.
				 * Empty leaves such links as plain text.
				 *
				 * @since 0.7.0
				 *
				 * @param string $template Backup URL template, or an empty string.
				 */
				'backupUrlTemplate'  => (string) apply_filters( 'jetpack_activity_log_backup_url_template', '' ),
			),
			'config'        => array(
				// Simple sites have no Jetpack REST API to proxy through, so the app calls WordPress.com directly.
				'apiSource'             => $is_wpcom_simple ? 'wpcom' : 'jetpack',
				'wpcomUpgradeUrl'       => $is_wpcom_simple ? self::get_wpcom_upgrade_url( $site_suffix ) : '',
				'tracksUserData'        => $is_wpcom_simple ? self::get_wpcom_tracks_user_data() : null,
				'knownThreatsAvailable' => REST_Controller::known_threats_available(),
				'hiddenGroups'          => $is_wpcom_simple ? self::get_wpcom_hidden_groups() : array(),
			),
			'siteData'      => array(
				'id'                    => Connection_Manager::get_site_id( true ),
				'title'                 => get_bloginfo( 'name' ) ? get_bloginfo( 'name' ) : get_site_url(),
				'adminUrl'              => esc_url_raw( admin_url() ),
				'slug'                  => is_string( $home_host ) ? $home_host : '',
				'gmtOffset'             => is_numeric( $gmt_offset ) ? (float) $gmt_offset : 0.0,
				'timezoneString'        => is_string( $timezone_string ) ? $timezone_string : '',
				'locale'                => str_replace( '_', '-', (string) get_locale() ),
				// The paid-plan capability check. Drives the free-tier
				// upsell callout and matches the server-side clamp in
				// REST_Controller::get_activity_log(). The result is
				// cached in a site transient by the REST controller
				// (5-minute TTL); on a cache miss this call issues a
				// synchronous WPCOM request (~200–800ms typical, up to
				// the 2s internal timeout) that blocks page rendering
				// until it returns.
				'hasActivityLogsAccess' => $has_access,
			),
			'nonces'        => array(
				// Consumed by `UpsellCallout` to build a `redirect_to`
				// URL that invalidates the access cache on return from
				// checkout. See `Jetpack_Activity_Log::admin_init()`.
				'refreshAccess' => wp_create_nonce( Jetpack_Activity_Log::REFRESH_ACCESS_NONCE_ACTION ),
			),
		);
	}

	/**
	 * WordPress.com plan selection, returning here after checkout or cancel.
	 *
	 * @param string $site_suffix The site's Calypso slug.
	 * @return string
	 */
	private static function get_wpcom_upgrade_url( $site_suffix ) {
		$page_url = rawurlencode( admin_url( 'admin.php?page=' . Jetpack_Activity_Log::PAGE_SLUG ) );

		return add_query_arg(
			array(
				'siteSlug'    => rawurlencode( $site_suffix ),
				'redirect_to' => $page_url,
				'cancel_to'   => $page_url,
			),
			'https://wordpress.com/setup/plan-upgrade/'
		);
	}

	/**
	 * Activity groups to hide on a Simple site without backups, such as events left over from an Atomic past.
	 *
	 * @return string[]
	 */
	private static function get_wpcom_hidden_groups() {
		if ( function_exists( 'wpcom_site_has_feature' ) && wpcom_site_has_feature( 'backups-self-serve', get_current_blog_id() ) ) {
			return array();
		}

		return array( 'rewind', 'scan' );
	}

	/**
	 * The Tracks identity of the current user, who on Simple is the WordPress.com user.
	 *
	 * @return array{userid: int, username: string}|null
	 */
	private static function get_wpcom_tracks_user_data() {
		$user = wp_get_current_user();
		if ( ! $user->exists() ) {
			return null;
		}

		return array(
			'userid'   => $user->ID,
			'username' => $user->user_login,
		);
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render() {
		return 'var JPACTIVITYLOG_INITIAL_STATE=' . wp_json_encode( $this->get_data(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';';
	}
}
