<?php
/**
 * Plugin Name: WPCC Sign On
 * Plugin URI: https://github.com/Automattic/wpcc-sign-on
 * Description: A single-sign-on via WordPress.com for your WordPress.org site!
 * Author: Automatticians
 * Version: 1.0
 * Author URI: http://automattic.com/
 */

class WPCC_Sign_On {
	static $instance = null;

	var $request_token_url, // Fixed URL.
		$authenticate_url,  // Fixed URL.
		$user_data_url,     // Fixed URL.
		$new_app_url_base,  // Fixed URL.
		$options_prefix,    // Where the options are in the DB.
		$options,           // Options Array.
		$client_id,         // Option.
		$client_secret,     // Option.
		$new_user_override, // Option.
		$match_by_email,    // Option.
		$wpcc_state,
		$secret,
		$user_data;

	function __construct() {
		if ( self::$instance ) {
			return self::$instance;
		}

		self::$instance = $this;

		$this->request_token_url = 'https://public-api.wordpress.com/oauth2/token';
		$this->authenticate_url  = 'https://public-api.wordpress.com/oauth2/authenticate';
		$this->user_data_url     = 'https://public-api.wordpress.com/rest/v1/me/';
		$this->new_app_url_base  = 'https://developer.wordpress.com/apps/new/';
		$this->options_prefix    = $this->in_jetpack() ? 'jetpack_' : '';
		$this->options           = $this->fetch_options();
		$this->client_id         = $this->options['client_id'];
		$this->client_secret     = $this->options['client_secret'];
		$this->new_user_override = $this->options['new_user_override'];
		$this->match_by_email    = $this->options['match_by_email'];

		add_action( 'admin_init', array( $this, 'admin_init' ) );

		if ( empty( $this->client_id ) ) {
			return;
		}

		add_action( 'login_init',            array( $this, 'login_init' )            );
		add_action( 'login_enqueue_scripts', array( $this, 'login_enqueue_scripts' ) );
		add_action( 'login_form',            array( $this, 'login_form' )            );
	}

	function in_jetpack() {
		return '/modules/wpcc' == substr( dirname( __FILE__ ), ( 0 - strlen( '/modules/wpcc' ) ) );
	}

	function fetch_options() {
		$options = $this->in_jetpack() ? Jetpack_Options::get_option( 'wpcc_options' ) : get_option( 'wpcc_options' );
		$args = wp_parse_args( $options, $this->default_options() );

		$args['new_user_override'] = defined( 'WPCC_NEW_USER_OVERRIDE' ) ? WPCC_NEW_USER_OVERRIDE : false;
		$args['match_by_email'] = defined( 'WPCC_MATCH_BY_EMAIL' ) ? WPCC_MATCH_BY_EMAIL : true;

		return $args;
	}

	function default_options() {
		return array(
			'client_id'         => '',
			'client_secret'     => '',
			'new_user_override' => false,
			'match_by_email'    => true,
		);
	}

	function admin_init() {
		// Create the section
		add_settings_section(
			'wpcc',
			esc_html__( 'WordPress.com Connect', 'jetpack' ),
			array( $this, 'wpcc_settings_section' ),
			'general'
		);

		add_settings_field(
			'wpcc_sign_on_client_id',
			sprintf( '<label for="wpcc_sign_on_client_id">%1$s</label>', __( 'WPCC Client ID', 'jetpack' ) ),
			array( $this, 'wpcc_sign_on_client_id_cb' ),
			'general',
			'wpcc'
		);
		add_settings_field(
			'wpcc_sign_on_client_secret',
			sprintf( '<label for="wpcc_sign_on_client_secret">%1$s</label>', __( 'WPCC Client Secret', 'jetpack' ) ),
			array( $this, 'wpcc_sign_on_client_secret_cb' ),
			'general',
			'wpcc'
		);

		register_setting( 'general', "{$this->options_prefix}wpcc_options", array( $this, 'sanitize_options' ) );

		if ( ! empty( $this->client_id ) && ! empty( $this->client_secret ) ) {
			add_action( 'show_user_profile', array( $this, 'edit_profile_fields' ) ); // For their own profile
			add_action( 'edit_user_profile', array( $this, 'edit_profile_fields' ) ); // For folks editing others profiles
		} else {
			add_action( 'admin_notices', array( $this, 'no_credentials_admin_notice' ) );
		}

		if ( $user_ID = get_current_user_id() ) {
			$this->wpcc_state = "localuser{$user_ID}";
		}
	}

