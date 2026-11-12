<?php
/**
 * Records Reprint export events in the Jetpack Activity Log.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Reprint_Export;

use Automattic\Jetpack\Sync\Activity_Log_Event;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Turns jetpack_reprint_export_event into Activity Log entries.
 */
class Activity_Log {

	/**
	 * Events logged at most once per THROTTLE_SECONDS: an export is thousands of requests,
	 * and every entry is a post insert plus a Sync queue item.
	 *
	 * @var string[]
	 */
	const THROTTLED_EVENTS = array( 'export_served' );

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
		add_action( 'jetpack_reprint_export_event', array( __CLASS__, 'record' ), 10, 2 );
	}

	/**
	 * Logs an export event, unless it is throttled or Sync lacks Activity Log support.
	 *
	 * @param string $event   Event name.
	 * @param array  $context Details of the event.
	 */
	public static function record( $event, $context ) {
		// Another plugin may have loaded a Sync package older than the Activity Log API.
		if ( ! class_exists( Activity_Log_Event::class ) ) {
			return;
		}

		$entry = self::describe( (string) $event, is_array( $context ) ? $context : array() );
		if ( null === $entry ) {
			return;
		}

		if ( in_array( $event, self::THROTTLED_EVENTS, true ) ) {
			$transient = self::THROTTLE_TRANSIENT_PREFIX . $event;
			if ( false !== get_transient( $transient ) ) {
				return;
			}
			set_transient( $transient, time(), self::THROTTLE_SECONDS );
		}

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
	 * @param string $event   Event name.
	 * @param array  $context Details of the event.
	 * @return array|null Title, content and severity, or null for an event that is not logged.
	 */
	public static function describe( $event, array $context ) {
		switch ( $event ) {
			case 'secret_rotated':
				return array(
					'title'    => __( 'Site export key added', 'jetpack' ),
					'content'  => __( 'Shared secret', 'jetpack' ),
					'severity' => 'warning',
				);

			case 'public_key_installed':
				return array(
					'title'    => __( 'Site export key added', 'jetpack' ),
					/* translators: %s: fingerprint of the public key. */
					'content'  => sprintf( __( 'Public key %s', 'jetpack' ), isset( $context['key_id'] ) ? (string) $context['key_id'] : '' ),
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
					'content'  => __( 'Site export', 'jetpack' ),
					'severity' => 'info',
				);

			case 'credentials_discarded':
				return array(
					'title'    => __( 'Site export keys removed', 'jetpack' ),
					'content'  => __( 'Site connected, disconnected or activated', 'jetpack' ),
					'severity' => 'info',
				);
		}

		return null;
	}
}
