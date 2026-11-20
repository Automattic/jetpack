<?php
/**
 * The announcements the dashboard publishes on the What's new surface it hosts.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use function Automattic\Jetpack\Announcements\register_announcement;

/**
 * Registers the dashboard's announcements with the Jetpack Announcements package.
 */
class Dashboard_Announcements {

	/**
	 * Channel of the dashboard: its announcements are published to it and its surface subscribes to it.
	 */
	const CHANNEL = 'premium-analytics';

	/**
	 * Flag that turns the dashboard's What's new surface and its announcements on.
	 */
	const FLAG = 'jetpack-stats-whats-new';

	/**
	 * Register the flag, the registrant, and the flag's answer for the dashboard's client.
	 *
	 * @return void
	 */
	public static function configure() {
		Feature_Flags::register(
			self::FLAG,
			array(
				'default'     => false,
				'description' => "Show the What's new teaser and reader on Stats v2, with the announcements the dashboard registers.",
				'owner'       => 'jetpack-stats',
			)
		);

		add_action( 'jetpack_register_announcements', array( __CLASS__, 'register' ) );
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ), 20 );
	}

	/**
	 * Whether the dashboard shows What's new.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return Feature_Flags::is_enabled( self::FLAG );
	}

	/**
	 * Tell the dashboard's client whether to mount the What's new surface.
	 *
	 * @param array $data The script data passed by the assets package.
	 * @return array
	 */
	public static function add_script_data( array $data ): array {
		if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
			$data['premium_analytics'] = array();
		}

		$data['premium_analytics']['whats_new_enabled'] = self::is_enabled();

		return $data;
	}

	/**
	 * Register the dashboard's announcements.
	 *
	 * @return void
	 */
	public static function register() {
		if ( ! self::is_enabled() ) {
			return;
		}

		// Another plugin may load an older copy of the package first.
		if ( ! function_exists( 'Automattic\\Jetpack\\Announcements\\register_announcement' ) ) {
			return;
		}

		// The dashboard's own rules: what shipped before a user arrived is no news to them,
		// and its news is for whoever can read the dashboard.
		foreach ( self::get_announcements() as $id => $announcement ) {
			if ( ! self::predates_current_user( $announcement['date'] ) ) {
				register_announcement( $id, $announcement + array( 'capability' => Capabilities::VIEW_ANALYTICS ) );
			}
		}
	}

	/**
	 * The announcements of the dashboard, as `$id => $args` pairs.
	 *
	 * @return array[]
	 */
	private static function get_announcements() {
		return array(
			'premium-analytics/arrange-tabs' => array(
				'date'     => '2026-11-12',
				'title'    => __( 'Arrange your tabs', 'jetpack-premium-analytics-pkg' ),
				'excerpt'  => __( 'Reorder the dashboard tabs and choose the one that opens first.', 'jetpack-premium-analytics-pkg' ),
				'content'  => '<p>' . esc_html__( 'Open the Stats options menu and choose Arrange tabs to reorder the tabs and to choose the one that opens first.', 'jetpack-premium-analytics-pkg' ) . '</p>',
				'channels' => array( self::CHANNEL ),
			),
		);
	}

	/**
	 * Whether a date is older than the current user's registration.
	 *
	 * @param string $date Date of an announcement.
	 * @return bool
	 */
	private static function predates_current_user( $date ) {
		$registered = strtotime( wp_get_current_user()->user_registered . ' +0000' );

		return false !== $registered && strtotime( $date . ' +0000' ) < $registered;
	}
}
