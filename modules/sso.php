<?php
require_once( JETPACK__PLUGIN_DIR . 'modules/sso/class.jetpack-sso-helpers.php' );

/**
 * Module Name: Single Sign On
 * Module Description: Secure user authentication.
 * Jumpstart Description: Lets you log in to all your Jetpack-enabled sites with one click using your WordPress.com account.
 * Sort Order: 30
 * Recommendation Order: 5
 * First Introduced: 2.6
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Developers
 * Feature: Jumpstart, Performance-Security
 * Additional Search Queries: sso, single sign on, login, log in
 */

class Jetpack_SSO {
	static $instance = null;

	private function __construct() {

		self::$instance = $this;

		add_action( 'admin_init',             array( $this, 'maybe_authorize_user_after_sso' ), 1 );
		add_action( 'admin_init',             array( $this, 'register_settings' ) );
		add_action( 'login_init',             array( $this, 'login_init' ) );
		add_action( 'delete_user',            array( $this, 'delete_connection_for_user' ) );
		add_filter( 'jetpack_xmlrpc_methods', array( $this, 'xmlrpc_methods' ) );
		add_action( 'init',                   array( $this, 'maybe_logout_user' ), 5 );
		add_action( 'jetpack_modules_loaded', array( $this, 'module_configure_button' ) );
		add_action( 'admin_enqueue_scripts',  array( $this, 'admin_enqueue_scripts' ) );
		add_action( 'login_form_logout',      array( $this, 'store_wpcom_profile_cookies_on_logout' ) );
		add_action( 'wp_login',               array( 'Jetpack_SSO', 'clear_wpcom_profile_cookies' ) );
		add_action( 'jetpack_unlinked_user',  array( $this, 'delete_connection_for_user') );

		// Adding this action so that on login_init, the action won't be sanitized out of the $action global.
		add_action( 'login_form_jetpack-sso', '__return_true' );
	}

	/**
	 * Returns the single instance of the Jetpack_SSO object
	 *
	 * @since 2.8
	 * @return Jetpack_SSO
	 **/
	public static function get_instance() {
		if ( ! is_null( self::$instance ) ) {
			return self::$instance;
		}

		return self::$instance = new Jetpack_SSO;
	}

	/**
	 * Add configure button and functionality to the module card on the Jetpack screen
	 **/
	public static function module_configure_button() {
		Jetpack::enable_module_configurable( __FILE__ );
		Jetpack::module_configuration_load( __FILE__, array( __CLASS__, 'module_configuration_load' ) );
		Jetpack::module_configuration_head( __FILE__, array( __CLASS__, 'module_configuration_head' ) );
		Jetpack::module_configuration_screen( __FILE__, array( __CLASS__, 'module_configuration_screen' ) );
	}

	public static function module_configuration_load() {}

	public static function module_configuration_head() {}

	public static function module_configuration_screen() {
		?>
		<form method="post" action="options.php">
			<?php settings_fields( 'jetpack-sso' ); ?>
			<?php do_settings_sections( 'jetpack-sso' ); ?>
			<?php submit_button(); ?>
		</form>
		<?php
	}


	/**
	 * When the default login form is hidden, this method is called on the 'authenticate' filter with a priority of 30.
	 * This method disables the ability to submit the default login form.
	 *
	 * @param $user
	 *
	 * @return WP_Error
	 */
	public function disable_default_login_form( $user ) {
		if ( is_wp_error( $user ) ) {
			return $user;
		}

		/**
		 * Since we're returning an error that will be shown as a red notice, let's remove the
		 * informational "blue" notice.
		 */
		remove_filter( 'login_message', array( $this, 'msg_login_by_jetpack' ) );
		return new WP_Error( 'jetpack_sso_required', $this->get_sso_required_message() );
	}

	/**
	 * If jetpack_force_logout == 1 in current user meta the user will be forced
	 * to logout and reauthenticate with the site.
	 **/
	public function maybe_logout_user() {
		global $current_user;

		if ( 1 == $current_user->jetpack_force_logout ) {
			delete_user_meta( $current_user->ID, 'jetpack_force_logout' );
			self::delete_connection_for_user( $current_user->ID );
			wp_logout();
			wp_safe_redirect( wp_login_url() );
			exit;
		}
	}


	/**
	 * Adds additional methods the WordPress xmlrpc API for handling SSO specific features
	 *
	 * @param array $methods
	 * @return array
	 **/
	public function xmlrpc_methods( $methods ) {
		$methods['jetpack.userDisconnect'] = array( $this, 'xmlrpc_user_disconnect' );
		return $methods;
	}

	/**
	 * Marks a user's profile for disconnect from WordPress.com and forces a logout
	 * the next time the user visits the site.
	 **/
	public function xmlrpc_user_disconnect( $user_id ) {
		$user_query = new WP_User_Query(
			array(
				'meta_key' => 'wpcom_user_id',
				'meta_value' => $user_id,
			)
		);
		$user = $user_query->get_results();
		$user = $user[0];

		if ( $user instanceof WP_User ) {
			$user = wp_set_current_user( $user->ID );
			update_user_meta( $user->ID, 'jetpack_force_logout', '1' );
			self::delete_connection_for_user( $user->ID );
			return true;
		}
		return false;
	}

