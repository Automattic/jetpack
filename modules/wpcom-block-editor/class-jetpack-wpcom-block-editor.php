<?php
/**
 * WordPress.com Block Editor
 * Allow new block editor posts to be composed on WordPress.com.
 * This is auto-loaded as of Jetpack v7.4 for sites connected to WordPress.com only.
 *
 * @package Jetpack
 */

/**
 * WordPress.com Block editor for Jetpack
 */
class Jetpack_WPCOM_Block_Editor {
	/**
	 * ID of the user who signed the nonce.
	 *
	 * @var int
	 */
	private $nonce_user_id;

	/**
	 * Singleton
	 */
	public static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new Jetpack_WPCOM_Block_Editor();
		}

		return $instance;
	}

	/**
	 * Jetpack_WPCOM_Block_Editor constructor.
	 */
	private function __construct() {
		add_action( 'admin_init', array( $this, 'disable_send_frame_options_header' ), 9 );
		add_filter( 'admin_body_class', array( $this, 'add_iframed_body_class' ) );
	}

	/**
	 * Prevents frame options header from firing if this is a whitelisted iframe request.
	 */
	public function disable_send_frame_options_header() {
		if ( $this->framing_allowed() ) {
			remove_action( 'admin_init', 'send_frame_options_header' );
		}
	}

	/**
	 * Adds custom admin body class if this is a whitelisted iframe request.
	 *
	 * @param string $classes Admin body classes.
	 * @return string
	 */
	public function add_iframed_body_class( $classes ) {
		if ( $this->framing_allowed() ) {
			$classes .= ' is-iframed ';
		}

		return $classes;
	}

	/**
	 * Checks whether this is a whitelisted iframe request.
	 *
	 * @return bool
	 */
	public function framing_allowed() {
		if ( empty( $_GET['frame-nonce'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return false;
		}

		$verified = $this->verify_frame_nonce(
			$_GET['frame-nonce'],  // phpcs:ignore WordPress.Security.NonceVerification
			'frame-' . Jetpack_Options::get_option( 'id' )
		);

		if ( is_wp_error( $verified ) ) {
			wp_die( esc_html( $verified ) );
		}

		if ( $verified && ! defined( 'IFRAME_REQUEST' ) ) {
			define( 'IFRAME_REQUEST', true );
		}

		return (bool) $verified;
	}

	/**
	 * Verify that correct nonce was used with time limit.
	 *
	 * The user is given an amount of time to use the token, so therefore, since the
	 * UID and $action remain the same, the independent variable is the time.
	 *
	 * @param string $nonce  Nonce that was used in the form to verify.
	 * @param string $action Should give context to what is taking place and be the same when nonce was created.
	 * @return boolean|WP_Error Whether the nonce is valid.
	 */
	public function verify_frame_nonce( $nonce, $action ) {
		if ( empty( $nonce ) ) {
			return false;
		}

		list( $expiration, $user_id, $hash ) = explode( ':', $nonce, 3 );

		$this->nonce_user_id = (int) $user_id;
		if ( ! $this->nonce_user_id ) {
			return false;
		}

		$token = Jetpack_Data::get_access_token( $this->nonce_user_id );
		if ( ! $token ) {
			return false;
		}

		add_filter( 'salt', array( $this, 'filter_salt' ), 10, 2 );
		$expected_hash = wp_hash( "$expiration|$action|{$this->nonce_user_id}", 'jetpack_frame_nonce' );
		remove_filter( 'salt', array( $this, 'filter_salt' ) );

		if ( ! hash_equals( $hash, $expected_hash ) ) {
			return false;
		}

		if ( time() > $expiration ) {
			return new WP_Error( 'nonce_invalid_expired', 'Expired nonce.' );
		}

		if ( get_current_user_id() !== $this->nonce_user_id ) {
			return new WP_Error( 'nonce_invalid_user_mismatch', 'User ID mismatch.' );
		}

		return true;
	}

	/**
	 * Filters the WordPress salt.
	 *
	 * @param string $salt   Salt for the given scheme.
	 * @param string $scheme Authentication scheme.
	 * @return string
	 */
	public function filter_salt( $salt, $scheme ) {
		if ( 'jetpack_frame_nonce' === $scheme ) {
			$token = Jetpack_Data::get_access_token( $this->nonce_user_id );

			if ( $token ) {
				$salt = $token->secret;
			}
		}

		return $salt;
	}
}

Jetpack_WPCOM_Block_Editor::init();