	function no_credentials_admin_notice() {
		$disable_url = wp_nonce_url( Jetpack::admin_url( 'action=deactivate&module=wpcc' ), 'jetpack_deactivate-wpcc' );
		?>
		<div id="wpcc-needs-config" class="updated">
			<p class="alignright"><a href="<?php echo esc_url( $disable_url ); ?>"><?php _e( 'Close', 'jetpack' ); ?></a></p>
			<p><?php printf( __( '<strong>Almost done.</strong> Before WordPress.com Connect can finish activating, you\'ll need to <a href="%s">register your website as an application on WordPress.com</a>', 'jetpack' ), esc_url( admin_url( 'options-general.php#wpcc-sign-on-section' ) ) ); ?></p>
		</div>
		<?php
	}

	function sanitize_options( $options ) {
		if ( ! empty( $options['client_id'] ) ) {
			$options['client_id'] = intval( $options['client_id'] );
		}

		if ( ! empty( $options['client_secret'] ) ) {
			$options['client_secret'] = sanitize_text_field( $options['client_secret'] );
		}

		return $options;
	}

	function wpcc_settings_section() {
		?>

		<p id="wpcc-sign-on-section">
			<?php
				if ( empty( $this->client_id ) || empty( $this->client_secret ) ) {
					printf( __( 'Visit WordPress.com to <a href="%s">register a new WPCC client id and secret key</a>.', 'jetpack' ), $this->get_new_app_url() );
				} else {
					printf( __( 'Visit WordPress.com to <a href="%s">manage your WPCC client settings</a>.', 'jetpack' ), $this->get_edit_app_url() );
				}
			?>
		</p>
		<script>
			jQuery('#wpcc-sign-on-section a').attr( 'target', '_blank' );
		</script>

		<?php
	}

	function wpcc_sign_on_client_id_cb() {
		echo '<input class="regular-text code" autocomplete="off" type="text" id="wpcc_sign_on_client_id" name="' . $this->options_prefix . 'wpcc_options[client_id]" value="' . esc_attr( $this->client_id ) . '" />';
	}

	function wpcc_sign_on_client_secret_cb() {
		echo '<input class="regular-text code" autocomplete="off" type="text" id="wpcc_sign_on_client_secret" name="' . $this->options_prefix . 'wpcc_options[client_secret]" value="' . esc_attr( $this->client_secret ) . '" />';
	}

	function edit_profile_fields( $user ) {
		if ( isset( $_GET['wpcc'] ) && 'purge' == $_GET['wpcc'] ) {
			delete_user_meta( $user->ID, 'wpcom_user_id' );
			delete_user_meta( $user->ID, 'wpcom_user_data' );
		}
		?>

		<h3><?php _e( 'WordPress.com Connect', 'jetpack' ); ?></h3>
		<p><?php _e( 'Connecting with WordPress.com Connect enables you to log on via your WordPress.com account.', 'jetpack' ); ?></p>

		<?php if ( ( $user_data = get_user_meta( $user->ID, 'wpcom_user_data', true ) ) && ! empty( $user_data->ID ) ) : /* If the user is currently connected... */ ?>

			<table class="form-table wpcc-form-table">
				<tbody>
					<tr>
						<td>
							<div class="profile-card">
								<img src="<?php echo esc_url( $user_data->avatar_URL ); ?>" height="48" width="48" />
								<p class="connected"><strong><?php _e( 'Connected', 'jetpack' ); ?></strong></p>
								<p><?php echo esc_html( $user_data->username ); ?></p>
							</div>
							<p><a class="button button-secondary" href="<?php echo esc_url( add_query_arg( 'wpcc', 'purge' ) ); ?>"><?php _e( 'Unlink This Account', 'jetpack' ); ?></a></p>
						</td>
					</tr>
				</tbody>
			</table>

			<style>
			.wpcc-form-table td {
				padding-left: 0;
			}

			.wpcc-form-table .profile-card {
				padding: 10px;
				background: #fff;
				overflow: hidden;
				max-width: 400px;
				box-shadow: 0 2px 5px rgba( 0, 0, 0, 0.4 );
				margin-bottom: 1em;
			}

			.wpcc-form-table .profile-card img {
				float: left;
				margin-right: 1em;
			}

			.wpcc-form-table .profile-card .connected {
				float: right;
				margin-right: 0.5em;
				color: #0a0;
			}

			.wpcc-form-table .profile-card p {
				margin-top: 0.7em;
				font-size: 1.2em;
			}
			</style>

		<?php elseif ( get_current_user_id() == $user->ID ) : ?>

			<?php echo $this->button( array( 'redirect_uri' => add_query_arg( 'for', 'profile', wp_login_url() ) ) ); ?>

		<?php else : ?>

			<p><?php _e( 'This profile is not currently linked to a WordPress.com Profile.', 'jetpack' ); ?></p>

		<?php endif;
	}