	/**
	 * Enqueues scripts and styles necessary for SSO login.
	 */
	public function login_enqueue_scripts() {
		global $action;

		if ( ! in_array( $action, array( 'jetpack-sso', 'login' ) ) ) {
			return;
		}

		if ( is_rtl() ) {
			wp_enqueue_style( 'jetpack-sso-login', plugins_url( 'modules/sso/jetpack-sso-login-rtl.css', JETPACK__PLUGIN_FILE ), array( 'login', 'genericons' ), JETPACK__VERSION );
		} else {
			wp_enqueue_style( 'jetpack-sso-login', plugins_url( 'modules/sso/jetpack-sso-login.css', JETPACK__PLUGIN_FILE ), array( 'login', 'genericons' ), JETPACK__VERSION );
		}

		wp_enqueue_script( 'jetpack-sso-login', plugins_url( 'modules/sso/jetpack-sso-login.js', JETPACK__PLUGIN_FILE ), array( 'jquery' ), JETPACK__VERSION );
	}

	/**
	 * Enqueue styles neceessary for Jetpack SSO on users' profiles
	 */
	public function admin_enqueue_scripts() {
		$screen = get_current_screen();

		if ( empty( $screen ) || ! in_array( $screen->base, array( 'edit-user', 'profile' ) ) ) {
			return;
		}

		wp_enqueue_style( 'jetpack-sso-profile', plugins_url( 'modules/sso/jetpack-sso-profile.css', JETPACK__PLUGIN_FILE ), array( 'genericons' ), JETPACK__VERSION );
	}

	/**
	 * Adds Jetpack SSO classes to login body
	 *
	 * @param  array $classes Array of classes to add to body tag
	 * @return array          Array of classes to add to body tag
	 */
	public function login_body_class( $classes ) {
		global $action;

		if ( ! in_array( $action, array( 'jetpack-sso', 'login' ) ) ) {
			return $classes;
		}

		// Always add the jetpack-sso class so that we can add SSO specific styling even when the SSO form isn't being displayed.
		$classes[] = 'jetpack-sso';

		/**
		 * Should we show the SSO login form?
		 *
		 * $_GET['jetpack-sso-default-form'] is used to provide a fallback in case JavaScript is not enabled.
		 *
		 * The default_to_sso_login() method allows us to dynamically decide whether we show the SSO login form or not.
		 * The SSO module uses the method to display the default login form if we can not find a user to log in via SSO.
		 * But, the method could be filtered by a site admin to always show the default login form if that is preferred.
		 */
		if ( empty( $_GET['jetpack-sso-show-default-form'] ) && Jetpack_SSO_Helpers::show_sso_login() ) {
			$classes[] = 'jetpack-sso-form-display';
		}

		return $classes;
	}

	/**
	 * Adds settings fields to Settings > General > Single Sign On that allows users to
	 * turn off the login form on wp-login.php
	 *
	 * @since 2.7
	 **/
	public function register_settings() {

		add_settings_section(
			'jetpack_sso_settings',
			__( 'Single Sign On' , 'jetpack' ),
			'__return_false',
			'jetpack-sso'
		);

		/*
		 * Settings > General > Single Sign On
		 * Require two step authentication
		 */
		register_setting(
			'jetpack-sso',
			'jetpack_sso_require_two_step',
			array( $this, 'validate_jetpack_sso_require_two_step' )
		);

		add_settings_field(
			'jetpack_sso_require_two_step',
			'', // __( 'Require Two-Step Authentication' , 'jetpack' ),
			array( $this, 'render_require_two_step' ),
			'jetpack-sso',
			'jetpack_sso_settings'
		);

		/*
		 * Settings > General > Single Sign On
		 */
		register_setting(
			'jetpack-sso',
			'jetpack_sso_match_by_email',
			array( $this, 'validate_jetpack_sso_match_by_email' )
		);

		add_settings_field(
			'jetpack_sso_match_by_email',
			'', // __( 'Match by Email' , 'jetpack' ),
			array( $this, 'render_match_by_email' ),
			'jetpack-sso',
			'jetpack_sso_settings'
		);
	}

	/**
	 * Builds the display for the checkbox allowing user to require two step
	 * auth be enabled on WordPress.com accounts before login. Displays in Settings > General
	 *
	 * @since 2.7
	 **/
	public function render_require_two_step() {
		?>
		<label>
			<input
				type="checkbox"
				name="jetpack_sso_require_two_step"
				<?php checked( Jetpack_SSO_Helpers::is_two_step_required() ); ?>
				<?php disabled( Jetpack_SSO_Helpers::is_require_two_step_checkbox_disabled() ); ?>
			>
			<?php esc_html_e( 'Require Two-Step Authentication' , 'jetpack' ); ?>
		</label>
		<?php
	}

	/**
	 * Validate the require  two step checkbox in Settings > General
	 *
	 * @since 2.7
	 * @return boolean
	 **/
	public function validate_jetpack_sso_require_two_step( $input ) {
		return ( ! empty( $input ) ) ? 1 : 0;
	}

