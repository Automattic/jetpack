<?php
/**
 * Where the Ads settings live once they leave Jetpack › Settings.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Monetize\Dashboard;
use Automattic\Jetpack\My_Jetpack\Initializer;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Picks this site's home for the Ads settings, for the Settings app, the Monetize page and configure_url.
 *
 * @since $$next-version$$
 */
class Jetpack_Ads_Settings_Home {

	/**
	 * Monetize › Settings, for a Monetize package older than `Dashboard::get_tab_url()`.
	 *
	 * @var string
	 */
	const MONETIZE_SETTINGS_PATH = 'admin.php?page=jetpack-monetize&p=%2F%3Ftab%3Dsettings';

	/**
	 * Hook the configure URL and the script data.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'jetpack_module_configuration_url_wordads', array( __CLASS__, 'filter_configure_url' ) );
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ) );
	}

	/**
	 * Whether the Monetize page shows the Ads settings. Needs no admin menu, so REST requests agree.
	 *
	 * @return bool
	 */
	public static function is_on_monetize_page() {
		return class_exists( Dashboard::class )
			&& Dashboard::is_enabled()
			&& Jetpack::is_module_active( 'monetize' )
			// The module needs a connection: it stays listed as active, but never loads offline or disconnected.
			&& Jetpack::is_connection_ready()
			&& ! ( new Status() )->is_offline_mode();
	}

	/**
	 * Whether Jetpack › Settings drops its Ads card for Monetize › Settings.
	 *
	 * @return bool
	 */
	public static function is_moved_off_settings() {
		return self::is_consolidation_on() && self::is_on_monetize_page();
	}

	/**
	 * Monetize › Settings, or null where the Monetize page doesn't show the Ads settings.
	 *
	 * @return string|null
	 */
	public static function get_url() {
		if ( ! self::is_on_monetize_page() ) {
			return null;
		}

		return method_exists( Dashboard::class, 'get_tab_url' )
			? Dashboard::get_tab_url( 'settings' )
			: admin_url( self::MONETIZE_SETTINGS_PATH );
	}

	/**
	 * Point the WordAds configure URL at its home.
	 *
	 * @param string $url Jetpack's settings-search default.
	 * @return string
	 */
	public static function filter_configure_url( $url ) {
		return self::get_url() ?? $url;
	}

	/**
	 * Add the tab's data on the Monetize page, and the URL Jetpack › Settings points to once it drops its card.
	 *
	 * @param array $data Script data.
	 * @return array
	 */
	public static function add_script_data( $data ) {
		$is_tab_request = self::is_tab_request();
		$is_moved       = self::is_moved_off_settings();
		if ( ! $is_tab_request && ! $is_moved ) {
			return $data;
		}

		if ( ! is_array( $data ) ) {
			$data = array();
		}

		if ( $is_moved ) {
			$data['monetize']['adsSettingsUrl'] = self::get_url();
		}

		if ( $is_tab_request ) {
			$data['monetize']['adsSettings'] = self::get_dashboard_data();
		}

		return $data;
	}

	/**
	 * Whether this request opens the Monetize page that holds the Ads settings.
	 *
	 * @return bool
	 */
	private static function is_tab_request() {
		// Do not reorder: is_on_monetize_page() checks that Dashboard exists.
		return self::is_on_monetize_page() && Dashboard::is_dashboard_request();
	}

	/**
	 * Whether settings consolidation is on for the site, guarded against an older My Jetpack.
	 *
	 * @return bool
	 */
	private static function is_consolidation_on() {
		return class_exists( Initializer::class )
			&& method_exists( Initializer::class, 'is_settings_consolidation_on_for_site' )
			&& Initializer::is_settings_consolidation_on_for_site();
	}

	/**
	 * What the Settings tab needs from the server, built as the Settings app's Ads card builds it.
	 *
	 * @return array
	 */
	private static function get_dashboard_data() {
		$connection = new Connection_Manager();
		$suffix     = ( new Status() )->get_site_suffix();
		$blog_id    = Jetpack_Options::get_option( 'id' );
		$site       = $blog_id ? (string) $blog_id : $suffix;

		return array(
			'hasWordAds'         => Current_Plan::supports( 'wordads' ),
			'hasConnectedOwner'  => $connection->has_connected_owner(),
			'earningsUrl'        => Redirect::get_url( 'calypso-stats-ads-day', array( 'site' => $site ) ),
			'isSubdirectorySite' => str_contains( $suffix, '::' ),
			'moduleOverride'     => Jetpack_Modules_Overrides::instance()->get_module_override( 'wordads' ),
		);
	}
}

Jetpack_Ads_Settings_Home::init();