	function verify_connection( $get_args = array() ) {
		if ( empty( $_GET['state'] ) ) {
			wp_die( __( 'Warning! State variable missing after authentication.', 'jetpack' ) );
		}

		if ( $_GET['state'] != $this->wpcc_state ) {
			wp_die( __( 'Warning! State mismatch. Authentication attempt may have been compromised.', 'jetpack' ) );
		}

		$redirect_uri = wp_login_url();

		if ( $get_args ) {
			$redirect_uri = add_query_arg( $get_args, $redirect_uri );
		}

		$args = array(
			'client_id'     => $this->client_id,
			'redirect_uri'  => $redirect_uri,
			'client_secret' => $this->client_secret,
			'code'          => sanitize_text_field( $_GET['code'] ), // The code from the previous request
			'grant_type'    => 'authorization_code',
		);

		$response = wp_remote_post( $this->request_token_url, array( 'body' => $args ) );

		if ( is_wp_error( $response ) ) {
			wp_die( __( 'Warning! Could not confirm request token url!', 'jetpack' ) );
		}

		$this->secret = json_decode( wp_remote_retrieve_body( $response ) );

		$args = array(
			'headers' => array(
				'Authorization' => sprintf( 'Bearer %s', $this->secret->access_token ),
			),
		);

		$response = wp_remote_get( $this->user_data_url, $args );

		if ( is_wp_error( $response ) ) {
			wp_die( __( 'Warning! Could not fetch user data!', 'jetpack' ) );
		}

		$this->user_data = json_decode( wp_remote_retrieve_body( $response ) );

		return $this->user_data;
	}

	function login_init() {
		// Set the wpcc_state
		$this->wpcc_state = md5( mt_rand() );
		if ( isset( $_COOKIE['wpcc_state'] ) ) {
			$this->wpcc_state = $_COOKIE['wpcc_state'];
		} else {
			setcookie( 'wpcc_state', $this->wpcc_state );
		}

		if ( isset( $_GET['for'] ) && ( 'profile' == $_GET['for'] ) ) {
			$user_ID = get_current_user_id();

			$this->wpcc_state = "localuser{$user_ID}";
			$user_data = $this->verify_connection( array( 'for' => 'profile' ) );

			update_user_meta( get_current_user_id(), 'wpcom_user_id', $user_data->ID );
			update_user_meta( get_current_user_id(), 'wpcom_user_data', $user_data );

			wp_safe_redirect( admin_url( 'profile.php' ) );
			exit;
		}

		// If they just got forwarded back ...
		if ( isset( $_GET['code'] ) ) {

			$user_data = $this->verify_connection();

			$this->auth_user( $user_data );
		}
	}

	function login_enqueue_scripts() {
		wp_enqueue_style( 'wpcc-sign-on', plugins_url( 'wpcc-sign-on.css', __FILE__ ), 0, filemtime( dirname( __FILE__ ) . '/wpcc-sign-on.css' ) );
		wp_enqueue_script( 'wpcc-sign-on', plugins_url( 'wpcc-sign-on.js', __FILE__ ), array( 'jquery' ), filemtime( dirname( __FILE__ ) . '/wpcc-sign-on.js'  ) );
	}

	function login_form() {
		if( ! did_action( 'login_init' ) )
			return;

		echo $this->button();
	}