	/**
	 * Builds the display for the checkbox allowing the user to allow matching logins by email
	 * Displays in Settings > General
	 *
	 * @since 2.9
	 **/
	public function render_match_by_email() {
		?>
			<label>
				<input
					type="checkbox"
					name="jetpack_sso_match_by_email"
					<?php checked( Jetpack_SSO_Helpers::match_by_email() ); ?>
					<?php disabled( Jetpack_SSO_Helpers::is_match_by_email_checkbox_disabled() ); ?>
				>
				<?php esc_html_e( 'Match by Email', 'jetpack' ); ?>
			</label>
		<?php
	}

	/**
	 * Validate the match by email check in Settings > General
	 *
	 * @since 2.9
	 * @return boolean
	 **/
	public function validate_jetpack_sso_match_by_email( $input ) {
		return ( ! empty( $input ) ) ? 1 : 0;
	}

	/**
	 * Checks to determine if the user wants to login on wp-login
	 *
	 * This function mostly exists to cover the exceptions to login
	 * that may exist as other parameters to $_GET[action] as $_GET[action]
	 * does not have to exist. By default WordPress assumes login if an action
	 * is not set, however this may not be true, as in the case of logout
	 * where $_GET[loggedout] is instead set
	 *
	 * @return boolean
	 **/
	private function wants_to_login() {
		$wants_to_login = false;

		// Cover default WordPress behavior
		$action = isset( $_REQUEST['action'] ) ? $_REQUEST['action'] : 'login';

		// And now the exceptions
		$action = isset( $_GET['loggedout'] ) ? 'loggedout' : $action;

		if ( 'login' == $action ) {
			$wants_to_login = true;
		}

		return $wants_to_login;
	}

	function login_init() {
		global $action;

		if ( Jetpack_SSO_Helpers::should_hide_login_form() ) {
			/**
			 * Since the default authenticate filters fire at priority 20 for checking username and password,
			 * let's fire at priority 30. wp_authenticate_spam_check is fired at priority 99, but since we return a
			 * WP_Error in disable_default_login_form, then we won't trigger spam processing logic.
			 */
			add_filter( 'authenticate', array( $this, 'disable_default_login_form' ), 30 );

			/**
			 * Filter the display of the disclaimer message appearing when default WordPress login form is disabled.
			 *
			 * @module sso
			 *
			 * @since 2.8.0
			 *
			 * @param bool true Should the disclaimer be displayed. Default to true.
			 */
			$display_sso_disclaimer = apply_filters( 'jetpack_sso_display_disclaimer', true );
			if ( $display_sso_disclaimer ) {
				add_filter( 'login_message', array( $this, 'msg_login_by_jetpack' ) );
			}
		}

		/**
		 * If the user is attempting to logout AND the auto-forward to WordPress.com
		 * login is set then we need to ensure we do not auto-forward the user and get
		 * them stuck in an infinite logout loop.
		 */
		if ( isset( $_GET['loggedout'] ) && Jetpack_SSO_Helpers::bypass_login_forward_wpcom() ) {
			add_filter( 'jetpack_remove_login_form', '__return_true' );
		}

		/**
		 * Check to see if the site admin wants to automagically forward the user
		 * to the WordPress.com login page AND  that the request to wp-login.php
		 * is not something other than login (Like logout!)
		 */
		if (
			$this->wants_to_login()
			&& Jetpack_SSO_Helpers::bypass_login_forward_wpcom()
		) {
			add_filter( 'allowed_redirect_hosts', array( $this, 'allowed_redirect_hosts' ) );
			$this->maybe_save_cookie_redirect();
			$reauth = ! empty( $_GET['force_reauth'] );
			$sso_url = $this->get_sso_url_or_die( $reauth );
			JetpackTracking::record_user_event( 'sso_login_redirect_bypass_success' );
			wp_safe_redirect( $sso_url );
			exit;
		}

		if ( 'login' === $action ) {
			$this->display_sso_login_form();
		} elseif ( 'jetpack-sso' === $action ) {
			if ( isset( $_GET['result'], $_GET['user_id'], $_GET['sso_nonce'] ) && 'success' == $_GET['result'] ) {
				$this->handle_login();
				$this->display_sso_login_form();
			} else {
				if ( Jetpack::check_identity_crisis() ) {
					JetpackTracking::record_user_event( 'sso_login_redirect_failed', array(
						'error_message' => 'identity_crisis'
					) );
					wp_die( __( "Error: This site's Jetpack connection is currently experiencing problems.", 'jetpack' ) );
				} else {
					$this->maybe_save_cookie_redirect();
					// Is it wiser to just use wp_redirect than do this runaround to wp_safe_redirect?
					add_filter( 'allowed_redirect_hosts', array( $this, 'allowed_redirect_hosts' ) );
					$reauth = ! empty( $_GET['force_reauth'] );
					$sso_url = $this->get_sso_url_or_die( $reauth );
					JetpackTracking::record_user_event( 'sso_login_redirect_success' );
					wp_safe_redirect( $sso_url );
					exit;
				}
			}
		}
	}

	/**
	 * Ensures that we can get a nonce from WordPress.com via XML-RPC before setting
	 * up the hooks required to display the SSO form.
	 */
	public function display_sso_login_form() {
		$sso_nonce = self::request_initial_nonce();
		if ( is_wp_error( $sso_nonce ) ) {
			return;
		}

		add_action( 'login_form',            array( $this, 'login_form' ) );
		add_filter( 'login_body_class',      array( $this, 'login_body_class' ) );
		add_action( 'login_enqueue_scripts', array( $this, 'login_enqueue_scripts' ) );
	}

