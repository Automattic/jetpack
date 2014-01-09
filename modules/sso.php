<?php

/**
 * Module Name: Jetpack Single Sign On
 * Module Description: Let users login with their WordPress.com Credentials
 * Sort Order: 50
 * First Introduced: 2.6
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Developers
 */

class Jetpack_SSO {
	static $instance = null;

	function __construct() {
		if ( self::$instance ) {
			return self::$instance;
		}

		self::$instance = $this;

		add_action( 'admin_init',  array( $this, 'admin_init' ) );
		add_action( 'admin_init',  array( $this, 'register_settings' ) );
		add_action( 'login_init',  array( $this, 'login_init' ) );
		add_action( 'delete_user', array( $this, 'delete_connection_for_user' ) );
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
			__( 'Jetpack Single Sign On' ),
			'__return_false',
			'general'
		);

		/*
		 * Settings > General > Jetpack Single Sign On
		 * Checkbox for Remove default login form
		 */
		register_setting(
			'general',
			'jetpack_sso_remove_login_form',
			array( $this, 'validate_settings_remove_login_form_checkbox' )
		);
		
		add_settings_field(
			'jetpack_sso_remove_login_form',
			__( 'Remove default login form?' ),
			array( $this, 'render_remove_login_form_checkbox' ),
			'general',
			'jetpack_sso_settings'
		);

		/*
		 * Settings > General > Jetpack Single Sign On
		 * Require two step authentication
		 */
		register_setting(
			'general',
			'jetpack_sso_require_two_step',
			array( $this, 'validate_settings_require_two_step' )
		);

		add_settings_field(
			'jetpack_sso_require_two_step',
			__( 'Require Two-Step Authentication?' ),
			array( $this, 'render_require_two_step' ),
			'general',
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
		echo '<input type="checkbox" name="jetpack_sso_require_two_step[require_two_step]" ' . checked( 1 == get_option( 'jetpack_sso_require_two_step' ), true, false ) . '>';
	}

	/**
	 * Validate the require  two step checkbox in Settings > General
	 *
	 * @since 2.7
	 * @return boolean
	 **/
	public function validate_settings_require_two_step( $input ) {
		return ( isset( $input['require_two_step'] ) )? 1: 0;
	}

