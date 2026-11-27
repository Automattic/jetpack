<?php
/**
 * Short-lived links that download a form response export.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Creates and serves links that download responses as CSV.
 *
 * A link stores the export's filters, not its data, so the file reflects the
 * responses as they are when the link is opened. It lasts 15 minutes and
 * works only for the signed-in user who created it, while they can export.
 *
 * @since $$next-version$$
 */
class Response_Export_Link {

	/**
	 * The admin-post.php action that serves the download.
	 */
	const ACTION = 'jetpack_forms_export_responses';

	/**
	 * How long a link works, in seconds.
	 */
	const LIFETIME = 15 * MINUTE_IN_SECONDS;

	/**
	 * How long a link's record is kept, in seconds, so an expired link can say it expired.
	 */
	const RECORD_LIFETIME = DAY_IN_SECONDS;

	/**
	 * Transient key prefix. The token's hash completes the key, so stored keys cannot rebuild a link.
	 */
	const TRANSIENT_PREFIX = 'jetpack_forms_export_';

	/**
	 * Hooks the download handlers.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_post_' . self::ACTION, array( __CLASS__, 'handle_download' ) );
		add_action( 'admin_post_nopriv_' . self::ACTION, array( __CLASS__, 'redirect_to_login' ) );
	}

	/**
	 * Creates a link that downloads the export described by the filters.
	 *
	 * @param array $filters                Filters for Contact_Form_Plugin::get_export_feedback_ids().
	 * @param bool  $include_test_responses Whether to include responses submitted from form preview.
	 * @param int   $user_id                The only user the link works for.
	 *
	 * @return array{url: string, expires_at: int} Expiry as a Unix timestamp.
	 */
	public static function create( array $filters, $include_test_responses, $user_id ) {
		$token      = wp_generate_password( 32, false, false );
		$expires_at = time() + self::LIFETIME;

		set_transient(
			self::get_transient_key( $token ),
			array(
				'user_id'                => (int) $user_id,
				'filters'                => $filters,
				'include_test_responses' => (bool) $include_test_responses,
				'expires_at'             => $expires_at,
			),
			self::RECORD_LIFETIME
		);

		return array(
			'url'        => self::get_url( $token ),
			'expires_at' => $expires_at,
		);
	}

	/**
	 * Returns the export a link describes, when the user may download it.
	 *
	 * @param string $token   Token from the link.
	 * @param int    $user_id The user opening the link.
	 *
	 * @return array{filters: array, include_test_responses: bool}|WP_Error
	 */
	public static function resolve( $token, $user_id ) {
		$token  = is_string( $token ) ? $token : '';
		$record = 1 === preg_match( '/^[A-Za-z0-9]{32}$/', $token ) ? get_transient( self::get_transient_key( $token ) ) : false;

		// One error for every refusal, so a link reveals nothing about who made it.
		if (
			! is_array( $record )
			|| ! $user_id
			|| (int) $record['user_id'] !== (int) $user_id
			|| ! user_can( (int) $user_id, 'export' )
		) {
			return new WP_Error(
				'jetpack_forms_export_link_invalid',
				__( 'This export link does not work for your account. Ask for a new export.', 'jetpack-forms' ),
				array( 'status' => 403 )
			);
		}

		if ( time() > (int) $record['expires_at'] ) {
			return new WP_Error(
				'jetpack_forms_export_link_expired',
				__( 'This export link has expired. Ask for a new export.', 'jetpack-forms' ),
				array( 'status' => 410 )
			);
		}

		return array(
			'filters'                => (array) $record['filters'],
			'include_test_responses' => (bool) $record['include_test_responses'],
		);
	}

	/**
	 * Sends the CSV file for the link in the request.
	 *
	 * @return never
	 */
	public static function handle_download() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- The token is the secret and is bound to the user.
		$token  = isset( $_GET['token'] ) ? sanitize_text_field( wp_unslash( $_GET['token'] ) ) : '';
		$export = self::resolve( $token, get_current_user_id() );
		if ( is_wp_error( $export ) ) {
			wp_die( esc_html( $export->get_error_message() ), '', array( 'response' => (int) $export->get_error_data()['status'] ) );
		}

		nocache_headers();
		header( 'Referrer-Policy: no-referrer' );

		$plugin  = Contact_Form_Plugin::init();
		$form_id = (int) ( $export['filters']['form'] ?? 0 );
		$ids     = $plugin->get_export_feedback_ids( $export['filters'] );
		if ( ! $plugin->stream_export_csv( $ids, $export['include_test_responses'], $form_id ) ) {
			wp_die( esc_html__( 'No responses match this export any more.', 'jetpack-forms' ), '', array( 'response' => 404 ) );
		}
		exit( 0 );
	}

	/**
	 * Sends a signed-out visitor to log in, then back to the link.
	 *
	 * @return never
	 */
	public static function redirect_to_login() {
		auth_redirect();
		exit( 0 );
	}

	/**
	 * Returns the download URL for a token.
	 *
	 * @param string $token Link token.
	 * @return string
	 */
	private static function get_url( $token ) {
		return add_query_arg(
			array(
				'action' => self::ACTION,
				'token'  => rawurlencode( $token ),
			),
			admin_url( 'admin-post.php' )
		);
	}

	/**
	 * Returns the transient key for a token.
	 *
	 * @param string $token Link token.
	 * @return string
	 */
	private static function get_transient_key( $token ) {
		return self::TRANSIENT_PREFIX . hash( 'sha256', $token );
	}
}
