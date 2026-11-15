<?php
/**
 * Opt-in, basic status and recovery for IndexNow notifications.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;
use WP_Error;

/**
 * Keeps service state independent of the settings page lifecycle.
 */
class Indexnow {
	/** Register the owner-controlled settings endpoint. */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/** Register the owner-only opt-in and status endpoint. */
	public static function register_routes() {
		if ( ( new Host() )->is_vip_site() ) {
			return;
		}
		register_rest_route(
			'jetpack/v4',
			'/seo/indexnow',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( __CLASS__, 'status' ),
					'permission_callback' => array( Dashboard_Data::class, 'permission_check' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( __CLASS__, 'save' ),
					'permission_callback' => array( Dashboard_Data::class, 'permission_check' ),
					'args'                => array(
						'enabled' => array(
							'required' => true,
							'type'     => 'boolean',
						),
					),
				),
			)
		);
	}

	/**
	 * Factual delivery state without pending URLs.
	 *
	 * @return array
	 */
	public static function status() {
		$latest   = get_option( Indexnow_Queue::STATUS_OPTION, array( 'state' => 'idle' ) );
		$accepted = get_option( Indexnow_Queue::ACCEPTED_OPTION, null );
		if ( is_array( $accepted ) ) {
			$latest['accepted'] = $accepted;
		}
		return array(
			'enabled'        => (bool) get_option( Indexnow_Client::ENABLED_OPTION, false ),
			'operational'    => Indexnow_Client::enabled(),
			'site_public'    => Indexnow_Client::site_is_public(),
			'pending'        => Indexnow_Queue::size(),
			'latest'         => $latest,
			'enqueue_error'  => get_option( 'jetpack_seo_indexnow_enqueue_error', null ),
			'key_location'   => Indexnow_Client::enabled() ? Indexnow_Client::key_location() : '',
			'next_worker'    => wp_next_scheduled( Indexnow_Queue::HOOK ),
			'next_recovery'  => wp_next_scheduled( Indexnow_Queue::RECOVERY_HOOK ),
			'cooldown_until' => (int) get_option( Indexnow_Queue::COOLDOWN_OPTION, 0 ),
			'pause_reason'   => self::pause_reason(),
		);
	}

	/**
	 * Identify the condition that prevents the saved preference from operating.
	 *
	 * @return string
	 */
	private static function pause_reason() {
		if ( ! Indexnow_Client::site_is_public() ) {
			return 'not_public';
		}
		if ( ! ( new Modules() )->is_active( 'seo-tools' ) ) {
			return 'module_inactive';
		}
		if ( ! apply_filters( 'jetpack_seo_indexnow_can_notify', true ) || Seo_Tools::is_disabled() ) {
			return 'provider';
		}
		if ( get_option( Indexnow_Client::ENABLED_OPTION, false ) && get_option( Indexnow_Client::SCOPE_OPTION, '' ) !== home_url( '/' ) ) {
			return 'address_changed';
		}
		return '';
	}

	/**
	 * Save explicit consent without enqueueing historical content.
	 *
	 * @param \WP_REST_Request $request Current owner request.
	 * @return array|WP_Error
	 */
	public static function save( $request ) {
		$enabled = (bool) $request->get_param( 'enabled' );
		if ( ! $enabled ) {
			update_option( Indexnow_Client::ENABLED_OPTION, false, false );
			if ( get_option( Indexnow_Client::ENABLED_OPTION, false ) ) {
				return new WP_Error( 'jetpack_seo_indexnow_save_failed', __( 'The IndexNow setting could not be saved. Please try again.', 'jetpack-seo' ), array( 'status' => 500 ) );
			}
			Indexnow_Queue::clear();
			delete_option( Indexnow_Queue::STATUS_OPTION );
			$accepted = get_option( Indexnow_Queue::ACCEPTED_OPTION, null );
			if ( ! is_array( $accepted ) || 'accepted' !== ( $accepted['state'] ?? '' ) || get_option( Indexnow_Client::SCOPE_OPTION, '' ) !== home_url( '/' ) ) {
				delete_option( Indexnow_Queue::ACCEPTED_OPTION );
			}
			delete_option( 'jetpack_seo_indexnow_enqueue_error' );
			wp_clear_scheduled_hook( Indexnow_Queue::RECOVERY_HOOK );
		} else {
			$key = Indexnow_Client::key();
			if ( get_option( Indexnow_Client::SCOPE_OPTION, '' ) !== home_url( '/' ) ) {
				delete_option( Indexnow_Queue::STATUS_OPTION );
				delete_option( Indexnow_Queue::ACCEPTED_OPTION );
			}
			update_option( Indexnow_Client::SCOPE_OPTION, home_url( '/' ), false );
			if ( get_option( Indexnow_Client::KEY_OPTION, '' ) !== $key || get_option( Indexnow_Client::SCOPE_OPTION, '' ) !== home_url( '/' ) ) {
				return new WP_Error( 'jetpack_seo_indexnow_save_failed', __( 'The IndexNow setting could not be saved. Please try again.', 'jetpack-seo' ), array( 'status' => 500 ) );
			}
			update_option( Indexnow_Client::ENABLED_OPTION, true, false );
			if ( ! get_option( Indexnow_Client::ENABLED_OPTION, false ) ) {
				return new WP_Error( 'jetpack_seo_indexnow_save_failed', __( 'The IndexNow setting could not be saved. Please try again.', 'jetpack-seo' ), array( 'status' => 500 ) );
			}
			Indexnow_Queue::ensure_recovery();
		}
		return self::status();
	}
}
