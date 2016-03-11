<?php

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

		add_action( 'admin_init',  array( $this, 'admin_init' ) );
		add_action( 'admin_init',  array( $this, 'register_settings' ) );
		add_action( 'login_init',  array( $this, 'login_init' ) );
		add_action( 'delete_user', array( $this, 'delete_connection_for_user' ) );
		add_filter( 'jetpack_xmlrpc_methods', array( $this, 'xmlrpc_methods' ) );
		add_action( 'init', array( $this, 'maybe_logout_user' ), 5 );
		add_action( 'jetpack_modules_loaded', array( $this, 'module_configure_button' ) );

		// Adding this action so that on login_init, the action won't be sanitized out of the $action global.
		add_action( 'login_form_jetpack-sso', '__return_true' );

		if (
			$this->should_hide_login_form() &&
			/**
			 * Filter the display of the disclaimer message appearing when default WordPress login form is disabled.
			 *
			 * @module sso
			 *
			 * @since 2.8.0
			 *
			 * @param bool true Should the disclaimer be displayed. Default to true.
			 */
			apply_filters( 'jetpack_sso_display_disclaimer', true )
		) {
			add_action( 'login_message', array( $this, 'msg_login_by_jetpack' ) );
		}
	}

	/**
	 * Returns the single instance of the Jetpack_SSO object
	 *
	 * @since 2.8
	 * @return Jetpack_SSO
	 **/
	public static function get_instance() {
		if( !is_null( self::$instance ) )
			return self::$instance;

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

	public static function module_configuration_load() {
		// wp_safe_redirect( admin_url( 'options-general.php#configure-sso' ) );
		// exit;
	}

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
	 * If jetpack_force_logout == 1 in current user meta the user will be forced
	 * to logout and reauthenticate with the site.
	 **/
	public function maybe_logout_user() {
		global $current_user;

		if( 1 == $current_user->jetpack_force_logout ) {
			delete_user_meta( $current_user->ID, 'jetpack_force_logout' );
			self::delete_connection_for_user( $current_user->ID );
			wp_logout();
			wp_safe_redirect( wp_login_url() );
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
				'meta_value' => $user_id
			)
		);
		$user = $user_query->get_results();
		$user = $user[0];


		if( $user instanceof WP_User ) {
			$user = wp_set_current_user( $user->ID );
			update_user_meta( $user->ID, 'jetpack_force_logout', '1' );
			self::delete_connection_for_user( $user->ID );
			return true;
		}
		return false;
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
		 * Checkbox for Remove default login form
		 */
		 /* Hide in 2.9
		register_setting(
			'general',
			'jetpack_sso_remove_login_form',
			array( $this, 'validate_settings_remove_login_form_checkbox' )
		);

		add_settings_field(
			'jetpack_sso_remove_login_form',
			__( 'Remove default login form?' , 'jetpack' ),
			array( $this, 'render_remove_login_form_checkbox' ),
			'general',
			'jetpack_sso_settings'
		);
		*/

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
		/** This filter is documented in modules/sso.php */
		$require_two_step = 1 == apply_filters( 'jetpack_sso_require_two_step', get_option( 'jetpack_sso_require_two_step' ) );
		$disabled = $require_two_step ? ' disabled="disabled"' : '';
		echo '<label>';
		echo '<input type="checkbox" name="jetpack_sso_require_two_step" ' . checked( $require_two_step, true, false ) . "$disabled>";
		esc_html_e( 'Require Two-Step Authentication' , 'jetpack' );
		echo '</label>';
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
		$match_by_email = 1 == $this->match_by_email();
		$disabled = $match_by_email ? ' disabled="disabled"' : '';
		echo '<label>';
		echo '<input type="checkbox" name="jetpack_sso_match_by_email"' . checked( $match_by_email, true, false ) . "$disabled>";
		esc_html_e( 'Match by Email', 'jetpack' );
		echo '</label>';
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
	 * Builds the display for the checkbox allowing users to remove the default
	 * WordPress login form from wp-login.php. Displays in Settings > General
	 *
	 * @since 2.7
	 **/
	public function render_remove_login_form_checkbox() {
		if( $this->is_user_connected( get_current_user_id() ) ) {
			echo '<a name="configure-sso"></a>';
			echo '<input type="checkbox" name="jetpack_sso_remove_login_form[remove_login_form]" ' . checked( 1 == get_option( 'jetpack_sso_remove_login_form' ), true, false ) . '>';
			echo '<p class="description">Removes default login form and disallows login via POST</p>';
		} else {
			echo 'Your account must be connected to WordPress.com before disabling the login form.';
			echo '<br/>' . $this->button();
		}
	}

	/**
	 * Validate settings input from Settings > General
	 *
	 * @since 2.7
	 * @return boolean
	 **/
	public function validate_settings_remove_login_form_checkbox( $input ) {
		return ( isset( $input['remove_login_form'] ) )? 1: 0;
	}

	/**
	 * Removes 'Lost your password?' text from the login form if user
	 * does not want to show the login form
	 *
	 * @since 2.7
	 * @return string
	 **/
	public function remove_lost_password_text( $text ) {
		if( 'Lost your password?' == $text )
			$text = '';
		return $text;
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
		$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : 'login';

		// And now the exceptions
		$action = isset( $_GET['loggedout'] ) ? 'loggedout' : $action;

		if( 'login' == $action ) {
			$wants_to_login = true;
		}

		return $wants_to_login;
	}

	private function bypass_login_forward_wpcom() {
		/**
		 * Redirect the site's log in form to WordPress.com's log in form.
		 *
		 * @module sso
		 *
		 * @since 3.1.0
		 *
		 * @param bool false Should the site's log in form be automatically forwarded to WordPress.com's log in form.
		 */
		return apply_filters( 'jetpack_sso_bypass_login_forward_wpcom', false );
	}

	function login_init() {
		global $action;

		/**
 		 * If the user is attempting to logout AND the auto-forward to WordPress.com
 		 * login is set then we need to ensure we do not auto-forward the user and get
 		 * them stuck in an infinite logout loop.
 		 */
 		if( isset( $_GET['loggedout'] ) && $this->bypass_login_forward_wpcom() ) {
 			add_filter( 'jetpack_remove_login_form', '__return_true' );
 			add_filter( 'gettext', array( $this, 'remove_lost_password_text' ) );
		}

		/**
		 * Check to see if the site admin wants to automagically forward the user
		 * to the WordPress.com login page AND  that the request to wp-login.php
		 * is not something other than login (Like logout!)
		 */
		if (
			$this->wants_to_login()
			&& $this->bypass_login_forward_wpcom()
		) {
			add_filter( 'allowed_redirect_hosts', array( $this, 'allowed_redirect_hosts' ) );
			$this->maybe_save_cookie_redirect();
			wp_safe_redirect( $this->build_sso_url() );
		}

		if ( 'login' === $action ) {
			wp_enqueue_script( 'jquery' );
			wp_enqueue_style( 'genericons' );
			add_action( 'login_footer', array( $this, 'login_form' ) );
			add_action( 'login_footer', array( $this, 'login_footer' ) );
/*
			if ( get_option( 'jetpack_sso_remove_login_form' ) ) {
				// Check to see if the user is attempting to login via the default login form.
				// If so we need to deny it and forward elsewhere.
				if( isset( $_REQUEST['wp-submit'] ) && 'Log In' == $_REQUEST['wp-submit'] ) {
					wp_die( 'Login not permitted by this method. ');
				}
				add_filter( 'gettext', array( $this, 'remove_lost_password_text' ) );
			}
*/
		} elseif ( 'jetpack-sso' === $action ) {
			if ( isset( $_GET['result'], $_GET['user_id'], $_GET['sso_nonce'] ) && 'success' == $_GET['result'] ) {
				$this->handle_login();
				wp_enqueue_script( 'jquery' );
				wp_enqueue_style( 'genericons' );
				add_action( 'login_footer', array( $this, 'login_form' ) );
				add_action( 'login_footer', array( $this, 'login_footer' ) );
			} else {
				if ( Jetpack::check_identity_crisis() ) {
					wp_die( __( "Error: This site's Jetpack connection is currently experiencing problems.", 'jetpack' ) );
				} else {
					$this->maybe_save_cookie_redirect();
					// Is it wiser to just use wp_redirect than do this runaround to wp_safe_redirect?
					add_filter( 'allowed_redirect_hosts', array( $this, 'allowed_redirect_hosts' ) );
					wp_safe_redirect( $this->build_sso_url() );
				}
			}
		}
	}

	/**
	 * Conditionally save the redirect_to url as a cookie.
	 */
	public static function maybe_save_cookie_redirect() {
		if ( headers_sent() ) {
			return new WP_Error( 'headers_sent', __( 'Cannot deal with cookie redirects, as headers are already sent.', 'jetpack' ) );
		}

		// If we have something to redirect to
		if ( ! empty( $_GET['redirect_to'] ) ) {
			$url = esc_url_raw( $_GET['redirect_to'] );
			setcookie( 'jetpack_sso_redirect_to', $url, time() + HOUR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, false, true );
		// Otherwise, if it's already set
		} elseif ( ! empty( $_COOKIE['jetpack_sso_redirect_to'] ) ) {
			// Purge it.
			setcookie( 'jetpack_sso_redirect_to', ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
		}

		if ( ! empty( $_GET['rememberme'] ) ) {
			setcookie( 'jetpack_sso_remember_me', '1', time() + HOUR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, false, true );
		} elseif ( ! empty( $_COOKIE['jetpack_sso_remember_me'] ) ) {
			setcookie( 'jetpack_sso_remember_me', ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
		}
	}

	/**
	 * Determine if the login form should be hidden or not
	 *
	 * Method is private only because it is only used in this class so far.
	 * Feel free to change it later
	 *
	 * @return bool
	 **/
	private function should_hide_login_form() {
		/**
		 * Remove the default log in form, only leave the WordPress.com log in button.
		 *
		 * @module sso
		 *
		 * @since 3.1.0
		 *
		 * @param bool get_option( 'jetpack_sso_remove_login_form', false ) Should the default log in form be removed. Default to false.
		 */
		return apply_filters( 'jetpack_remove_login_form', get_option( 'jetpack_sso_remove_login_form', false ) );
	}

	function login_form() {
		$classes = '';

		if( $this->should_hide_login_form() ) {
			$classes .= ' forced-sso';
		}
		echo '<div class="jetpack-sso-wrap' . $classes . '">' . $this->button() . '</div>';
	}

	function login_footer() {
		$hide_login_form = $this->should_hide_login_form();
		?>
		<style>
			#loginform {
				overflow: hidden;
				padding-bottom: 26px;
			}
			.jetpack-sso-wrap {
				<?php if ( $hide_login_form ) : ?>
					text-align: center;
				<?php else : ?>
					float: right;
				<?php endif; ?>
				margin: 1em 0 0;
				clear: right;
				display: block;
			}

			<?php if ( $hide_login_form ) : ?>
			.forced-sso .jetpack-sso.button {
				font-size: 16px;
				line-height: 27px;
				height: 37px;
				padding: 5px 12px 6px 47px;
			}
			.forced-sso .jetpack-sso.button:before {
				font-size: 28px !important;
				height: 37px;
				padding: 5px 5px 4px;
				width: 37px;
			}
			<?php endif; ?>
		</style>
		<script>
			jQuery(document).ready(function($){
			<?php if ( $hide_login_form ) : ?>
				$( '#loginform' ).empty();
			<?php endif; ?>
				$( '#loginform' ).append( $( '.jetpack-sso-wrap' ) );

				var $rememberme = $( '#rememberme' ),
					$ssoButton  = $( 'a.jetpack-sso.button' );

				$rememberme.on( 'change', function() {
					var url       = $ssoButton.prop( 'href' ),
						isChecked = $rememberme.prop( 'checked' ) ? 1 : 0;

					if ( url.match( /&rememberme=\d/ ) ) {
						url = url.replace( /&rememberme=\d/, '&rememberme=' + isChecked );
					} else {
						url += '&rememberme=' + isChecked;
					}

					$ssoButton.prop( 'href', url );
				} ).change();

			});
		</script>
		<?php
	}

	static function delete_connection_for_user( $user_id ) {
		if ( ! $wpcom_user_id = get_user_meta( $user_id, 'wpcom_user_id', true ) ) {
			return;
		}
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => $user_id
		) );
		$xml->query( 'jetpack.sso.removeUser', $wpcom_user_id );

		if ( $xml->isError() ) {
			return false;
		}

		return $xml->getResponse();
	}

	static function request_initial_nonce() {
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id()
		) );
		$xml->query( 'jetpack.sso.requestNonce' );

		if ( $xml->isError() ) {
			wp_die( sprintf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() ) );
		}

		return $xml->getResponse();
	}

	/**
	 * The function that actually handles the login!
	 */
	function handle_login() {
		$wpcom_nonce   = sanitize_key( $_GET['sso_nonce'] );
		$wpcom_user_id = (int) $_GET['user_id'];
		$result        = sanitize_key( $_GET['result'] );

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id()
		) );
		$xml->query( 'jetpack.sso.validateResult', $wpcom_nonce, $wpcom_user_id );

		if ( $xml->isError() ) {
			wp_die( sprintf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() ) );
		}

		$user_data = $xml->getResponse();

		if ( empty( $user_data ) ) {
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
		 * @param object $user_data User login information.
		 */
		do_action( 'jetpack_sso_pre_handle_login', $user_data );

		/**
		 * Is it required to have 2-step authentication enabled on WordPress.com to use SSO?
		 *
		 * @module sso
		 *
		 * @since 2.8.0
		 *
		 * @param bool get_option( 'jetpack_sso_require_two_step' ) Does SSO require 2-step authentication?
		 */
		$require_two_step = apply_filters( 'jetpack_sso_require_two_step', get_option( 'jetpack_sso_require_two_step' ) );
		if( $require_two_step && 0 == (int) $user_data->two_step_enabled ) {
			$this->user_data = $user_data;
			/** This filter is documented in core/src/wp-includes/pluggable.php */
			do_action( 'wp_login_failed', $user_data->login );
			add_action( 'login_message', array( $this, 'error_msg_enable_two_step' ) );
			return;
		}

		if ( isset( $_GET['state'] ) && ( 0 < strpos( $_GET['state'], '|' ) ) ) {
			list( $state, $nonce ) = explode( '|', $_GET['state'] );

			if ( wp_verify_nonce( $nonce, $state ) ) {
				if ( 'sso-link-user' == $state ) {
					$user = wp_get_current_user();
					update_user_meta( $user->ID, 'wpcom_user_id', $user_data->ID );
					add_filter( 'login_redirect', array( __CLASS__, 'profile_page_url' ) );
				}
			} else wp_nonce_ays();
		}

		if ( empty( $user ) ) {
			$user = $this->get_user_by_wpcom_id( $user_data->ID );
		}

		// If we don't have one by wpcom_user_id, try by the email?
		if ( empty( $user ) && self::match_by_email() ) {
			$user = get_user_by( 'email', $user_data->email );
			if ( $user ) {
				update_user_meta( $user->ID, 'wpcom_user_id', $user_data->ID );
			}
		}

		// If we've still got nothing, create the user.
		if ( empty( $user ) && ( get_option( 'users_can_register' ) || self::new_user_override() ) ) {
			// If not matching by email we still need to verify the email does not exist
			// or this blows up
			/**
			 * If match_by_email is true, we know the email doesn't exist, as it would have
			 * been found in the first pass.  If get_user_by( 'email' ) doesn't find the
			 * user, then we know that email is unused, so it's safe to add.
			 */
			if ( self::match_by_email() || ! get_user_by( 'email', $user_data->email ) ) {
				$username = $user_data->login;

				if ( username_exists( $username ) ) {
					$username = $user_data->login . '_' . $user_data->ID;
				}

				$tries = 0;
				while ( username_exists( $username ) ) {
					$username = $user_data->login . '_' . $user_data->ID . '_' . mt_rand();
					if ( $tries++ >= 5 ) {
						wp_die( __( "Error: Couldn't create suitable username.", 'jetpack' ) );
					}
				}

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
				$this->user_data = $user_data;
				// do_action( 'wp_login_failed', $user_data->login );
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
		 * @param array $user WordPress.com User information.
		 * @param object $user_data User Login information.
		 */
		do_action( 'jetpack_sso_handle_login', $user, $user_data );

		if ( $user ) {
			// Cache the user's details, so we can present it back to them on their user screen.
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

			$_request_redirect_to = isset( $_REQUEST['redirect_to'] ) ? $_REQUEST['redirect_to'] : '';
			$redirect_to = user_can( $user, 'edit_posts' ) ? admin_url() : self::profile_page_url();

			// If we have a saved redirect to request in a cookie
			if ( ! empty( $_COOKIE['jetpack_sso_redirect_to'] ) ) {
				// Set that as the requested redirect to
				$redirect_to = $_request_redirect_to = esc_url_raw( $_COOKIE['jetpack_sso_redirect_to'] );
				// And then purge it
				setcookie( 'jetpack_sso_redirect_to', ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
			}

			wp_safe_redirect(
				/** This filter is documented in core/src/wp-login.php */
				apply_filters( 'login_redirect', $redirect_to, $_request_redirect_to, $user )
			);
			exit;
		}

		$this->user_data = $user_data;
		/** This filter is documented in core/src/wp-includes/pluggable.php */
		do_action( 'wp_login_failed', $user_data->login );
		add_action( 'login_message', array( $this, 'cant_find_user' ) );
	}

	static function profile_page_url() {
		return admin_url( 'profile.php' );
	}

	static function match_by_email() {
		$match_by_email = ( 1 == get_option( 'jetpack_sso_match_by_email', true ) ) ? true: false;
		$match_by_email = defined( 'WPCC_MATCH_BY_EMAIL' ) ? WPCC_MATCH_BY_EMAIL : $match_by_email;

		/**
		 * Link the local account to an account on WordPress.com using the same email address.
		 *
		 * @module sso
		 *
		 * @since 2.6.0
		 *
		 * @param bool $match_by_email Should we link the local account to an account on WordPress.com using the same email address. Default to false.
		 */
		return apply_filters( 'jetpack_sso_match_by_email', $match_by_email );
	}

	static function new_user_override() {
		$new_user_override = defined( 'WPCC_NEW_USER_OVERRIDE' ) ? WPCC_NEW_USER_OVERRIDE : false;

		/**
		 * Allow users to register on your site with a WordPress.com account, even though you disallow normal registrations.
		 *
		 * @module sso
		 *
		 * @since 2.6.0
		 *
		 * @param bool $new_user_override Allow users to register on your site with a WordPress.com account. Default to false.
		 */
		return apply_filters( 'jetpack_sso_new_user_override', $new_user_override );
	}

	function allowed_redirect_hosts( $hosts ) {
		if ( empty( $hosts ) ) {
			$hosts = array();
		}
		$hosts[] = 'wordpress.com';

		return array_unique( $hosts );
	}

	function button( $args = array() ) {
		$defaults = array(
			'action'  => 'jetpack-sso',
		);

		$args = wp_parse_args( $args, $defaults );

		if ( ! empty( $_GET['redirect_to'] ) ) {
			$args['redirect_to'] = esc_url_raw( $_GET['redirect_to'] );
		}

		$url  = add_query_arg( $args, wp_login_url() );

		$css = "<style>
		.jetpack-sso.button {
			position: relative;
			padding-left: 37px;
		}
		.jetpack-sso.button:before {
			display: block;
			box-sizing: border-box;
			padding: 7px 0 0;
			text-align: center;
			position: absolute;
			top: -1px;
			left: -1px;
			border-radius: 2px 0 0 2px;
			content: '\\f205';
			background: #0074a2;
			color: #fff;
			-webkit-font-smoothing: antialiased;
			width: 30px;
			height: 107%;
			height: calc( 100% + 2px );
			font: normal 22px/1 Genericons !important;
			text-shadow: none;
		}
		@media screen and (min-width: 783px) {
			.jetpack-sso.button:before {
				padding-top: 3px;
			}
		}
		.jetpack-sso.button:hover {
			border: 1px solid #aaa;
		}";

		if ( version_compare( $GLOBALS['wp_version'], '3.8-alpha', '<' ) ) {
			$css .= "
			.jetpack-sso.button:before {
				width: 25px;
				font-size: 18px !important;
			}
			";
		}

		$css .= "</style>";

		$button = sprintf( '<a href="%1$s" class="jetpack-sso button">%2$s</a>', esc_url( $url ), esc_html__( 'Log in with WordPress.com', 'jetpack' ) );
		return $button . $css;
	}

	function build_sso_url( $args = array() ) {
		$defaults = array(
			'action'    => 'jetpack-sso',
			'site_id'   => Jetpack_Options::get_option( 'id' ),
			'sso_nonce' => self::request_initial_nonce(),
		);

		if ( isset( $_GET['state'] ) && check_admin_referer( $_GET['state'] ) ) {
			$defaults['state'] = rawurlencode( $_GET['state'] . '|' . $_GET['_wpnonce'] );
		}

		$args = wp_parse_args( $args, $defaults );
		$url  = add_query_arg( $args, 'https://wordpress.com/wp-login.php' );

		return $url;
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
		$err = __( sprintf( 'This site requires two step authentication be enabled for your user account on WordPress.com. Please visit the <a href="%1$s"> Security Settings</a> page to enable two step', 'https://wordpress.com/me/security/two-step' ) , 'jetpack' );

		$message .= sprintf( '<p class="message" id="login_error">%s</p>', $err );

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
		$err = __( sprintf( 'You already have an account on this site. Please visit your <a href="%1$s">profile page</a> page to link your account to WordPress.com!', admin_url( 'profile.php' ) ) , 'jetpack' );

		$message .= sprintf( '<p class="message" id="login_error">%s</p>', $err );

		return $message;
	}

	/**
	 * Message displayed when the site admin has disabled the default WordPress
	 * login form in Settings > General > Single Sign On
	 *
	 * @since 2.7
	 * @param string $message
	 * @return string
	 **/
	public function msg_login_by_jetpack( $message ) {

		$msg = __( sprintf( 'Jetpack authenticates through WordPress.com — to log in, enter your WordPress.com username and password, or <a href="%1$s">visit WordPress.com</a> to create a free account now.', 'http://wordpress.com/signup' ) , 'jetpack' );

		/**
		 * Filter the message displayed when the default WordPress login form is disabled.
		 *
		 * @module sso
		 *
		 * @since 2.8.0
		 *
		 * @param string $msg Disclaimer when default WordPress login form is disabled.
		 */
		$msg = apply_filters( 'jetpack_sso_disclaimer_message', $msg );

		$message .= sprintf( '<p class="message">%s</p>', $msg );
		return $message;
	}

	/**
	 * Error message displayed on the login form when the user attempts
	 * to post to the login form and it is disabled.
	 *
	 * @since 2.8
	 * @param string $message
	 * @param string
	 **/
	public function error_msg_login_method_not_allowed( $message ) {
		$err = __( 'Login method not allowed' , 'jetpack' );
		$message .= sprintf( '<p class="message" id="login_error">%s</p>', $err );

		return $message;
	}
	function cant_find_user( $message ) {
		if ( self::match_by_email() ) {
			$err_format = __( 'We couldn\'t find an account with the email <strong><code>%1$s</code></strong> to log you in with.  If you already have an account on <strong>%2$s</strong>, please make sure that <strong><code>%1$s</code></strong> is configured as the email address, or that you have connected to WordPress.com on your profile page.', 'jetpack' );
		} else {
			$err_format = __( 'We couldn\'t find any account on <strong>%2$s</strong> that is linked to your WordPress.com account to log you in with.  If you already have an account on <strong>%2$s</strong>, please make sure that you have connected to WordPress.com on your profile page.', 'jetpack' );
		}
		$err = sprintf( $err_format, $this->user_data->email, get_bloginfo( 'name' ) );
		$message .= sprintf( '<p class="message" id="login_error">%s</p>', $err );
		return $message;
	}

	/**
	 * Deal with user connections...
	 */
	function admin_init() {
		add_action( 'show_user_profile', array( $this, 'edit_profile_fields' ) ); // For their own profile
		add_action( 'edit_user_profile', array( $this, 'edit_profile_fields' ) ); // For folks editing others profiles

		if ( isset( $_GET['jetpack_sso'] ) && 'purge' == $_GET['jetpack_sso'] && check_admin_referer( 'jetpack_sso_purge' ) ) {
			$user = wp_get_current_user();
			// Remove the connection on the wpcom end.
			self::delete_connection_for_user( $user->ID );
			// Clear it locally.
			delete_user_meta( $user->ID, 'wpcom_user_id' );
			delete_user_meta( $user->ID, 'wpcom_user_data' );
			// Forward back to the profile page.
			wp_safe_redirect( remove_query_arg( array( 'jetpack_sso', '_wpnonce' ) ) );
		}
	}

	/**
	 * Determines if a local user is connected to WordPress.com
	 *
	 * @since 2.8
	 * @param integer $user_id - Local user id
	 * @return boolean
	 **/
	public function is_user_connected( $user_id ) {
		return $this->get_user_data( $user_id ) ;
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

	function edit_profile_fields( $user ) {
		wp_enqueue_style( 'genericons' );
		?>

		<h3 id="single-sign-on"><?php _e( 'Single Sign On', 'jetpack' ); ?></h3>
		<p><?php _e( 'Connecting with Single Sign On enables you to log in via your WordPress.com account.', 'jetpack' ); ?></p>

		<?php if ( $this->is_user_connected( $user->ID ) ) : /* If the user is currently connected... */ ?>
			<?php $user_data = $this->get_user_data( $user->ID ); ?>
			<table class="form-table jetpack-sso-form-table">
				<tbody>
					<tr>
						<td>
							<div class="profile-card">
								<?php echo get_avatar( $user_data->email ); ?>
								<p class="connected"><strong><?php _e( 'Connected', 'jetpack' ); ?></strong></p>
								<p><?php echo esc_html( $user_data->login ); ?></p>
								<span class="two_step">
									<?php
										if( $user_data->two_step_enabled ) {
											?> <p class="enabled"><a href="https://wordpress.com/me/security/two-step"><?php _e( 'Two-Step Authentication Enabled', 'jetpack' ); ?></a></p> <?php
										} else {
											?> <p class="disabled"><a href="https://wordpress.com/me/security/two-step"><?php _e( 'Two-Step Authentication Disabled', 'jetpack' ); ?></a></p> <?php
										}
									?>
								</span>

							</div>
							<p><a class="button button-secondary" href="<?php echo esc_url( wp_nonce_url( add_query_arg( 'jetpack_sso', 'purge' ), 'jetpack_sso_purge' ) ); ?>"><?php _e( 'Unlink This Account', 'jetpack' ); ?></a></p>
						</td>
					</tr>
				</tbody>
			</table>

			<style>
			.jetpack-sso-form-table td {
				padding-left: 0;
			}

			.jetpack-sso-form-table .profile-card {
				padding: 10px;
				background: #fff;
				overflow: hidden;
				max-width: 400px;
				box-shadow: 0 1px 2px rgba( 0, 0, 0, 0.1 );
				margin-bottom: 1em;
			}

			.jetpack-sso-form-table .profile-card img {
				float: left;
				margin-right: 1em;
				width: 48px;
				height: 48px;
			}

			.jetpack-sso-form-table .profile-card .connected {
				float: right;
				margin-right: 0.5em;
				color: #0a0;
			}

			.jetpack-sso-form-table .profile-card p {
				margin-top: 0.7em;
				font-size: 1.2em;
			}

			.jetpack-sso-form-table .profile-card .two_step .enabled a {
				float: right;
				color: #0a0;
			}

			.jetpack-sso-form-table .profile-card .two_step .disabled a {
				float: right;
				color: red;
			}
			</style>

		<?php elseif ( get_current_user_id() == $user->ID && Jetpack::is_user_connected( $user->ID ) ) : ?>

			<?php echo $this->button( 'state=sso-link-user&_wpnonce=' . wp_create_nonce('sso-link-user') ); // update ?>

		<?php else : ?>

			<p><?php esc_html_e( wptexturize( __( "If you don't have a WordPress.com account yet, you can sign up for free in just a few seconds.", 'jetpack' ) ) ); ?></p>
			<a href="<?php echo Jetpack::init()->build_connect_url( false, get_edit_profile_url( get_current_user_id() ) . '#single-sign-on' ); ?>" class="button button-connector" id="wpcom-connect"><?php esc_html_e( 'Link account with WordPress.com', 'jetpack' ); ?></a>

		<?php endif;
	}
}

Jetpack_SSO::get_instance();
