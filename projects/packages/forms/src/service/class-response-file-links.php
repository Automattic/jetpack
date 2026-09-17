<?php
/**
 * Permanent, login-gated links to the files attached to a form response.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Feedback;
use WP_Error;

/**
 * Builds and serves links to response files that never expire and carry no bearer secret.
 *
 * Access is decided at click time by the visitor's login and capabilities, so a link that leaks
 * from a webhook consumer grants nothing on its own. The signature only stops links being built
 * from guessed IDs, which are sequential.
 *
 * @since $$next-version$$
 */
class Response_File_Links {

	/**
	 * The admin-post.php action that serves the links.
	 *
	 * @var string
	 */
	const ACTION = 'jetpack_forms_response_file';

	/**
	 * Option holding the signing secret. Deleting it revokes every link issued so far.
	 *
	 * @var string
	 */
	const SECRET_OPTION = 'jetpack_forms_response_file_link_secret';

	/**
	 * Signature scheme version, bound into the signature.
	 *
	 * @var string
	 */
	const SIGNATURE_VERSION = 'v1';

	/**
	 * Register the request handlers.
	 */
	public static function init() {
		add_action( 'admin_post_' . self::ACTION, array( __CLASS__, 'handle_request' ) );
		add_action( 'admin_post_nopriv_' . self::ACTION, array( __CLASS__, 'handle_request' ) );
	}

	/**
	 * Get the permanent link to a file attached to a response.
	 *
	 * @param int        $response_id The feedback post ID.
	 * @param int|string $file_id     The uploaded file ID.
	 *
	 * @return string The link, or an empty string when no file download handler is available.
	 */
	public static function get_url( $response_id, $file_id ) {
		// The link ends in a redirect to the download handler, so without one it would be a dead end.
		if ( ! has_filter( 'jetpack_unauth_file_download_url' ) ) {
			return '';
		}

		$response_id = absint( $response_id );
		$file_id     = absint( $file_id );

		return add_query_arg(
			array(
				'action'   => self::ACTION,
				'response' => $response_id,
				'file'     => $file_id,
				'sig'      => self::sign( $response_id, $file_id ),
			),
			admin_url( 'admin-post.php' )
		);
	}

	/**
	 * Sign a response and file pair.
	 *
	 * @param int $response_id The feedback post ID.
	 * @param int $file_id     The uploaded file ID.
	 *
	 * @return string The hex-encoded HMAC-SHA256 signature.
	 */
	public static function sign( $response_id, $file_id ) {
		$payload = 'jetpack_forms_response_file|' . self::SIGNATURE_VERSION . '|' . absint( $response_id ) . '|' . absint( $file_id );

		return hash_hmac( 'sha256', $payload, self::get_secret() );
	}

	/**
	 * Verify a signature using a constant-time comparison.
	 *
	 * @param int    $response_id The feedback post ID.
	 * @param int    $file_id     The uploaded file ID.
	 * @param string $signature   The signature from the request.
	 *
	 * @return bool Whether the signature matches.
	 */
	public static function verify( $response_id, $file_id, $signature ) {
		if ( ! is_string( $signature ) || '' === $signature ) {
			return false;
		}

		return hash_equals( self::sign( $response_id, $file_id ), $signature );
	}

	/**
	 * Get the signing secret, creating it on first use.
	 *
	 * @return string The secret.
	 */
	private static function get_secret() {
		$secret = get_option( self::SECRET_OPTION );

		if ( is_string( $secret ) && '' !== $secret ) {
			return $secret;
		}

		// add_option() fails if a concurrent request stored one first; re-reading keeps both requests on it.
		add_option( self::SECRET_OPTION, wp_generate_password( 64, true, true ), '', false );

		return (string) get_option( self::SECRET_OPTION );
	}

	/**
	 * Whether the request's Fetch Metadata allows serving a file.
	 *
	 * Another site may only reach the link through a top-level navigation, such as a clicked link,
	 * so it cannot be loaded in an iframe, image or fetch there. Requests without Fetch Metadata
	 * (older browsers, non-browser clients) are allowed and rely on the other checks.
	 *
	 * @param array $server The request's server variables, usually `$_SERVER`.
	 *
	 * @return bool Whether the request context is allowed.
	 */
	public static function is_allowed_fetch_context( $server ) {
		$site = isset( $server['HTTP_SEC_FETCH_SITE'] ) ? (string) $server['HTTP_SEC_FETCH_SITE'] : '';

		if ( '' === $site || 'same-origin' === $site || 'none' === $site ) {
			return true;
		}

		$mode = isset( $server['HTTP_SEC_FETCH_MODE'] ) ? (string) $server['HTTP_SEC_FETCH_MODE'] : '';
		$dest = isset( $server['HTTP_SEC_FETCH_DEST'] ) ? (string) $server['HTTP_SEC_FETCH_DEST'] : '';

		return 'navigate' === $mode && 'document' === $dest;
	}

