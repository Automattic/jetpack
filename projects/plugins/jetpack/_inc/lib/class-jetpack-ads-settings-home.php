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
use Automattic\Jetpack\Partner;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

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
	 * Monetize › Settings. wp-build reads a route's search params from `p`.
	 *
	 * @var string
	 */
	const MONETIZE_SETTINGS_PATH = 'admin.php?page=jetpack-monetize&p=%2F%3Ftab%3Dsettings';

	/**
	 * Calypso's Ads settings, followed by the site slug.
	 *
	 * TODO: DOTCOM-13919 — send Atomic to Monetize › Settings once the wpcom menu opens it.
	 *
	 * @var string
	 */
	const CALYPSO_URL = 'https://wordpress.com/earn/ads-settings/';

	/**
	 * Hook the configure URL and the script data.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'jetpack_module_configuration_url_wordads', array( __CLASS__, 'filter_configure_url' ) );
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_tracks_transport' ) );
	}

	/**
	 * Whether the Ads settings live on Monetize › Settings. Needs no admin menu, so REST requests agree.
	 *
	 * @return bool
	 */
	public static function is_on_monetize_page() {
		return self::is_consolidation_on()
			&& class_exists( Dashboard::class )
			&& Dashboard::is_enabled()
			&& Jetpack::is_module_active( 'monetize' )
			// The module needs a connection: it stays listed as active, but never loads offline or disconnected.
			&& Jetpack::is_connection_ready()
			&& ! ( new Status() )->is_offline_mode()
			&& ! ( new Host() )->is_wpcom_platform();
	}

	/**
	 * The Ads settings' home, or null while they stay on Jetpack › Settings.
	 *
	 * @return string|null
	 */
	public static function get_url() {
		if ( self::is_on_monetize_page() ) {
			return admin_url( self::MONETIZE_SETTINGS_PATH );
		}

		if ( self::is_consolidation_on() && ( new Host() )->is_woa_site() ) {
			return self::CALYPSO_URL . ( new Status() )->get_site_suffix();
		}

		return null;
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
	 * Add the home to `JetpackScriptData.monetize`, and the tab's data on the Monetize page.
	 *
	 * @param array $data Script data.
	 * @return array
	 */
	public static function add_script_data( $data ) {
		$url = self::get_url();
		if ( null === $url ) {
			return $data;
		}

		if ( ! is_array( $data ) ) {
			$data = array();
		}

		$data['monetize']['adsSettingsUrl'] = $url;

		if ( self::is_tab_request() ) {
			$data['monetize']['adsSettings'] = self::get_dashboard_data();
			$data                            = self::add_tracks_identity( $data );
		}

		return $data;
	}

	/**
	 * Load the Tracks script on the tab, as Jetpack › Settings does; other packages load it only for some plans.
	 *
	 * @return void
	 */
	public static function enqueue_tracks_transport() {
		if ( self::is_tab_request() && self::can_use_analytics() ) {
			wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
		}
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
	 * Whether the site and user allow Tracks, as on Jetpack's other admin pages.
	 *
	 * @return bool
	 */
	private static function can_use_analytics() {
		$tracking = new Tracking( 'jetpack', new Connection_Manager( 'jetpack' ) );

		return $tracking->should_enable_tracking( new Terms_Of_Service(), new Status() );
	}

	/**
	 * Add the connected WordPress.com user for Tracks, unless another package already did.
	 *
	 * @param array $data Script data.
	 * @return array
	 */
	private static function add_tracks_identity( $data ) {
		if ( ! empty( $data['user']['current_user']['wpcom']['ID'] ) ) {
			return $data;
		}

		$connected = ( new Connection_Manager() )->get_connected_user_data();
		if ( empty( $connected['ID'] ) || empty( $connected['login'] ) ) {
			return $data;
		}

		$data['user']['current_user']['wpcom'] = array_merge(
			$data['user']['current_user']['wpcom'] ?? array(),
			array(
				'ID'    => $connected['ID'],
				'login' => $connected['login'],
			)
		);

		return $data;
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
			'upgradeUrl'         => self::get_upgrade_url( $site, $connection ),
			'earningsUrl'        => Redirect::get_url( 'calypso-stats-ads-day', array( 'site' => $site ) ),
			'isSubdirectorySite' => str_contains( $suffix, '::' ),
			'moduleOverride'     => Jetpack_Modules_Overrides::instance()->get_module_override( 'wordads' ),
			'tracks'             => self::can_use_analytics(),
		);
	}

	/**
	 * The Ads upgrade URL, with the same arguments as the Settings app's `getUpgradeUrl()`.
	 *
	 * @param string             $site       Blog ID, or the site suffix without one.
	 * @param Connection_Manager $connection Connection manager.
	 * @return string
	 */
	private static function get_upgrade_url( $site, $connection ) {
		if ( ! class_exists( 'Jetpack_Redux_State_Helper' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-redux-state-helper.php';
		}

		$query = $connection->is_user_connected() ? '' : 'unlinked=1&';

		$purchase_token = Jetpack_Redux_State_Helper::get_purchase_token();
		if ( $purchase_token ) {
			$query .= 'purchasetoken=' . $purchase_token;
		}

		$partner = Partner::init();

		return Redirect::get_url(
			'jetpack-creator-cta',
			array(
				'site'         => $site,
				'aff'          => $partner->get_partner_code( Partner::AFFILIATE_CODE ),
				'u'            => (string) get_current_user_id(),
				'subsidiaryId' => $partner->get_partner_code( Partner::SUBSIDIARY_CODE ),
				'query'        => $query,
				'calypso_env'  => ( new Host() )->get_calypso_env(),
			)
		);
	}
}

Jetpack_Ads_Settings_Home::init();
