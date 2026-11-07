<?php
/**
 * REST routes for the Send dashboard.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * `jetpack-send/v1` routes; all require `manage_options`.
 */
class REST_Controller {

	const API_NAMESPACE = 'jetpack-send/v1';
	const STATUS_PATH   = '/jetpack-send/v1/status';

	/**
	 * Register the routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		$routes = array(
			'/status'          => array( WP_REST_Server::READABLE, 'get_status', array() ),
			'/setup'           => array(
				WP_REST_Server::CREATABLE,
				'setup',
				array(
					'domain' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			),
			'/check-dns'       => array( WP_REST_Server::CREATABLE, 'check_dns', array() ),
			'/settings'        => array(
				WP_REST_Server::CREATABLE,
				'update_settings',
				array(
					'enabled'         => array( 'type' => 'boolean' ),
					'fallback'        => array( 'type' => 'boolean' ),
					'from_name'       => array( 'type' => 'string' ),
					'from_local_part' => array( 'type' => 'string' ),
				),
			),
			'/test'            => array(
				WP_REST_Server::CREATABLE,
				'send_test',
				array(
					'to' => array(
						'type'     => 'string',
						'format'   => 'email',
						'required' => true,
					),
				),
			),
			'/usage'           => array( WP_REST_Server::READABLE, 'get_usage', array() ),
			'/log'             => array(
				WP_REST_Server::READABLE,
				'get_log',
				array(
					'page'     => array(
						'type'    => 'integer',
						'minimum' => 1,
						'default' => 1,
					),
					'per_page' => array(
						'type'    => 'integer',
						'minimum' => 1,
						'maximum' => 100,
						'default' => 20,
					),
					'status'   => array(
						'type'    => 'string',
						'enum'    => array( '', Email_Log::STATUS_SENT, Email_Log::STATUS_FALLBACK, Email_Log::STATUS_FAILED ),
						'default' => '',
					),
				),
			),
			'/log/(?P<id>\d+)' => array(
				WP_REST_Server::READABLE,
				'get_log_entry',
				array(
					'id' => array(
						'type'    => 'integer',
						'minimum' => 1,
					),
				),
			),
			'/reset'           => array( WP_REST_Server::CREATABLE, 'reset', array() ),
		);

		foreach ( $routes as $route => $definition ) {
			list( $methods, $callback, $args ) = $definition;
			register_rest_route(
				self::API_NAMESPACE,
				$route,
				array(
					'methods'             => $methods,
					'callback'            => array( __CLASS__, $callback ),
					'permission_callback' => array( __CLASS__, 'can_manage' ),
					'args'                => $args,
				)
			);
		}
	}

	/**
	 * Permission check.
	 *
	 * @return bool
	 */
	public static function can_manage() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * GET /status.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_status() {
		return rest_ensure_response( self::status_data() );
	}