	/**
	 * Decide whether the current user may download a file through a link.
	 *
	 * @param int    $response_id The feedback post ID.
	 * @param int    $file_id     The uploaded file ID.
	 * @param string $signature   The signature from the request.
	 *
	 * @return true|WP_Error True when allowed. The error code is `not_logged_in` when a login would help.
	 */
	public static function authorize( $response_id, $file_id, $signature ) {
		$response_id = absint( $response_id );
		$file_id     = absint( $file_id );

		// Checked before the login so a malformed or forged link is refused without a login detour.
		if ( ! $response_id || ! $file_id || ! self::verify( $response_id, $file_id, $signature ) ) {
			return new WP_Error( 'invalid_link', __( 'This file link is not valid.', 'jetpack-forms' ), array( 'status' => 403 ) );
		}

		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'not_logged_in', __( 'Log in to download this file.', 'jetpack-forms' ), array( 'status' => 401 ) );
		}

		// Matches the permission check of the responses REST API.
		if ( ! current_user_can( 'edit_pages' ) || ! is_user_member_of_blog( get_current_user_id(), get_current_blog_id() ) ) {
			return new WP_Error( 'forbidden', __( 'Sorry, you are not allowed to download this file.', 'jetpack-forms' ), array( 'status' => 403 ) );
		}

		$feedback = Feedback::get( $response_id );

		if ( ! $feedback || ! self::response_has_file( $feedback, $file_id ) ) {
			return new WP_Error( 'not_found', __( 'This file is no longer available.', 'jetpack-forms' ), array( 'status' => 404 ) );
		}

		return true;
	}

	/**
	 * Whether a file is attached to a response.
	 *
	 * @param Feedback $feedback The response.
	 * @param int      $file_id  The uploaded file ID.
	 *
	 * @return bool
	 */
	private static function response_has_file( Feedback $feedback, $file_id ) {
		foreach ( $feedback->get_files() as $file ) {
			if ( absint( $file['file_id'] ) === $file_id ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Serve a link: authorize it, then redirect to a freshly signed download.
	 *
	 * @return never
	 */
	public static function handle_request() {
		nocache_headers();
		header( 'Referrer-Policy: no-referrer' );

		if ( ! self::is_allowed_fetch_context( $_SERVER ) ) {
			wp_die( esc_html__( 'This file can only be opened directly.', 'jetpack-forms' ), '', array( 'response' => 403 ) );
		}

		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Authorized by the signature and the user's capabilities in authorize().
		$response_id = isset( $_GET['response'] ) ? absint( wp_unslash( $_GET['response'] ) ) : 0;
		$file_id     = isset( $_GET['file'] ) ? absint( wp_unslash( $_GET['file'] ) ) : 0;
		$signature   = isset( $_GET['sig'] ) ? sanitize_text_field( wp_unslash( $_GET['sig'] ) ) : '';
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$authorized = self::authorize( $response_id, $file_id, $signature );

		if ( is_wp_error( $authorized ) && 'not_logged_in' === $authorized->get_error_code() ) {
			auth_redirect();
			exit( 0 );
		}

		if ( is_wp_error( $authorized ) ) {
			wp_die( esc_html( $authorized->get_error_message() ), '', array( 'response' => (int) $authorized->get_error_data()['status'] ) );
		}

		$download_url = (string) apply_filters( 'jetpack_unauth_file_download_url', '', $file_id );

		if ( '' === $download_url ) {
			wp_die( esc_html__( 'This file cannot be downloaded right now.', 'jetpack-forms' ), '', array( 'response' => 503 ) );
		}

		wp_safe_redirect( $download_url );
		exit( 0 );
	}

	/**
	 * Get the files of each file field in a response, with a permanent link to each.
	 *
	 * @param int      $response_id The feedback post ID.
	 * @param Feedback $feedback    The response.
	 *
	 * @return array Lists of files keyed by form field ID. Fields without files are left out.
	 */
	public static function get_files_by_field( $response_id, Feedback $feedback ) {
		$files_by_field = array();

		foreach ( $feedback->get_fields() as $field ) {
			$field_id = (string) $field->get_form_field_id();

			if ( '' === $field_id || ! $field->is_of_type( 'file' ) || ! $field->has_file() ) {
				continue;
			}

			$files = array();
			foreach ( $field->get_value()['files'] as $file ) {
				if ( ! is_array( $file ) || empty( $file['file_id'] ) ) {
					continue;
				}

				$files[] = array(
					'name' => isset( $file['name'] ) ? (string) $file['name'] : '',
					'size' => isset( $file['size'] ) ? absint( $file['size'] ) : 0,
					'type' => isset( $file['type'] ) ? (string) $file['type'] : '',
					'url'  => self::get_url( $response_id, $file['file_id'] ),
				);
			}

			if ( $files ) {
				$files_by_field[ $field_id ] = $files;
			}
		}

		return $files_by_field;
	}
}
