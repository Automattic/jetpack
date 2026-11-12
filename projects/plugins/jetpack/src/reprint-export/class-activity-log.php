<?php
/**
 * Records Reprint export events in the Jetpack Activity Log.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Reprint_Export;

use Automattic\Jetpack\IP\Utils as IP_Utils;
use Automattic\Jetpack\Sync\Activity_Log_Event;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Turns jetpack_reprint_export_event into Activity Log entries.
 */
class Activity_Log {

	/**
	 * Events logged once per client IP per THROTTLE_SECONDS: an export is thousands of requests,
	 * and every entry is a post insert plus a Sync queue item.
	 *
	 * @var string[]
	 */
	const THROTTLED_EVENTS = array( 'export_served' );

	/**
	 * Events that start a new migration, so the next throttled event is logged again.
	 *
	 * @var string[]
	 */
	const THROTTLE_RESET_EVENTS = array( 'secret_rotated', 'public_key_installed', 'window_opened' );

	/**
	 * Throttle window for THROTTLED_EVENTS, in seconds.
	 *
	 * @var int
	 */
	const THROTTLE_SECONDS = HOUR_IN_SECONDS;

	/**
	 * Prefix of the transients that throttle THROTTLED_EVENTS.
	 *
	 * @var string
	 */
	const THROTTLE_TRANSIENT_PREFIX = 'jetpack_reprint_log_';

	/**
	 * Starts listening for export events.
	 */
	public static function init() {
		add_action( 'jetpack_reprint_export_event', array( __CLASS__, 'record' ) );
	}

	/**
	 * Logs an export event, unless it is throttled or Sync lacks Activity Log support.
	 *
	 * @param string $event Event name.
	 */
	public static function record( $event ) {
		// Another plugin may have loaded a Sync package older than the Activity Log API.
		if ( ! class_exists( Activity_Log_Event::class ) ) {
			return;
		}

		// Only export requests reach the site directly; the rest come through the WordPress.com proxy.
		$ip    = 'export_served' === $event ? (string) IP_Utils::get_ip() : '';
		$entry = self::describe( (string) $event, $ip );
		if ( null === $entry ) {
			return;
		}

		if ( in_array( $event, self::THROTTLE_RESET_EVENTS, true ) ) {
			foreach ( self::THROTTLED_EVENTS as $throttled ) {
				delete_transient( self::THROTTLE_TRANSIENT_PREFIX . $throttled );
			}
		}

		if ( in_array( $event, self::THROTTLED_EVENTS, true ) ) {
			$transient = self::THROTTLE_TRANSIENT_PREFIX . $event;
			$logged    = get_transient( $transient );
			$logged    = is_array( $logged ) ? $logged : array();
			if ( isset( $logged[ $ip ] ) ) {
				return;
			}
			$logged[ $ip ] = time();
			set_transient( $transient, $logged, self::THROTTLE_SECONDS );
		}

		// Rendered as "Source: Jetpack"; without it, dashboards show "Source: Custom entry".
		$entry['source'] = 'jetpack';

		// Activity_Log_Event::create() needs Sync's listeners, which are only in place from init on.
		if ( did_action( 'init' ) ) {
			Activity_Log_Event::create( $entry );
		} else {
			add_action(
				'init',
				static function () use ( $entry ) {
					Activity_Log_Event::create( $entry );
				},
				PHP_INT_MAX
			);
		}
	}

	/**
	 * The Activity Log entry for an event.
	 *
	 * Dashboards show `content` as the headline and `title` as the label, like a plugin name
	 * under "Plugin installed", so both stay short.
	 *
	 * @param string $event Event name.
	 * @param string $ip    Client IP of an export request, or ''.
	 * @return array|null Title, content and severity, or null for an event that is not logged.
	 */
	public static function describe( $event, $ip = '' ) {
		switch ( $event ) {
			case 'secret_rotated':
			case 'public_key_installed':
				return array(
					'title'    => __( 'Migration key added', 'jetpack' ),
					'content'  => __( 'Migration key', 'jetpack' ),
					'severity' => 'warning',
				);

			case 'window_opened':
				return array(
					'title'    => __( 'Site export enabled', 'jetpack' ),
					'content'  => __( 'One-hour export window', 'jetpack' ),
					'severity' => 'warning',
				);

			case 'export_served':
				return array(
					'title'    => __( 'Site export in progress', 'jetpack' ),
					'content'  => '' === $ip
						? __( 'Site export', 'jetpack' )
						/* translators: %s: IP address of the client exporting the site. */
						: sprintf( __( 'Site export from IP Address %s', 'jetpack' ), $ip ),
					'severity' => 'info',
				);

			case 'credentials_discarded':
				return array(
					'title'    => __( 'Migration keys removed', 'jetpack' ),
					'content'  => __( 'Site connected, disconnected or activated', 'jetpack' ),
					'severity' => 'info',
				);
		}

		return null;
	}
}
