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

		add_action( 'login_init', array( $this, 'allow_block_editor_login' ), 1 );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_editor_assets' ), 9 );
		add_action( 'enqueue_block_assets', array( $this, 'enqueue_block_assets' ) );
		add_filter( 'mce_external_plugins', array( $this, 'add_tinymce_plugins' ) );

		$this->enable_cross_site_auth_cookies();
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
	 * Prevents frame options header from firing if this is a allowed iframe request.
	 */
	public function disable_send_frame_options_header() {
		// phpcs:ignore WordPress.Security.NonceVerification
		if ( $this->framing_allowed( $_GET['frame-nonce'] ) ) {
			remove_action( 'admin_init', 'send_frame_options_header' );
		}
	}

	/**
	 * Adds custom admin body class if this is a allowed iframe request.
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
	 * Checks to see if cookie can be set in current context. If 3rd party cookie blocking
	 * is enabled the editor can't load in iFrame, so emiting X-Frame-Options: DENY will
	 * force the editor to break out of the iFrame.
	 */
	private function check_iframe_cookie_setting() {
		if ( ! isset( $_SERVER['QUERY_STRING'] ) || ! strpos( $_SERVER['QUERY_STRING'], 'calypsoify%3D1%26block-editor' ) || isset( $_COOKIE['wordpress_test_cookie'] ) ) {
			return;
		}

		if ( empty( $_GET['calypsoify_cookie_check'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			header( 'Location: ' . esc_url_raw( $_SERVER['REQUEST_URI'] . '&calypsoify_cookie_check=true' ) );
			exit;
		}

		header( 'X-Frame-Options: DENY' );
		exit;
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

		$this->check_iframe_cookie_setting();

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
	 * Checks whether this is an allowed iframe request.
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
					'isVisible' => $this->is_iframed_block_editor() && ! isset( $_GET['in-editor-deprecation-group'] ), // phpcs:ignore WordPress.Security.NonceVerification
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
	 * Ensures the authentication cookies are designated for cross-site access.
	 */
	private function enable_cross_site_auth_cookies() {
		/**
		 * Allow plugins to disable the cross-site auth cookies.
		 *
		 * @since 8.1.1
		 *
		 * @param false bool Whether auth cookies should be disabled for cross-site access. False by default.
		 */
		if ( apply_filters( 'jetpack_disable_cross_site_auth_cookies', false ) ) {
			return;
		}

		add_action( 'set_auth_cookie', array( $this, 'set_samesite_auth_cookies' ), 10, 5 );
		add_action( 'set_logged_in_cookie', array( $this, 'set_samesite_logged_in_cookies' ), 10, 4 );
		add_action( 'clear_auth_cookie', array( $this, 'clear_auth_cookies' ) );
		add_filter( 'send_auth_cookies', '__return_false' );
	}

	/**
	 * Gets the SameSite attribute to use in auth cookies.
	 *
	 * @param  bool $secure Whether the connection is secure.
	 * @return string SameSite attribute to use on auth cookies.
	 */
	public function get_samesite_attr_for_auth_cookies( $secure ) {
		$samesite = $secure ? 'None' : 'Lax';
		/**
		 * Filters the SameSite attribute to use in auth cookies.
		 *
		 * @param string $samesite SameSite attribute to use in auth cookies.
		 *
		 * @since 8.1.1
		 */
		$samesite = apply_filters( 'jetpack_auth_cookie_samesite', $samesite );

		return $samesite;
	}

	/**
	 * Generates cross-site auth cookies so they can be accessed by WordPress.com.
	 *
	 * @param string $auth_cookie Authentication cookie value.
	 * @param int    $expire      The time the login grace period expires as a UNIX timestamp.
	 *                            Default is 12 hours past the cookie's expiration time.
	 * @param int    $expiration  The time when the authentication cookie expires as a UNIX timestamp.
	 *                            Default is 14 days from now.
	 * @param int    $user_id     User ID.
	 * @param string $scheme      Authentication scheme. Values include 'auth' or 'secure_auth'.
	 */
	public function set_samesite_auth_cookies( $auth_cookie, $expire, $expiration, $user_id, $scheme ) {
		if ( wp_startswith( $scheme, 'secure_' ) ) {
			$secure           = true;
			$auth_cookie_name = SECURE_AUTH_COOKIE;
		} else {
			$secure           = false;
			$auth_cookie_name = AUTH_COOKIE;
		}
		$samesite = $this->get_samesite_attr_for_auth_cookies( $secure );

		jetpack_shim_setcookie(
			$auth_cookie_name,
			$auth_cookie,
			array(
				'expires'  => $expire,
				'path'     => PLUGINS_COOKIE_PATH,
				'domain'   => COOKIE_DOMAIN,
				'secure'   => $secure,
				'httponly' => true,
				'samesite' => $samesite,
			)
		);

		jetpack_shim_setcookie(
			$auth_cookie_name,
			$auth_cookie,
			array(
				'expires'  => $expire,
				'path'     => ADMIN_COOKIE_PATH,
				'domain'   => COOKIE_DOMAIN,
				'secure'   => $secure,
				'httponly' => true,
				'samesite' => $samesite,
			)
		);
	}

	/**
	 * Generates cross-site logged in cookies so they can be accessed by WordPress.com.
	 *
	 * @param string $logged_in_cookie The logged-in cookie value.
	 * @param int    $expire           The time the login grace period expires as a UNIX timestamp.
	 *                                 Default is 12 hours past the cookie's expiration time.
	 * @param int    $expiration       The time when the logged-in cookie expires as a UNIX timestamp.
	 *                                 Default is 14 days from now.
	 * @param int    $user_id          User ID.
	 */
	public function set_samesite_logged_in_cookies( $logged_in_cookie, $expire, $expiration, $user_id ) {
		$secure = is_ssl();

		// Front-end cookie is secure when the auth cookie is secure and the site's home URL is forced HTTPS.
		$secure_logged_in_cookie = $secure && 'https' === wp_parse_url( get_option( 'home' ), PHP_URL_SCHEME );

		/** This filter is documented in core/src/wp-includes/pluggable.php */
		$secure = apply_filters( 'secure_auth_cookie', $secure, $user_id );

		/** This filter is documented in core/src/wp-includes/pluggable.php */
		$secure_logged_in_cookie = apply_filters( 'secure_logged_in_cookie', $secure_logged_in_cookie, $user_id, $secure );

		$samesite = $this->get_samesite_attr_for_auth_cookies( $secure_logged_in_cookie );

		jetpack_shim_setcookie(
			LOGGED_IN_COOKIE,
			$logged_in_cookie,
			array(
				'expires'  => $expire,
				'path'     => COOKIEPATH,
				'domain'   => COOKIE_DOMAIN,
				'secure'   => $secure_logged_in_cookie,
				'httponly' => true,
				'samesite' => $samesite,
			)
		);

		if ( COOKIEPATH !== SITECOOKIEPATH ) {
			jetpack_shim_setcookie(
				LOGGED_IN_COOKIE,
				$logged_in_cookie,
				array(
					'expires'  => $expire,
					'path'     => SITECOOKIEPATH,
					'domain'   => COOKIE_DOMAIN,
					'secure'   => $secure_logged_in_cookie,
					'httponly' => true,
					'samesite' => $samesite,
				)
			);
		}
	}

	/**
	 * Removes all of the cookies associated with authentication.
	 *
	 * This is copied from core's `wp_clear_auth_cookie` since disabling the core auth cookies prevents also the auth
	 * cookies from being cleared.
	 *
	 * @see wp_clear_auth_cookie
	 */
	public function clear_auth_cookies() {
		// Auth cookies.
		setcookie( AUTH_COOKIE, ' ', time() - YEAR_IN_SECONDS, ADMIN_COOKIE_PATH, COOKIE_DOMAIN );
		setcookie( SECURE_AUTH_COOKIE, ' ', time() - YEAR_IN_SECONDS, ADMIN_COOKIE_PATH, COOKIE_DOMAIN );
		setcookie( AUTH_COOKIE, ' ', time() - YEAR_IN_SECONDS, PLUGINS_COOKIE_PATH, COOKIE_DOMAIN );
		setcookie( SECURE_AUTH_COOKIE, ' ', time() - YEAR_IN_SECONDS, PLUGINS_COOKIE_PATH, COOKIE_DOMAIN );
		setcookie( LOGGED_IN_COOKIE, ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
		setcookie( LOGGED_IN_COOKIE, ' ', time() - YEAR_IN_SECONDS, SITECOOKIEPATH, COOKIE_DOMAIN );

		// Settings cookies.
		setcookie( 'wp-settings-' . get_current_user_id(), ' ', time() - YEAR_IN_SECONDS, SITECOOKIEPATH );
		setcookie( 'wp-settings-time-' . get_current_user_id(), ' ', time() - YEAR_IN_SECONDS, SITECOOKIEPATH );

		// Old cookies.
		setcookie( AUTH_COOKIE, ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
		setcookie( AUTH_COOKIE, ' ', time() - YEAR_IN_SECONDS, SITECOOKIEPATH, COOKIE_DOMAIN );
		setcookie( SECURE_AUTH_COOKIE, ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
		setcookie( SECURE_AUTH_COOKIE, ' ', time() - YEAR_IN_SECONDS, SITECOOKIEPATH, COOKIE_DOMAIN );

		// Even older cookies.
		setcookie( USER_COOKIE, ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
		setcookie( PASS_COOKIE, ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
		setcookie( USER_COOKIE, ' ', time() - YEAR_IN_SECONDS, SITECOOKIEPATH, COOKIE_DOMAIN );
		setcookie( PASS_COOKIE, ' ', time() - YEAR_IN_SECONDS, SITECOOKIEPATH, COOKIE_DOMAIN );

		// Post password cookie.
		setcookie( 'wp-postpass_' . COOKIEHASH, ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
	}
}

Jetpack_WPCOM_Block_Editor::init();