	function button( $args = array() ) {
		$defaults = array(
			'response_type' => 'code',
			'client_id'     => $this->client_id,
			'state'         => $this->wpcc_state,
			'redirect_uri'  => wp_login_url(),
		);

		$args = wp_parse_args( $args, $defaults );

		if ( ! empty( $_REQUEST['redirect_to'] ) ) {
			$args['redirect_uri'] = add_query_arg( 'redirect_to', $_REQUEST['redirect_to'], $args['redirect_uri'] );
		}

		$url = add_query_arg( $args, $this->authenticate_url );

		return sprintf( '<a id="wpcc-sign-on" href="%1$s"><img src="//s0.wp.com/i/wpcc-button.png" width="231" /></a>', esc_url( $url ) );
	}

	function auth_user( $user_data ) {

		if ( ! $user_data->verified ) {
			return false;
		}

		$user = $this->get_user_by_wpcom_id( $user_data->ID );

		// If we don't have one by wpcom_user_id, try by the email?
		if ( empty( $user ) && $this->match_by_email ) {
			$user = get_user_by( 'email', $user_data->email );
			if ( $user ) {
				update_user_meta( $user->ID, 'wpcom_user_id', $user_data->ID );
			}
		}

		// If we've still got nothing, create the user.
		if ( empty( $user ) && ( get_option( 'users_can_register' ) || $this->new_user_override ) ) {
			$username = $user_data->username;

			if ( username_exists( $username ) ) {
				$username .= '_' . $user_data->ID;
			}

			if ( username_exists( $username ) )
				$username .= '_' . mt_rand();

			$password = wp_generate_password( 20 );
			$user_id  = wp_create_user( $username, $password, $user_data->email );
			$user     = get_userdata( $user_id );

			$user->display_name = $user_data->display_name;
			wp_update_user( $user );

			update_user_meta( $user->ID, 'wpcom_user_id', $user_data->ID );
		}

		if ( $user ) {
			// Cache the user's details, so we can present it back to them on their user screen.
			update_user_meta( $user->ID, 'wpcom_user_data', $user_data );
			wp_set_auth_cookie( $user->ID );

			$_request_redirect_to = isset( $_REQUEST['redirect_to'] ) ? $_REQUEST['redirect_to'] : '';
			$redirect_to = user_can( $user, 'edit_posts' ) ? admin_url() : admin_url( 'profile.php' );
			wp_safe_redirect( apply_filters( 'login_redirect', $redirect_to, $_request_redirect_to, $user ) );
			exit;
		}

		add_action( 'login_message', array( $this, 'cant_find_user' ) );
	}

	function get_user_by_wpcom_id( $wpcom_user_id ) {
		$user_query = new WP_User_Query( array(
			'meta_key'   => 'wpcom_user_id',
			'meta_value' => intval( $wpcom_user_id ),
		) );

		$users = $user_query->get_results();

		return ( is_array( $users ) && ! empty( $users ) ) ? array_shift( $users ) : $users;
	}

	function cant_find_user( $message ) {
		$err_format = __( 'We couldn\'t find an account with the email <strong><code>%1$s</code></strong> to log you in with.  If you already have an account on <strong>%2$s</strong>, please make sure that <strong><code>%1$s</code></strong> is configured as the email address, or that you have connected to WordPress.com on your profile page.', 'jetpack' );
		if ( ! $this->match_by_email ) {
			$err_format = __( 'We couldn\'t find any account on <strong>%2$s</strong> that is linked to your WordPress.com account to log you in with.  If you already have an account on <strong>%2$s</strong>, please make sure that you have connected to WordPress.com on your profile page.', 'jetpack' );
		}
		$err = sprintf( $err_format, $this->user_data->email, get_bloginfo( 'name' ) );
		$message .= sprintf( '<p class="message" id="login_error">%s</p>', $err );
		return $message;
	}

	function get_new_app_url() {
		$args = array(
			'for'          => 'jetpack',
			'title'        => urlencode( get_bloginfo( 'name' ) ),
			'description'  => urlencode( get_bloginfo( 'description' ) ),
			'url'          => urlencode( site_url() ),
			'redirect_uri' => urlencode( wp_login_url() ),
		);
		return add_query_arg( $args, $this->new_app_url_base );
	}

	function get_edit_app_url( $client_id = null ) {
		if ( empty( $client_id ) ) {
			$client_id = $this->client_id;
		}
		return sprintf( 'https://developer.wordpress.com/apps/%d/', $client_id );
	}
}

new WPCC_Sign_On;