	/**
	 * Conditionally save the redirect_to url as a cookie.
	 */
	public static function maybe_save_cookie_redirect() {
		if ( headers_sent() ) {
			return new WP_Error( 'headers_sent', __( 'Cannot deal with cookie redirects, as headers are already sent.', 'jetpack' ) );
		}

		if ( ! empty( $_GET['redirect_to'] ) ) {
			// If we have something to redirect to
			$url = esc_url_raw( $_GET['redirect_to'] );
			setcookie( 'jetpack_sso_redirect_to', $url, time() + HOUR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, false, true );

		} elseif ( ! empty( $_COOKIE['jetpack_sso_redirect_to'] ) ) {
			// Otherwise, if it's already set, purge it.
			setcookie( 'jetpack_sso_redirect_to', ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
		}

		if ( ! empty( $_GET['rememberme'] ) ) {
			setcookie( 'jetpack_sso_remember_me', '1', time() + HOUR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, false, true );
		} elseif ( ! empty( $_COOKIE['jetpack_sso_remember_me'] ) ) {
			setcookie( 'jetpack_sso_remember_me', ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
		}
	}

	/**
	 * Outputs the Jetpack SSO button and description as well as the toggle link
	 * for switching between Jetpack SSO and default login.
	 */
	function login_form() {
		$site_name = get_bloginfo( 'name' );
		if ( ! $site_name ) {
			$site_name = get_bloginfo( 'url' );
		}

		$display_name = ! empty( $_COOKIE[ 'jetpack_sso_wpcom_name_' . COOKIEHASH ] )
			? $_COOKIE[ 'jetpack_sso_wpcom_name_' . COOKIEHASH ]
			: false;
		$gravatar = ! empty( $_COOKIE[ 'jetpack_sso_wpcom_gravatar_' . COOKIEHASH ] )
			? $_COOKIE[ 'jetpack_sso_wpcom_gravatar_' . COOKIEHASH ]
			: false;

		?>
		<div id="jetpack-sso-wrap">
			<?php if ( $display_name && $gravatar ) : ?>
				<div id="jetpack-sso-wrap__user">
					<img width="72" height="72" src="<?php echo esc_html( $gravatar ); ?>" />

					<h2>
						<?php
							echo wp_kses(
								sprintf( __( 'Log in as <span>%s</span>', 'jetpack' ), esc_html( $display_name ) ),
								array( 'span' => true )
							);
						?>
					</h2>
				</div>

			<?php endif; ?>


			<div id="jetpack-sso-wrap__action">
				<?php echo $this->build_sso_button( array(), 'is_primary' ); ?>

				<?php if ( $display_name && $gravatar ) : ?>
					<a rel="nofollow" class="jetpack-sso-wrap__reauth" href="<?php echo esc_url( $this->build_sso_button_url( array( 'force_reauth' => '1' ) ) ); ?>">
						<?php esc_html_e( 'Log in as a different WordPress.com user', 'jetpack' ); ?>
					</a>
				<?php else : ?>
					<p>
						<?php
							echo esc_html(
								sprintf(
									__( 'You can now save time spent logging in by connecting your WordPress.com account to %s.', 'jetpack' ),
									esc_html( $site_name )
								)
							);
						?>
					</p>
				<?php endif; ?>
			</div>

			<?php if ( ! Jetpack_SSO_Helpers::should_hide_login_form() ) : ?>
				<div class="jetpack-sso-or">
					<span><?php esc_html_e( 'Or', 'jetpack' ); ?></span>
				</div>

				<a href="<?php echo add_query_arg( 'jetpack-sso-show-default-form', '1' ); ?>" class="jetpack-sso-toggle wpcom">
					<?php
						esc_html_e( 'Log in with username and password', 'jetpack' )
					?>
				</a>

				<a href="<?php echo add_query_arg( 'jetpack-sso-show-default-form', '0' ); ?>" class="jetpack-sso-toggle default">
					<?php
						esc_html_e( 'Log in with WordPress.com', 'jetpack' )
					?>
				</a>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Clear the cookies that store the profile information for the last
	 * WPCOM user to connect.
	 */
	static function clear_wpcom_profile_cookies() {
		if ( isset( $_COOKIE[ 'jetpack_sso_wpcom_name_' . COOKIEHASH ] ) ) {
			setcookie(
				'jetpack_sso_wpcom_name_' . COOKIEHASH,
				' ',
				time() - YEAR_IN_SECONDS,
				COOKIEPATH,
				COOKIE_DOMAIN
			);
		}

		if ( isset( $_COOKIE[ 'jetpack_sso_wpcom_gravatar_' . COOKIEHASH ] ) ) {
			setcookie(
				'jetpack_sso_wpcom_gravatar_' . COOKIEHASH,
				' ',
				time() - YEAR_IN_SECONDS,
				COOKIEPATH,
				COOKIE_DOMAIN
			);
		}
	}

	static function delete_connection_for_user( $user_id ) {
		if ( ! $wpcom_user_id = get_user_meta( $user_id, 'wpcom_user_id', true ) ) {
			return;
		}
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'wpcom_user_id' => $user_id,
		) );
		$xml->query( 'jetpack.sso.removeUser', $wpcom_user_id );

		if ( $xml->isError() ) {
			return false;
		}

		// Clean up local data stored for SSO
		delete_user_meta( $user_id, 'wpcom_user_id' );
		delete_user_meta( $user_id, 'wpcom_user_data'  );
		self::clear_wpcom_profile_cookies();

		return $xml->getResponse();
	}

	static function request_initial_nonce() {
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id(),
		) );
		$xml->query( 'jetpack.sso.requestNonce' );

