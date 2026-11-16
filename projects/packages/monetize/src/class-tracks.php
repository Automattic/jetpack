<?php
/**
 * Tracks consent, transport and identity for the Monetize dashboard.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * What the page's JS needs to record Tracks events, as on Jetpack's other admin pages.
 *
 * @since $$next-version$$
 */
class Tracks {

	/**
	 * Whether the site and user allow Tracks.
	 *
	 * @return bool
	 */
	public static function is_allowed() {
		$tracking = new Tracking( 'jetpack', new Connection_Manager( 'jetpack' ) );

		return $tracking->should_enable_tracking( new Terms_Of_Service(), new Status() );
	}

	/**
	 * Load the Tracks script on the dashboard; other packages load it only for some plans.
	 *
	 * @return void
	 */
	public static function enqueue_transport() {
		if ( Dashboard::is_dashboard_request() && self::is_allowed() ) {
			wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
		}
	}

	/**
	 * Add the connected WordPress.com user for Tracks, unless another package already did.
	 *
	 * @param array $data Script data.
	 * @return array
	 */
	public static function add_identity( $data ) {
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
}
