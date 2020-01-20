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
			add_action( 'admin_init', array( $this, 'disable_send_frame_options_header' ), 9 );
			add_filter( 'admin_body_class', array( $this, 'add_iframed_body_class' ) );
		}

		add_filter( 'jetpack_auth_cookie_samesite', array( $this, 'set_samesite_auth_cookie' ) );

		add_action( 'login_init', array( $this, 'allow_block_editor_login' ), 1 );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_editor_assets' ), 9 );
		add_action( 'enqueue_block_assets', array( $this, 'enqueue_block_assets' ) );
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
	 * Prevents frame options header from firing if this is a whitelisted iframe request.
	 */
	public function disable_send_frame_options_header() {
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( $this->framing_allowed( $_GET['frame-nonce'] ) ) {
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
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( $this->framing_allowed( $_GET['frame-nonce'] ) ) {
			$classes .= ' is-iframed ';
		}

		return $classes;
	}

	/**
	 * Allows to iframe the login page if a user is logged out
	 * while trying to access the block editor from wordpress.com.
	 */
	public function allow_block_editor_login() {
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( empty( $_REQUEST['redirect_to'] ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification
		$query = wp_parse_url( urldecode( $_REQUEST['redirect_to'] ), PHP_URL_QUERY );
		$args  = wp_parse_args( $query );

		// Check nonce and make sure this is a Gutenframe request.
		if ( ! empty( $args['frame-nonce'] ) && $this->framing_allowed( $args['frame-nonce'] ) ) {

			// If SSO is active, we'll let WordPress.com handle authentication...
			if ( Jetpack::is_module_active( 'sso' ) ) {
				// ...but only if it's not an Atomic site. They already do that.
				if ( ! jetpack_is_atomic_site() ) {
					add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true' );
				}
			} else {
				$_REQUEST['interim-login'] = true;
				add_action( 'wp_login', array( $this, 'do_redirect' ) );
				add_action( 'login_form', array( $this, 'add_login_html' ) );
				add_filter( 'wp_login_errors', array( $this, 'add_login_message' ) );
				remove_action( 'login_init', 'send_frame_options_header' );
				wp_add_inline_style( 'login', '.interim-login #login{padding-top:8%}' );
			}
		}
	}

	/**
	 * Adds a login message.
	 *
	 * Intended to soften the expectation mismatch of ending up with a login screen rather than the editor.
	 *
	 * @param WP_Error $errors WP Error object.
	 * @return \WP_Error
	 */
	public function add_login_message( $errors ) {
		$errors->remove( 'expired' );
		$errors->add( 'info', __( 'Before we continue, please log in to your Jetpack site.', 'jetpack' ), 'message' );

		return $errors;
	}

	/**
	 * Maintains the `redirect_to` parameter in login form links.
	 * Adds visual feedback of login in progress.
	 */
	public function add_login_html() {
		?>
		<input type="hidden" name="redirect_to" value="<?php echo esc_url( $_REQUEST['redirect_to'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>" />
		<script type="application/javascript">
			document.getElementById( 'loginform' ).addEventListener( 'submit' , function() {
				document.getElementById( 'wp-submit' ).setAttribute( 'disabled', 'disabled' );
				document.getElementById( 'wp-submit' ).value = '<?php echo esc_js( __( 'Logging In...', 'jetpack' ) ); ?>';
			} );
		</script>
		<?php
	}

	/**
	 * Does the redirect to the block editor.
	 */
	public function do_redirect() {
		wp_safe_redirect( $GLOBALS['redirect_to'] );
		exit;
	}

	/**
	 * Checks whether this is a whitelisted iframe request.
	 *
	 * @param string $nonce Nonce to verify.
	 * @return bool
	 */
	public function framing_allowed( $nonce ) {
		$verified = $this->verify_frame_nonce( $nonce, 'frame-' . Jetpack_Options::get_option( 'id' ) );

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

		// Check if it matches the current user, unless they're trying to log in.
		if ( get_current_user_id() !== $this->nonce_user_id && ! doing_action( 'login_init' ) ) {
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
	 * Enqueues the WordPress.com block editor integration assets for the editor.
	 */
	public function enqueue_block_editor_assets() {
		$debug   = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;
		$version = gmdate( 'Ymd' );

		wp_enqueue_script(
			'wpcom-block-editor-default-editor-script',
			$debug
				? '//widgets.wp.com/wpcom-block-editor/default.editor.js?minify=false'
				: '//widgets.wp.com/wpcom-block-editor/default.editor.min.js',
			array(
				'jquery',
				'lodash',
				'wp-compose',
				'wp-data',
				'wp-editor',
				'wp-element',
				'wp-rich-text',
			),
			$version,
			true
		);

		wp_localize_script(
			'wpcom-block-editor-default-editor-script',
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

		if ( jetpack_is_atomic_site() ) {
			wp_enqueue_script(
				'wpcom-block-editor-wpcom-editor-script',
				$debug
					? '//widgets.wp.com/wpcom-block-editor/wpcom.editor.js?minify=false'
					: '//widgets.wp.com/wpcom-block-editor/wpcom.editor.min.js',
				array(
					'lodash',
					'wp-blocks',
					'wp-data',
					'wp-dom-ready',
					'wp-plugins',
				),
				$version,
				true
			);
		}

		if ( $this->is_iframed_block_editor() ) {
			wp_enqueue_script(
				'wpcom-block-editor-calypso-editor-script',
				$debug
					? '//widgets.wp.com/wpcom-block-editor/calypso.editor.js?minify=false'
					: '//widgets.wp.com/wpcom-block-editor/calypso.editor.min.js',
				array(
					'calypsoify_wpadminmods_js',
					'jquery',
					'lodash',
					'react',
					'wp-blocks',
					'wp-data',
					'wp-hooks',
					'wp-tinymce',
					'wp-url',
				),
				$version,
				true
			);

			wp_enqueue_style(
				'wpcom-block-editor-calypso-editor-styles',
				$debug
					? '//widgets.wp.com/wpcom-block-editor/calypso.editor.css?minify=false'
					: '//widgets.wp.com/wpcom-block-editor/calypso.editor.min.css',
				array(),
				$version
			);
		}
	}

	/**
	 * Enqueues the WordPress.com block editor integration assets for both editor and front-end.
	 */
	public function enqueue_block_assets() {
		// These styles are manually copied from //widgets.wp.com/wpcom-block-editor/default.view.css in order to
		// improve the performance by avoiding an extra network request to download the CSS file on every page.
		wp_add_inline_style( 'wp-block-library', '.has-text-align-justify{text-align:justify;}' );
	}

	/**
	 * Determines if the current $post contains a justified paragraph block.
	 *
	 * @return boolean true if justified paragraph is found, false otherwise.
	 */
	public function has_justified_block() {
		global $post;
		if ( ! $post instanceof WP_Post ) {
			return false;
		};

		if ( ! has_blocks( $post ) ) {
			return false;
		}

		return false !== strpos( $post->post_content, '<!-- wp:paragraph {"align":"justify"' );
	}

	/**
	 * Register the Tiny MCE plugins for the WordPress.com block editor integration.
	 *
	 * @param array $plugin_array An array of external Tiny MCE plugins.
	 * @return array External TinyMCE plugins.
	 */
	public function add_tinymce_plugins( $plugin_array ) {
		if ( $this->is_iframed_block_editor() ) {
			$debug = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;

			$plugin_array['gutenberg-wpcom-iframe-media-modal'] = add_query_arg(
				'v',
				gmdate( 'YW' ),
				$debug
					? '//widgets.wp.com/wpcom-block-editor/calypso.tinymce.js?minify=false'
					: '//widgets.wp.com/wpcom-block-editor/calypso.tinymce.min.js'
			);
		}

		return $plugin_array;
	}

	/**
	 * Designates cookies for cross-site access.
	 *
	 * @param string $samesite SameSite attribute to use in auth cookies.
	 *
	 * @return string SameSite attribute to use on auth cookies.
	 */
	public function set_samesite_auth_cookie( $samesite ) {
		return is_ssl() ? 'None' : $samesite;
	}
}

Jetpack_WPCOM_Block_Editor::init();