		if ( $xml->isError() ) {
			return new WP_Error( $xml->getErrorCode(), $xml->getErrorMessage() );
		}

		return $xml->getResponse();
	}

	/**
	 * The function that actually handles the login!
	 */
	function handle_login() {
		$wpcom_nonce   = sanitize_key( $_GET['sso_nonce'] );
		$wpcom_user_id = (int) $_GET['user_id'];

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id(),
		) );
		$xml->query( 'jetpack.sso.validateResult', $wpcom_nonce, $wpcom_user_id );

		if ( $xml->isError() ) {
			$error_message = sanitize_text_field(
				sprintf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() )
			);
			JetpackTracking::record_user_event( 'sso_login_failed', array(
				'error_message' => $error_message
			) );
			wp_die( $error_message );
		}

		$user_data = $xml->getResponse();

		if ( empty( $user_data ) ) {
			JetpackTracking::record_user_event( 'sso_login_failed', array(
				'error_message' => 'invalid_response_data'
			) );
			wp_die( __( 'Error, invalid response data.', 'jetpack' ) );
		}

		$user_data = (object) $user_data;
		$user = null;

		/**
		 * Fires before Jetpack's SSO modifies the log in form.
		 *
		 * @module sso
		 *
		 * @since 2.6.0
		 *
		 * @param object $user_data WordPress.com User information.
		 */
		do_action( 'jetpack_sso_pre_handle_login', $user_data );

		if ( Jetpack_SSO_Helpers::is_two_step_required() && 0 === (int) $user_data->two_step_enabled ) {
			$this->user_data = $user_data;

			JetpackTracking::record_user_event( 'sso_login_failed', array(
				'error_message' => 'error_msg_enable_two_step'
			) );

			/** This filter is documented in core/src/wp-includes/pluggable.php */
			do_action( 'wp_login_failed', $user_data->login );
			add_filter( 'login_message', array( $this, 'error_msg_enable_two_step' ) );
			return;
		}

		$user_found_with = '';
		if ( empty( $user ) && isset( $user_data->external_user_id ) ) {
			$user_found_with = 'external_user_id';
			$user = get_user_by( 'id', intval( $user_data->external_user_id ) );
			if ( $user ) {
				update_user_meta( $user->ID, 'wpcom_user_id', $user_data->ID );
			}
		}

		// If we don't have one by wpcom_user_id, try by the email?
		if ( empty( $user ) && Jetpack_SSO_Helpers::match_by_email() ) {
			$user_found_with = 'match_by_email';
			$user = get_user_by( 'email', $user_data->email );
			if ( $user ) {
				update_user_meta( $user->ID, 'wpcom_user_id', $user_data->ID );
			}
		}

		// If we've still got nothing, create the user.
		if ( empty( $user ) && ( get_option( 'users_can_register' ) || Jetpack_SSO_Helpers::new_user_override() ) ) {
			// If not matching by email we still need to verify the email does not exist
			// or this blows up
			/**
			 * If match_by_email is true, we know the email doesn't exist, as it would have
			 * been found in the first pass.  If get_user_by( 'email' ) doesn't find the
			 * user, then we know that email is unused, so it's safe to add.
			 */
			if ( Jetpack_SSO_Helpers::match_by_email() || ! get_user_by( 'email', $user_data->email ) ) {
				$username = $user_data->login;

				if ( username_exists( $username ) ) {
					$username = $user_data->login . '_' . $user_data->ID;
				}

				$tries = 0;
				while ( username_exists( $username ) ) {
					$username = $user_data->login . '_' . $user_data->ID . '_' . mt_rand();
					if ( $tries++ >= 5 ) {
						JetpackTracking::record_user_event( 'sso_login_failed', array(
							'error_message' => 'could_not_create_username'
						) );
						wp_die( __( "Error: Couldn't create suitable username.", 'jetpack' ) );
					}
				}

				$user_found_with = Jetpack_SSO_Helpers::new_user_override()
					? 'user_created_new_user_override'
					: 'user_created_users_can_register';

				$password = wp_generate_password( 20 );
				$user_id  = wp_create_user( $username, $password, $user_data->email );
				$user     = get_userdata( $user_id );

				$user->display_name = $user_data->display_name;
				$user->first_name   = $user_data->first_name;
				$user->last_name    = $user_data->last_name;
				$user->url          = $user_data->url;
				$user->description  = $user_data->description;
				wp_update_user( $user );

				update_user_meta( $user->ID, 'wpcom_user_id', $user_data->ID );
			} else {
				JetpackTracking::record_user_event( 'sso_login_failed', array(
					'error_message' => 'error_msg_email_already_exists'
				) );

				$this->user_data = $user_data;
				add_action( 'login_message', array( $this, 'error_msg_email_already_exists' ) );
				return;
			}
		}

		/**
		 * Fires after we got login information from WordPress.com.
		 *
		 * @module sso
		 *
		 * @since 2.6.0
		 *
		 * @param array  $user      Local User information.
		 * @param object $user_data WordPress.com User Login information.
		 */
		do_action( 'jetpack_sso_handle_login', $user, $user_data );

		if ( $user ) {
			// Cache the user's details, so we can present it back to them on their user screen
			update_user_meta( $user->ID, 'wpcom_user_data', $user_data );

			$remember = false;
			if ( ! empty( $_COOKIE['jetpack_sso_remember_me'] ) ) {
				$remember = true;
				// And then purge it
				setcookie( 'jetpack_sso_remember_me', ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
			}
			/**
			 * Filter the remember me value.
			 *
			 * @module sso
			 *
			 * @since 2.8.0
			 *
			 * @param bool $remember Is the remember me option checked?
			 */
			$remember = apply_filters( 'jetpack_remember_login', $remember );
			wp_set_auth_cookie( $user->ID, $remember );

			/** This filter is documented in core/src/wp-includes/user.php */
			do_action( 'wp_login', $user->user_login, $user );

			wp_set_current_user( $user->ID );

			$_request_redirect_to = isset( $_REQUEST['redirect_to'] ) ? esc_url_raw( $_REQUEST['redirect_to'] ) : '';
			$redirect_to = user_can( $user, 'edit_posts' ) ? admin_url() : self::profile_page_url();

			// If we have a saved redirect to request in a cookie
			if ( ! empty( $_COOKIE['jetpack_sso_redirect_to'] ) ) {
				// Set that as the requested redirect to
				$redirect_to = $_request_redirect_to = esc_url_raw( $_COOKIE['jetpack_sso_redirect_to'] );
				// And then purge it
				setcookie( 'jetpack_sso_redirect_to', ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
			}

			$is_user_connected = Jetpack::is_user_connected( $user->ID );
			JetpackTracking::record_user_event( 'sso_user_logged_in', array(
				'user_found_with' => $user_found_with,
				'user_connected'  => (bool) $is_user_connected,
				'user_role'       => Jetpack::init()->translate_current_user_to_role()
			) );

			if ( ! $is_user_connected ) {
				$calypso_env = ! empty( $_GET['calypso_env'] )
					? sanitize_key( $_GET['calypso_env'] )
					: '';

				wp_safe_redirect(
					add_query_arg(
						array(
							'redirect_to'               => $redirect_to,
							'request_redirect_to'       => $_request_redirect_to,
							'calypso_env'               => $calypso_env,
							'jetpack-sso-auth-redirect' => '1',
						),
						admin_url()
					)
				);
				exit;
			}

			wp_safe_redirect(
				/** This filter is documented in core/src/wp-login.php */
				apply_filters( 'login_redirect', $redirect_to, $_request_redirect_to, $user )
			);
			exit;
		}

		add_filter( 'jetpack_sso_default_to_sso_login', '__return_false' );

		JetpackTracking::record_user_event( 'sso_login_failed', array(
			'error_message' => 'cant_find_user'
		) );

		$this->user_data = $user_data;
		/** This filter is documented in core/src/wp-includes/pluggable.php */
		do_action( 'wp_login_failed', $user_data->login );
		add_filter( 'login_message', array( $this, 'cant_find_user' ) );
	}

	static function profile_page_url() {
		return admin_url( 'profile.php' );
	}

	function allowed_redirect_hosts( $hosts ) {
		if ( empty( $hosts ) ) {
			$hosts = array();
		}
		$hosts[] = 'wordpress.com';
		$hosts[] = 'jetpack.wordpress.com';

		return array_unique( $hosts );
	}

	/**
	 * Builds the "Login to WordPress.com" button that is displayed on the login page as well as user profile page.
	 *
	 * @param  array   $args       An array of arguments to add to the SSO URL.
	 * @param  boolean $is_primary Should the button have the `button-primary` class?
	 * @return string              Returns the HTML markup for the button.
	 */
	function build_sso_button( $args = array(), $is_primary = false ) {
		$url = $this->build_sso_button_url( $args );
		$classes = $is_primary
			? 'jetpack-sso button button-primary'
			: 'jetpack-sso button';

		return sprintf(
			'<a rel="nofollow" href="%1$s" class="%2$s"><span>%3$s %4$s</span></a>',
			esc_url( $url ),
			$classes,
			'<span class="genericon genericon-wordpress"></span>',
			esc_html__( 'Log in with WordPress.com', 'jetpack' )
		);
	}

	/**
	 * Builds a URL with `jetpack-sso` action and option args which is used to setup SSO.
	 *
	 * @param  array  $args An array of arguments to add to the SSO URL.
	 * @return string       The URL used for SSO.
	 */
	function build_sso_button_url( $args = array() ) {
		$defaults = array(
			'action'  => 'jetpack-sso',
		);

		$args = wp_parse_args( $args, $defaults );

		if ( ! empty( $_GET['redirect_to'] ) ) {
			$args['redirect_to'] = urlencode( esc_url_raw( $_GET['redirect_to'] ) );
		}

		return add_query_arg( $args, wp_login_url() );
	}

	/**
	 * Retrieves a WordPress.com SSO URL with appropriate query parameters or dies.
	 *
	 * @param  boolean  $reauth  Should the user be forced to reauthenticate on WordPress.com?
	 * @param  array    $args    Optional query parameters.
	 * @return string            The WordPress.com SSO URL.
	 */
	function get_sso_url_or_die( $reauth = false, $args = array() ) {
		if ( empty( $reauth ) ) {
			$sso_redirect = $this->build_sso_url( $args );
		} else {
			self::clear_wpcom_profile_cookies();
			$sso_redirect = $this->build_reauth_and_sso_url( $args );
		}

		// If there was an error retrieving the SSO URL, then error.
		if ( is_wp_error( $sso_redirect ) ) {
			$error_message = sanitize_text_field(
				sprintf( '%s: %s', $sso_redirect->get_error_code(), $sso_redirect->get_error_message() )
			);
			JetpackTracking::record_user_event( 'sso_login_redirect_failed', array(
				'error_message' => $error_message
			) );
			wp_die( $error_message );
		}

		return $sso_redirect;
	}

	/**
	 * Build WordPress.com SSO URL with appropriate query parameters.
	 *
	 * @param  array  $args Optional query parameters.
	 * @return string       WordPress.com SSO URL
	 */
	function build_sso_url( $args = array() ) {
		$sso_nonce = ! empty( $args['sso_nonce'] ) ? $args['sso_nonce'] : self::request_initial_nonce();
		$defaults = array(
			'action'       => 'jetpack-sso',
			'site_id'      => Jetpack_Options::get_option( 'id' ),
			'sso_nonce'    => $sso_nonce,
			'calypso_auth' => '1',
		);

		$args = wp_parse_args( $args, $defaults );

		if ( is_wp_error( $args['sso_nonce'] ) ) {
			return $args['sso_nonce'];
		}

		return add_query_arg( $args, 'https://wordpress.com/wp-login.php' );
	}

	/**
	 * Build WordPress.com SSO URL with appropriate query parameters,
	 * including the parameters necessary to force the user to reauthenticate
	 * on WordPress.com.
	 *
	 * @param  array  $args Optional query parameters.
	 * @return string       WordPress.com SSO URL
	 */
	function build_reauth_and_sso_url( $args = array() ) {
		$sso_nonce = ! empty( $args['sso_nonce'] ) ? $args['sso_nonce'] : self::request_initial_nonce();
		$redirect = $this->build_sso_url( array( 'force_auth' => '1', 'sso_nonce' => $sso_nonce ) );

		if ( is_wp_error( $redirect ) ) {
			return $redirect;
		}

		$defaults = array(
			'action'       => 'jetpack-sso',
			'site_id'      => Jetpack_Options::get_option( 'id' ),
			'sso_nonce'    => $sso_nonce,
			'reauth'       => '1',
			'redirect_to'  => urlencode( $redirect ),
			'calypso_auth' => '1',
		);

		$args = wp_parse_args( $args, $defaults );

		if ( is_wp_error( $args['sso_nonce'] ) ) {
			return $args['sso_nonce'];
		}

		return add_query_arg( $args, 'https://wordpress.com/wp-login.php' );
	}

	/**
	 * Determines local user associated with a given WordPress.com user ID.
	 *
	 * @since 2.6.0
	 *
	 * @param int $wpcom_user_id User ID from WordPress.com
	 * @return object Local user object if found, null if not.
	 */
	static function get_user_by_wpcom_id( $wpcom_user_id ) {
		$user_query = new WP_User_Query( array(
			'meta_key'   => 'wpcom_user_id',
			'meta_value' => intval( $wpcom_user_id ),
			'number'     => 1,
		) );

		$users = $user_query->get_results();
		return $users ? array_shift( $users ) : null;
	}

	/**
	 * Error message displayed on the login form when two step is required and
	 * the user's account on WordPress.com does not have two step enabled.
	 *
	 * @since 2.7
	 * @param string $message
	 * @return string
	 **/
	public function error_msg_enable_two_step( $message ) {
		$error = sprintf(
			wp_kses(
				__(
					'Two-Step Authentication is required to access this site. Please visit your <a href="%1$s" target="_blank">Security Settings</a> to configure <a href="%2$S" target="_blank">Two-step Authentication</a> for your account.',
					'jetpack'
				),
				array(  'a' => array( 'href' => array() ) )
			),
			'https://wordpress.com/me/security/two-step',
			'https://support.wordpress.com/security/two-step-authentication/'
		);

		$message .= sprintf( '<p class="message" id="login_error">%s</p>', $error );

		return $message;
	}

	/**
	 * Error message displayed when the user tries to SSO, but match by email
	 * is off and they already have an account with their email address on
	 * this site.
	 *
	 * @param string $message
	 * @return string
	 */
	public function error_msg_email_already_exists( $message ) {
		$error = sprintf(
			wp_kses(
				__(
					'You already have an account on this site. Please <a href="%1$s">sign in</a> with your username and password and then connect to WordPress.com.',
					'jetpack'
				),
				array(  'a' => array( 'href' => array() ) )
			),
			esc_url_raw( add_query_arg( 'jetpack-sso-show-default-form', '1', wp_login_url() ) )
		);

		$message .= sprintf( '<p class="message" id="login_error">%s</p>', $error );

		return $message;
	}

	/**
	 * Builds the translation ready string that is to be used when the site hides the default login form.
	 *
	 * @since 4.1.0
	 * @return string
	 */
	public function get_sso_required_message() {
		$msg = esc_html__( 'A WordPress.com account is required to access this site. Click the button below to sign in or create a free WordPress.com account.', 'jetpack' );

		/**
		 * Filter the message displayed when the default WordPress login form is disabled.
		 *
		 * @module sso
		 *
		 * @since 2.8.0
		 *
		 * @param string $msg Disclaimer when default WordPress login form is disabled.
		 */
		return apply_filters( 'jetpack_sso_disclaimer_message', $msg );
	}

	/**
	 * Message displayed when the site admin has disabled the default WordPress
	 * login form in Settings > General > Single Sign On
	 *
	 * @since 2.7
	 * @param string $message
	 *
	 * @return string
	 **/
	public function msg_login_by_jetpack( $message ) {
		$msg = $this->get_sso_required_message();

		if ( empty( $msg ) ) {
			return $message;
		}

		$message .= sprintf( '<p class="message">%s</p>', $msg );
		return $message;
	}

	/**
	 * Message displayed when the user can not be found after approving the SSO process on WordPress.com
	 *
	 * @param string $message
	 * @return string
	 */
	function cant_find_user( $message ) {
		$error = esc_html__(
			"We couldn't find your account. If you already have an account, make sure you have connected to WordPress.com.",
			'jetpack'
		);
		$message .= sprintf( '<p class="message" id="login_error">%s</p>', $error );

		return $message;
	}

	/**
	 * When jetpack-sso-auth-redirect query parameter is set, will redirect user to
	 * WordPress.com authorization flow.
	 *
	 * We redirect here instead of in handle_login() because Jetpack::init()->build_connect_url
	 * calls menu_page_url() which doesn't work properly until admin menus are registered.
	 */
	function maybe_authorize_user_after_sso() {
		if ( empty( $_GET['jetpack-sso-auth-redirect'] ) ) {
			return;
		}

		$redirect_to = ! empty( $_GET['redirect_to'] ) ? esc_url_raw( $_GET['redirect_to'] ) : admin_url();
		$request_redirect_to = ! empty( $_GET['request_redirect_to'] ) ? esc_url_raw( $_GET['request_redirect_to'] ) : $redirect_to;

		/** This filter is documented in core/src/wp-login.php */
		$redirect_after_auth = apply_filters( 'login_redirect', $redirect_to, $request_redirect_to, wp_get_current_user() );

		/**
		 * Since we are passing this redirect to WordPress.com and therefore can not use wp_safe_redirect(),
		 * let's sanitize it here to make sure it's safe. If the redirect is not safe, then use admin_url().
		 */
		$redirect_after_auth = wp_sanitize_redirect( $redirect_after_auth );
		$redirect_after_auth = wp_validate_redirect( $redirect_after_auth, admin_url() );

		/**
		 * Return the raw connect URL with our redirect and attribute connection to SSO.
		 */
		$connect_url = Jetpack::init()->build_connect_url( true, $redirect_after_auth, 'sso' );

		add_filter( 'allowed_redirect_hosts', array( $this, 'allowed_redirect_hosts' ) );
		wp_safe_redirect( $connect_url );
		exit;
	}

	/**
	 * Cache user's display name and Gravatar so it can be displayed on the login screen. These cookies are
	 * stored when the user logs out, and then deleted when the user logs in.
	 */
	function store_wpcom_profile_cookies_on_logout() {
		if ( ! Jetpack::is_user_connected( get_current_user_id() ) ) {
			return;
		}

		$user_data = $this->get_user_data( get_current_user_id() );
		if ( ! $user_data ) {
			return;
		}

		setcookie(
			'jetpack_sso_wpcom_name_' . COOKIEHASH,
			$user_data->display_name,
			time() + WEEK_IN_SECONDS,
			COOKIEPATH,
			COOKIE_DOMAIN
		);

		setcookie(
			'jetpack_sso_wpcom_gravatar_' . COOKIEHASH,
			get_avatar_url(
				$user_data->email,
				array( 'size' => 144, 'default' => 'mystery' )
			),
			time() + WEEK_IN_SECONDS,
			COOKIEPATH,
			COOKIE_DOMAIN
		);
	}

	/**
	 * Determines if a local user is connected to WordPress.com
	 *
	 * @since 2.8
	 * @param integer $user_id - Local user id
	 * @return boolean
	 **/
	public function is_user_connected( $user_id ) {
		return $this->get_user_data( $user_id );
	}

	/**
	 * Retrieves a user's WordPress.com data
	 *
	 * @since 2.8
	 * @param integer $user_id - Local user id
	 * @return mixed null or stdClass
	 **/
	public function get_user_data( $user_id ) {
		return get_user_meta( $user_id, 'wpcom_user_data', true );
	}
}

Jetpack_SSO::get_instance();
