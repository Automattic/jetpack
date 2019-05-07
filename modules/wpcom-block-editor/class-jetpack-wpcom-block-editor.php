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
		if ( $this->is_iframed_block_editor() ) {
			add_action( 'init', array( $this, 'show_error_if_logged_out' ) );
			add_action( 'admin_init', array( $this, 'disable_send_frame_options_header' ), 9 );
			add_filter( 'admin_body_class', array( $this, 'add_iframed_body_class' ) );
		}

		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_scripts' ) );
		add_filter( 'mce_external_plugins', array( $this, 'add_tinymce_plugins' ) );
	}

	/**
	 * Checks if we are embedding the block editor in an iframe in WordPress.com.
	 *
	 * @return bool Whether the current request is from the iframed block editor.
	 */
	public function is_iframed_block_editor() {
		global $pagenow;

		// phpcs:ignore WordPress.Security.NonceVerification
		return ( 'post.php' === $pagenow || 'post-new.php' === $pagenow ) && ! empty( $_GET['frame-nonce'] );
	}

	/**
	 * Shows a custom message if the user is logged out.
	 *
	 * The iframed block editor can be only embedded in WordPress.com if the user is logged
	 * into the Jetpack site. So we abort the default redirection to the login page (which
	 * cannot be embedded in a iframe) and instead we explain that we need the user to log
	 * into Jetpack.
	 */
	public function show_error_if_logged_out() {
		if ( ! get_current_user_id() ) {
			/* translators: %s: Login URL */
			$message = __( 'Please <a href="%s" target="_blank" rel="noopener noreferrer">log into</a> your Jetpack-connected site to use the block editor on WordPress.com.', 'jetpack' );

			wp_die(
				sprintf( wp_kses_post( $message ), esc_url( wp_login_url() ) ),
				'',
				array( 'response' => 401 )
			);
		}
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
		$verified = $this->verify_frame_nonce(
			$_GET['frame-nonce'], // phpcs:ignore WordPress.Security.NonceVerification
			'frame-' . Jetpack_Options::get_option( 'id' )
		);

		if ( is_wp_error( $verified ) ) {
			wp_die( $verified ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
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
	 * @param string $nonce Nonce that was used in the form to verify.
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

		/*
		 * Failures must return `false` (blocking the iframe) prior to the
		 * signature verification.
		 */

		add_filter( 'salt', array( $this, 'filter_salt' ), 10, 2 );
		$expected_hash = wp_hash( "$expiration|$action|{$this->nonce_user_id}", 'jetpack_frame_nonce' );
		remove_filter( 'salt', array( $this, 'filter_salt' ) );

		if ( ! hash_equals( $hash, $expected_hash ) ) {
			return false;
		}

		/*
		 * Failures may return `WP_Error` (showing an error in the iframe) after the
		 * signature verification passes.
		 */

		if ( time() > $expiration ) {
			return new WP_Error( 'nonce_invalid_expired', 'Expired nonce.', array( 'status' => 401 ) );
		}

		if ( get_current_user_id() !== $this->nonce_user_id ) {
			return new WP_Error( 'nonce_invalid_user_mismatch', 'User ID mismatch.', array( 'status' => 401 ) );
		}

		return true;
	}

	/**
	 * Filters the WordPress salt.
	 *
	 * @param string $salt Salt for the given scheme.
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

	/**
	 * Enqueue the scripts for the WordPress.com block editor integration.
	 */
	public function enqueue_scripts() {
		$debug   = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;
		$version = gmdate( 'Ymd' );

		$src_common = $debug
			? '//widgets.wp.com/wpcom-block-editor/common.js?minify=false'
			: '//widgets.wp.com/wpcom-block-editor/common.min.js';

		wp_enqueue_script(
			'wpcom-block-editor-common',
			$src_common,
			array( 'lodash', 'wp-compose', 'wp-data', 'wp-editor', 'wp-rich-text' ),
			$version,
			true
		);
		wp_localize_script(
			'wpcom-block-editor-common',
			'wpcomGutenberg',
			array(
				'switchToClassic' => array(
					'isVisible' => $this->is_iframed_block_editor(),
					'label'     => __( 'Switch to Classic Editor', 'jetpack' ),
					'url'       => Jetpack_Calypsoify::getInstance()->get_switch_to_classic_editor_url(),
				),
				'richTextToolbar' => array(
					'justify'   => __( 'Justify', 'jetpack' ),
					'underline' => __( 'Underline', 'jetpack' ),
				),
			)
		);

		$src_styles = $debug
			? '//widgets.wp.com/wpcom-block-editor/common.css?minify=false'
			: '//widgets.wp.com/wpcom-block-editor/common.min.css';
		wp_enqueue_style(
			'wpcom-block-editor-styles',
			$src_styles,
			array(),
			$version
		);

		if ( $this->is_iframed_block_editor() ) {
			$src_calypso_iframe_bridge = $debug
				? '//widgets.wp.com/wpcom-block-editor/calypso-iframe-bridge-server.js?minify=false'
				: '//widgets.wp.com/wpcom-block-editor/calypso-iframe-bridge-server.min.js';

			wp_enqueue_script(
				'wpcom-block-editor-calypso-iframe-bridge',
				$src_calypso_iframe_bridge,
				array( 'calypsoify_wpadminmods_js', 'jquery', 'lodash', 'react', 'wp-blocks', 'wp-data', 'wp-hooks', 'wp-tinymce', 'wp-url' ),
				$version,
				true
			);
		}
	}

	/**
	 * Register the Tiny MCE plugins for the WordPress.com block editor integration.
	 *
	 * @param array $plugin_array An array of external Tiny MCE plugins.
	 * @return array External TinyMCE plugins.
	 */
	public function add_tinymce_plugins( $plugin_array ) {
		if ( $this->is_iframed_block_editor() ) {
			$debug               = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;
			$src_calypso_tinymce = $debug
				? '//widgets.wp.com/wpcom-block-editor/calypso-tinymce.js?minify=false'
				: '//widgets.wp.com/wpcom-block-editor/calypso-tinymce.min.js';

			$plugin_array['gutenberg-wpcom-iframe-media-modal'] = add_query_arg(
				'v',
				gmdate( 'YW' ),
				$src_calypso_tinymce
			);
		}

		return $plugin_array;
	}
}

Jetpack_WPCOM_Block_Editor::init();