	/**
	 * The dashboard's status payload.
	 *
	 * @return array
	 */
	public static function status_data() {
		$provisioner = Provisioner_Factory::get();
		$account     = Account::get();
		$blockers    = self::enable_blockers( $account );

		return array(
			'provisioner'      => $provisioner ? $provisioner->get_type() : null,
			'account'          => Account::to_public( $account ),
			'settings'         => Settings::get(),
			'can_enable'       => array() === $blockers,
			'enable_blockers'  => $blockers,
			'suggested_domain' => preg_replace( '/^www\./', '', strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) ) ),
			'site_title'       => wp_specialchars_decode( (string) get_bloginfo( 'name' ), ENT_QUOTES ),
			'admin_email'      => (string) get_option( 'admin_email' ),
			'connect_url'      => class_exists( '\Automattic\Jetpack\My_Jetpack\Initializer' ) ? admin_url( 'admin.php?page=my-jetpack#/connection' ) : '',
			'spf_suggestion'   => $account ? Dns_Check::spf_suggestion( self::known_spf( $account ) ) : null,
		);
	}

	/**
	 * The domain's SPF record as last seen: by the latest DNS check, else at setup.
	 *
	 * @param array $account Stored account.
	 * @return string
	 */
	private static function known_spf( array $account ) {
		$check = $account['dns_check'] ?? null;
		if ( is_array( $check ) && isset( $check['existing_spf'] ) ) {
			return (string) $check['existing_spf'];
		}
		return (string) ( $account['existing_spf'] ?? '' );
	}

	/**
	 * Why sending can't be turned on yet; empty when it can.
	 *
	 * @param array|null $account Stored account.
	 * @return string[]
	 */
	public static function enable_blockers( $account ) {
		if ( ! $account ) {
			return array( 'not_set_up' );
		}
		$check = $account['dns_check'] ?? null;
		if ( ! is_array( $check ) ) {
			return array( 'dns_not_checked' );
		}

		// DMARC needs one aligned record: DKIM when the domain has a key, otherwise SPF, which is optional only then.
		$has_dkim = in_array( 'dkim', array_column( (array) ( $account['dns_records'] ?? array() ), 'purpose' ), true );
		$required = array( 'domain_lockdown', 'sender_domain', $has_dkim ? 'dkim' : 'spf' );

		$blockers = array();
		foreach ( $required as $key ) {
			if ( 'passed' !== ( $check[ $key ] ?? '' ) ) {
				$blockers[] = $key;
			}
		}
		return $blockers;
	}

	/**
	 * POST /setup.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function setup( WP_REST_Request $request ) {
		$provisioner = Provisioner_Factory::get();
		if ( ! $provisioner ) {
			return new WP_Error( 'jetpack_send_no_provisioner', __( 'Connect Jetpack before setting up Send.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		$domain = self::sanitize_domain( (string) $request->get_param( 'domain' ) );
		if ( '' === $domain ) {
			return new WP_Error( 'jetpack_send_invalid_domain', __( 'Enter a domain you own, like example.com.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		$result  = $provisioner->provision( $domain );
		$account = is_wp_error( $result ) ? $result : Account::from_provision( $result, $domain, $provisioner->get_type() );
		if ( is_wp_error( $account ) ) {
			return self::error_response( $account );
		}

		$account['existing_spf'] = Dns_Check::existing_spf( $domain );
		Account::save( $account );
		Settings::update( array( 'enabled' => false ) );
		return rest_ensure_response( self::status_data() );
	}

	/**
	 * POST /check-dns.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function check_dns() {
		$account = Account::get();
		if ( ! $account ) {
			return self::not_set_up();
		}

		$response = ( new MailChannels_Client( $account['api_key'] ) )->check_domain( $account['domain'], (string) $account['dkim_selector'] );
		if ( is_wp_error( $response ) ) {
			return self::error_response( $response );
		}

		Account::update( array( 'dns_check' => Dns_Check::normalize( $response, Dns_Check::existing_spf( $account['domain'] ) ) ) );
		return rest_ensure_response( self::status_data() );
	}

	/**
	 * POST /settings.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function update_settings( WP_REST_Request $request ) {
		$changes = array();
		foreach ( array( 'enabled', 'fallback', 'from_name', 'from_local_part' ) as $key ) {
			if ( $request->has_param( $key ) ) {
				$changes[ $key ] = $request->get_param( $key );
			}
		}

		if ( ! empty( $changes['enabled'] ) ) {
			$blockers = self::enable_blockers( Account::get() );
			if ( $blockers ) {
				return new WP_Error(
					'jetpack_send_cannot_enable',
					__( 'Finish setting up your domain before turning on sending.', 'jetpack-send-pkg' ),
					array(
						'status'   => 400,
						'blockers' => $blockers,
					)
				);
			}
		}
		if ( isset( $changes['from_local_part'] ) && ! is_email( $changes['from_local_part'] . '@example.com' ) ) {
			return new WP_Error( 'jetpack_send_invalid_from', __( 'Enter a valid name for the From address, like hello.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		Settings::update( $changes );
		return rest_ensure_response( self::status_data() );
	}

	/**
	 * POST /test.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function send_test( WP_REST_Request $request ) {
		$result = Mailer::send_test( (string) $request->get_param( 'to' ) );
		if ( is_wp_error( $result ) ) {
			return rest_ensure_response(
				array(
					'success' => false,
					'error'   => $result->get_error_message(),
				)
			);
		}

		return rest_ensure_response(
			array(
				'success'    => true,
				'request_id' => $result['request_id'],
			)
		);
	}

	/**
	 * GET /usage.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_usage() {
		$account = Account::get();
		if ( ! $account ) {
			return self::not_set_up();
		}

		$provisioner = Provisioner_Factory::get();
		if ( ! $provisioner || $provisioner->get_type() !== $account['provider'] ) {
			return new WP_Error( 'jetpack_send_provider_unavailable', __( 'Usage is unavailable because the service that set up Send can no longer be reached.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		$usage = $provisioner->get_usage( $account );
		return is_wp_error( $usage ) ? self::error_response( $usage ) : rest_ensure_response( $usage );
	}

	/**
	 * GET /log.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function get_log( WP_REST_Request $request ) {
		return rest_ensure_response(
			Email_Log::query( (int) $request->get_param( 'page' ), (int) $request->get_param( 'per_page' ), (string) $request->get_param( 'status' ) )
		);
	}

	/**
	 * GET /log/{id}: one row with the content kept for previewing.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_log_entry( WP_REST_Request $request ) {
		$entry = Email_Log::get( (int) $request->get_param( 'id' ) );
		if ( ! $entry ) {
			return new WP_Error( 'jetpack_send_log_entry_not_found', __( 'This email is no longer in the log.', 'jetpack-send-pkg' ), array( 'status' => 404 ) );
		}
		return rest_ensure_response( $entry );
	}

	/**
	 * POST /reset: clears local state even if deprovisioning fails, so the site is never stuck.
	 *
	 * @return \WP_REST_Response
	 */
	public static function reset() {
		$account     = Account::get();
		$provisioner = Provisioner_Factory::get();
		$warning     = '';
		if ( $account && $provisioner && $provisioner->get_type() === $account['provider'] ) {
			$result = $provisioner->deprovision( $account );
			if ( is_wp_error( $result ) ) {
				$warning = $result->get_error_message();
			}
		}

		Account::delete();
		Settings::update( array( 'enabled' => false ) );

		$data                  = self::status_data();
		$data['reset_warning'] = $warning;
		return rest_ensure_response( $data );
	}

	/**
	 * Normalize user input to a bare lowercase domain, or '' when invalid.
	 *
	 * @param string $domain Input.
	 * @return string
	 */
	public static function sanitize_domain( $domain ) {
		$domain = strtolower( trim( $domain ) );
		$domain = (string) preg_replace( '#^[a-z]+://#', '', $domain );
		$domain = rtrim( explode( '/', $domain )[0], '.' );
		return preg_match( '/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/', $domain ) ? $domain : '';
	}

	/**
	 * The "not set up" error.
	 *
	 * @return WP_Error
	 */
	private static function not_set_up() {
		return new WP_Error( 'jetpack_send_not_set_up', __( 'Set up Send first.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
	}

	/**
	 * Give an upstream error a valid REST status.
	 *
	 * @param WP_Error $error Error.
	 * @return WP_Error
	 */
	private static function error_response( WP_Error $error ) {
		$data   = $error->get_error_data();
		$status = is_array( $data ) && isset( $data['status'] ) ? (int) $data['status'] : 0;
		return new WP_Error( $error->get_error_code(), $error->get_error_message(), array( 'status' => $status >= 400 ? $status : 502 ) );
	}
}
