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
	 * Activity Log source identifier.
	 *
	 * @var string
	 */
	const SOURCE = 'reprint-export';

	/**
	 * Events logged at most once per THROTTLE_SECONDS: an export is thousands of requests,
	 * and every entry is a post insert plus a Sync queue item.
	 *
	 * @var string[]
	 */
	const THROTTLED_EVENTS = array( 'export_served', 'export_refused' );

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

		$entry['source'] = self::SOURCE;

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
	 * @param string $event   Event name.
	 * @param array  $context Details of the event.
	 * @return array|null Title, content and severity, or null for an event that is not logged.
	 */
	public static function describe( $event, array $context ) {
		$actor = self::actor( $context );

		switch ( $event ) {
			case 'secret_rotated':
				return array(
					'title'    => __( 'Site export credential created', 'jetpack' ),
					/* translators: %s: user login of the administrator. */
					'content'  => sprintf( __( '%s created a shared secret that allows this site to be exported. Any earlier credential no longer works.', 'jetpack' ), $actor ),
					'severity' => 'warning',
				);

			case 'public_key_installed':
				return array(
					'title'    => __( 'Site export credential created', 'jetpack' ),
					'content'  => sprintf(
						/* translators: 1: user login of the administrator, 2: fingerprint of the public key. */
						__( '%1$s installed a public key (%2$s) that allows this site to be exported. Any earlier credential no longer works.', 'jetpack' ),
						$actor,
						isset( $context['key_id'] ) ? (string) $context['key_id'] : __( 'unknown', 'jetpack' )
					),
					'severity' => 'warning',
				);

			case 'window_opened':
				return array(
					'title'    => __( 'Site export enabled', 'jetpack' ),
					/* translators: %s: user login of the administrator. */
					'content'  => sprintf( __( '%s allowed this site to be exported for the next hour. Export activity keeps it allowed.', 'jetpack' ), $actor ),
					'severity' => 'warning',
				);

			case 'export_served':
				return array(
					'title'    => __( 'Site export in progress', 'jetpack' ),
					'content'  => __( 'Jetpack is serving an export of this site. Further export requests in the next hour are not logged individually.', 'jetpack' ),
					'severity' => 'info',
				);

			case 'export_refused':
				$status = isset( $context['code'] ) ? (int) $context['code'] : 0;
				$reason = isset( $context['reason_code'] ) ? sprintf( '%d: %s', $status, $context['reason_code'] ) : (string) $status;
				return array(
					'title'    => __( 'Site export request refused', 'jetpack' ),
					'content'  => sprintf(
						/* translators: %s: HTTP status code, optionally followed by a machine-readable reason. */
						__( 'Jetpack refused a request to export this site (HTTP %s). Further refusals in the next hour are not logged individually.', 'jetpack' ),
						$reason
					),
					'severity' => 'warning',
				);

			case 'credentials_discarded':
				return array(
					'title'    => __( 'Site export credentials removed', 'jetpack' ),
					'content'  => __( 'Jetpack removed the stored site export credentials because the site was activated, connected or disconnected. A new credential is needed before the site can be exported again.', 'jetpack' ),
					'severity' => 'info',
				);
		}

		return null;
	}

	/**
	 * The login of the user an event names, for the log entry.
	 *
	 * @param array $context Details of the event.
	 * @return string
	 */
	private static function actor( array $context ) {
		$user = isset( $context['user_id'] ) ? get_userdata( (int) $context['user_id'] ) : false;

		return $user ? $user->user_login : __( 'An administrator', 'jetpack' );
	}
}