	/**
	 * Builds the display for the checkbox allowing users to remove the default
	 * WordPress login form from wp-login.php. Displays in Settings > General
	 *
	 * @since 2.7
	 **/
	public function render_remove_login_form_checkbox() {
		echo '<input type="checkbox" name="jetpack_sso_remove_login_form[remove_login_form]" ' . checked( 1 == get_option( 'jetpack_sso_remove_login_form' ), true, false ) . '>';
		echo '<p class="description">Removes default login form and disallows login via POST</p>';
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

	function login_init() {
		add_action( 'login_footer',   array( $this, 'login_form' ) );
		add_action( 'login_footer', array( $this, 'login_footer' ) );

		if( get_option( 'jetpack_sso_remove_login_form' ) ) {
			/**
	 	 	 * Check to see if the user is attempting to login via the default login form.
	 	 	 * If so we need to deny it and forward elsewhere.
	 	 	 **/
			if( isset( $_REQUEST['wp-submit'] ) && 'Log In' == $_REQUEST['wp-submit']
	  	  	  ) {
				wp_die( 'Login not permitted by this method. ');
			}
			add_filter( 'gettext', array( $this, 'remove_lost_password_text' ) );
		}

		wp_enqueue_script( 'jquery' );
		wp_enqueue_style( 'genericons' );

		if ( isset( $_GET['action'] ) && 'jetpack-sso' == $_GET['action'] ) {
			if ( isset( $_GET['result'], $_GET['user_id'], $_GET['sso_nonce'] ) && 'success' == $_GET['result'] ) {
				$this->handle_login();
			} else {
				if ( Jetpack::check_identity_crisis() ) {
					wp_die( __( "Error: This site's Jetpack connection is currently experiencing problems.", 'jetpack' ) );
				} else {
					// Is it wiser to just use wp_redirect than do this runaround to wp_safe_redirect?
					add_filter( 'allowed_redirect_hosts', array( $this, 'allowed_redirect_hosts' ) );
					wp_safe_redirect( $this->build_sso_url() );
				}
			}
		}
	}

	function login_form() {
		echo '<div class="jetpack-sso-wrap">' . $this->button() . '</div>';
	}

	function login_footer() {
		$hide_login_form = apply_filters( 'jetpack_remove_login_form', get_option( 'jetpack_sso_remove_login_form' ) );
		?>
		<style>
			#loginform {
				overflow: hidden;
				padding-bottom: 26px;
			}
			.jetpack-sso-wrap { 
				<?php 
				if( $hide_login_form ) {
				?>
					text-align: center;
				<?php } else {
				?>
					float: right;
				<?php } ?>
				margin:1em 0 0;
				clear: right;
				display: block;
			}
		</style>
		<script>
			jQuery(document).ready(function($){
				<?php
				if( $hide_login_form ) {
					echo "jQuery( '#loginform' ).empty();";
				}
				?>
			
				$( '#loginform' ).append( $( '.jetpack-sso-wrap' ) );
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
			'user_id' => get_current_user_id()
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
		do_action( 'jetpack_sso_pre_handle_login', $user_data );

		// Check to see if having two step enable on wpcom is a requirement to login here
		$require_two_step = apply_filters( 'jetpack_sso_require_two_step', get_option( 'jetpack_sso_require_two_step' ) );
		if( $require_two_step && 0 == (int) $user_data->two_step_enabled ) {
			$this->user_data = $user_data;
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
		}

		do_action( 'jetpack_sso_handle_login', $user, $user_data );

		if ( $user ) {
			// Cache the user's details, so we can present it back to them on their user screen.
			update_user_meta( $user->ID, 'wpcom_user_data', $user_data );
			
			// Set remember me value
			$remember = apply_filters( 'jetpack_remember_login', false );
			wp_set_auth_cookie( $user->ID, $remember );

			// Run the WP core login action
			do_action( 'wp_login', $user->user_login, $user );

			$_request_redirect_to = isset( $_REQUEST['redirect_to'] ) ? $_REQUEST['redirect_to'] : '';
			$redirect_to = user_can( $user, 'edit_posts' ) ? admin_url() : self::profile_page_url();
			wp_safe_redirect( apply_filters( 'login_redirect', $redirect_to, $_request_redirect_to, $user ) );
			exit;
		}

		$this->user_data = $user_data;
		do_action( 'wp_login_failed', $user_data->login );
		add_action( 'login_message', array( $this, 'cant_find_user' ) );
	}

	static function profile_page_url() {
		return admin_url( 'profile.php' );
	}

	static function match_by_email() {
		$match_by_email = defined( 'WPCC_MATCH_BY_EMAIL' ) ? WPCC_MATCH_BY_EMAIL : true;
		return apply_filters( 'jetpack_sso_match_by_email', $match_by_email );
	}

	static function new_user_override() {
		$new_user_override = defined( 'WPCC_NEW_USER_OVERRIDE' ) ? WPCC_NEW_USER_OVERRIDE : false;
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
		$url  = add_query_arg( $args, wp_login_url() );

		$css = "<style>
		.jetpack-sso.button {
			position: relative;
			padding-left: 37px;
		}
		.jetpack-sso.button:before {
			display: block;
			padding: 3px 4px;
			position: absolute;
			top: -1px;
			left: -1px;
			border-radius: 2px 0 0 2px;
			content: '\\f205';
			background: #0074a2;
			color: #fff;
			-webkit-font-smoothing: antialiased;
			width: 22px;
			height: 22px;
			font: normal 22px/1 Genericons !important;
			text-shadow: none;
		}
		.jetpack-sso.button:active:before {
			padding-top: 4px;
		}
		.jetpack-sso.button:hover {
			border: 1px solid #aaa;
		}";

		if ( version_compare( $GLOBALS['wp_version'], '3.8-alpha', '<' ) ) {
			$css .= "
			.jetpack-sso.button:before {
				width: 18px;
				height: 18px;
				font-size: 18px !important;
			}
			";
		}

		$css .= "</style>";

		return sprintf( '<a href="%1$s" class="jetpack-sso button">%2$s</a>', esc_url( $url ), esc_html__( 'Log in with WordPress.com', 'jetpack' ) ) . $css;
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

	function get_user_by_wpcom_id( $wpcom_user_id ) {
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
	function error_msg_enable_two_step( $message ) {
		$err = __( sprintf( 'This site requires two step authentication be enabled for your user account on WordPress.com. Please visit the <a href="%1$s"> Security Settings</a> page to enable two step', 'https://wordpress.com/settings/security/' ) );

		$message .= sprintf( '<p class="message" id="login_error">%s</p>', $err );
		
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
	function error_msg_login_method_not_allowed( $message ) {
		$err = __( 'Login method not allowed' );
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

	function edit_profile_fields( $user ) {
		?>

		<h3><?php _e( 'WordPress.com Single Sign On', 'jetpack' ); ?></h3>
		<p><?php _e( 'Connecting with WordPress.com SSO enables you to log in via your WordPress.com account.', 'jetpack' ); ?></p>

		<?php if ( ( $user_data = get_user_meta( $user->ID, 'wpcom_user_data', true ) ) && ! empty( $user_data->ID ) ) : /* If the user is currently connected... */ ?>

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
											?> <p class="enabled"><a href="https://wordpress.com/settings/security/"><?php _e( 'Two step Enabled', 'jetpack' ); ?></a></p> <?php
										} else {
											?> <p class="disabled"><a href="https://wordpress.com/settings/security/"><?php _e( 'Two step Disabled', 'jetpack' ); ?></a></p> <?php
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

		<?php elseif ( get_current_user_id() == $user->ID ) : ?>

			<?php echo $this->button( 'state=sso-link-user&_wpnonce=' . wp_create_nonce('sso-link-user') ); // update ?>

		<?php else : ?>

			<p><?php _e( 'This profile is not currently linked to a WordPress.com Profile.', 'jetpack' ); ?></p>

		<?php endif;
	}
}

new Jetpack_SSO;
