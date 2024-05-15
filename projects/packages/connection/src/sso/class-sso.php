<?php
/**
 * SSO feature. Entry point.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\SSO\Force_2FA;
use Automattic\Jetpack\Connection\SSO\Helpers;
use Automattic\Jetpack\Connection\SSO\Notices;
use Automattic\Jetpack\Connection\SSO\User_Admin;
use Automattic\Jetpack\Connection\Webhooks\Authorize_Redirect;
use Automattic\Jetpack\Roles;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Tracking;
use Jetpack_IXR_Client;
use WP_Error;
use WP_User;
use WP_User_Query;

/**
 * SSO feature main class.
 */
class SSO {
	/**
	 * WordPress.com User information.
	 *
	 * @var false|object
	 */
	private $user_data;

	/**
	 * Automattic\Jetpack\Connection\SSO instance.
	 *
	 * @var \Automattic\Jetpack\Connection\SSO
	 */
	public static $instance = null;

	/**
	 * Automattic\Jetpack\Connection\SSO constructor.
	 */
	private function __construct() {

		self::$instance = $this;

		add_action( 'admin_init', array( $this, 'maybe_authorize_user_after_sso' ), 1 );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'login_init', array( $this, 'login_init' ) );
		add_filter( 'jetpack_xmlrpc_methods', array( $this, 'xmlrpc_methods' ) );
		add_action( 'init', array( $this, 'maybe_logout_user' ), 5 );
		add_action( 'login_form_logout', array( $this, 'store_wpcom_profile_cookies_on_logout' ) );
		add_action( 'jetpack_unlinked_user', array( Helpers::class, 'delete_connection_for_user' ) );

		add_action( 'jetpack_site_before_disconnected', array( static::class, 'disconnect' ) );
		add_action( 'wp_login', array( static::class, 'clear_cookies_after_login' ) );

		// Adding this action so that on login_init, the action won't be sanitized out of the $action global.
		add_action( 'login_form_jetpack-sso', '__return_true' );

		add_filter( 'wp_login_errors', array( $this, 'sso_reminder_logout_wpcom' ) );

		// Synchronize SSO options with WordPress.com.
		add_filter( 'jetpack_sync_callable_whitelist', array( $this, 'sync_sso_callables' ), 10, 1 );

		/**
		 * Filter to include Force 2FA feature.
		 *
		 * By default, `manage_options` users are forced when enable. The capability can be modified
		 * with the `jetpack_force_2fa_cap` filter.
		 *
		 * To enable the feature, add the following code:
		 * add_filter( 'jetpack_force_2fa', '__return_true' );
		 *
		 * @param bool $force_2fa Whether to force 2FA or not.
		 *
		 * @todo Provide a UI to enable/disable the feature.
		 *
		 * @since jetpack-12.7
		 * @module SSO
		 * @return bool
		 */
		if (
			! class_exists( 'Automattic\Jetpack\Connection\SSO\Force_2FA', false )
			&& apply_filters( 'jetpack_force_2fa', false )
		) {
			new Force_2FA();
		}

		/*
		 * Allow admins to invite new users to create a WordPress.com account
		 * as they are added to the site.
		 *
		 * This is a feature that is only available when the admin is connected to WordPress.com.
		 */
		if (
			( new Manager() )->is_user_connected() &&
			! is_multisite() &&
			/**
			 * Toggle the ability to invite new users to create a WordPress.com account.
			 *
			 * @module sso
			 *
			 * @since 2.7.2
			 *
			 * @param bool true Whether to allow admins to invite new users to create a WordPress.com account.
			 */
			apply_filters( 'jetpack_sso_invite_new_users_wpcom', true )
		) {
			new User_Admin();
		}
	}

	/**
	 * Returns the single instance of the Automattic\Jetpack\Connection\SSO object
	 *
	 * @since jetpack-2.8
	 * @return \Automattic\Jetpack\Connection\SSO
	 */
	public static function get_instance() {
		if ( self::$instance !== null ) {
			return self::$instance;
		}

		self::$instance = new SSO();
		return self::$instance;
	}

	/**
	 * Add SSO callables to the sync whitelist.
	 *
	 * @since 2.8.1
	 *
	 * @param array $callables list of callables.
	 *
	 * @return array list of callables.
	 */
	public function sync_sso_callables( $callables ) {
		$sso_callables = array(
			'sso_is_two_step_required'      => array( Helpers::class, 'is_two_step_required' ),
			'sso_should_hide_login_form'    => array( Helpers::class, 'should_hide_login_form' ),
			'sso_match_by_email'            => array( Helpers::class, 'match_by_email' ),
			'sso_new_user_override'         => array( Helpers::class, 'new_user_override' ),
			'sso_bypass_default_login_form' => array( Helpers::class, 'bypass_login_forward_wpcom' ),
		);

		return array_merge( $callables, $sso_callables );
	}

	/**
	 * Safety heads-up added to the logout messages when SSO is enabled.
	 * Some folks on a shared computer don't know that they need to log out of WordPress.com as well.
	 *
	 * @param WP_Error $errors WP_Error object.
	 */
	public function sso_reminder_logout_wpcom( $errors ) {
		if ( ( new Host() )->is_wpcom_platform() ) {
			return $errors;
		}

		if ( ! empty( $errors->errors['loggedout'] ) ) {
			$logout_message = wp_kses(
				sprintf(
				/* translators: %1$s is a link to the WordPress.com account settings page. */
					__( 'If you are on a shared computer, remember to also <a href="%1$s">log out of WordPress.com</a>.', 'jetpack-connection' ),
					'https://wordpress.com/me'
				),
				array(
					'a' => array(
						'href' => array(),
					),
				)
			);
			$errors->add( 'jetpack-sso-show-logout', $logout_message, 'message' );
		}
		return $errors;
	}

	/**
	 * If jetpack_force_logout == 1 in current user meta the user will be forced
	 * to logout and reauthenticate with the site.
	 **/
	public function maybe_logout_user() {
		global $current_user;

		if ( 1 === (int) $current_user->jetpack_force_logout ) {
			delete_user_meta( $current_user->ID, 'jetpack_force_logout' );
			Helpers::delete_connection_for_user( $current_user->ID );
			wp_logout();
			wp_safe_redirect( wp_login_url() );
			exit;
		}
	}

	/**
	 * Adds additional methods the WordPress xmlrpc API for handling SSO specific features
	 *
	 * @param array $methods API methods.
	 * @return array
	 **/
	public function xmlrpc_methods( $methods ) {
		$methods['jetpack.userDisconnect'] = array( $this, 'xmlrpc_user_disconnect' );
		return $methods;
	}

	/**
	 * Marks a user's profile for disconnect from WordPress.com and forces a logout
	 * the next time the user visits the site.
	 *
	 * @param int $user_id User to disconnect from the site.
	 **/
	public function xmlrpc_user_disconnect( $user_id ) {
		$user_query = new WP_User_Query(
			array(
				'meta_key'   => 'wpcom_user_id',
				'meta_value' => $user_id,
			)
		);
		$user       = $user_query->get_results();
		$user       = $user[0];

		if ( $user instanceof WP_User ) {
			$user = wp_set_current_user( $user->ID );
			update_user_meta( $user->ID, 'jetpack_force_logout', '1' );
			Helpers::delete_connection_for_user( $user->ID );
			return true;
		}
		return false;
	}

	/**
	 * Enqueues scripts and styles necessary for SSO login.
	 */
	public function login_enqueue_scripts() {
		global $action;

		if ( ! Helpers::display_sso_form_for_action( $action ) ) {
			return;
		}

		Assets::register_script(
			'jetpack-sso-login',
			'../../dist/jetpack-sso-login.js',
			__FILE__,
			array(
				'enqueue' => true,
				'version' => Package_Version::PACKAGE_VERSION,
			)
		);
	}

	/**
	 * Adds Jetpack SSO classes to login body
	 *
	 * @param  array $classes Array of classes to add to body tag.
	 * @return array          Array of classes to add to body tag.
	 */
	public function login_body_class( $classes ) {
		global $action;

		if ( ! Helpers::display_sso_form_for_action( $action ) ) {
			return $classes;
		}

		// Always add the jetpack-sso class so that we can add SSO specific styling even when the SSO form isn't being displayed.
		$classes[] = 'jetpack-sso';

		if ( ! ( new Status() )->is_staging_site() ) {
			/**
			 * Should we show the SSO login form?
			 *
			 * $_GET['jetpack-sso-default-form'] is used to provide a fallback in case JavaScript is not enabled.
			 *
			 * The default_to_sso_login() method allows us to dynamically decide whether we show the SSO login form or not.
			 * The SSO module uses the method to display the default login form if we can not find a user to log in via SSO.
			 * But, the method could be filtered by a site admin to always show the default login form if that is preferred.
			 */
			if ( empty( $_GET['jetpack-sso-show-default-form'] ) && Helpers::show_sso_login() ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$classes[] = 'jetpack-sso-form-display';
			}
		}

		return $classes;
	}

	/**
	 * Inlined admin styles for SSO.
	 */
	public function print_inline_admin_css() {
		?>
			<style>
				.jetpack-sso .message {
					margin-top: 20px;
				}

				.jetpack-sso #login .message:first-child,
				.jetpack-sso #login h1 + .message {
					margin-top: 0;
				}
			</style>
		<?php
	}

	/**
	 * Adds settings fields to Settings > General > Secure Sign On that allows users to
	 * turn off the login form on wp-login.php
	 *
	 * @since jetpack-2.7
	 **/
	public function register_settings() {

		add_settings_section(
			'jetpack_sso_settings',
			__( 'Secure Sign On', 'jetpack-connection' ),
			'__return_false',
			'jetpack-sso'
		);

		/*
		 * Settings > General > Secure Sign On
		 * Require two step authentication
		 */
		register_setting(
			'jetpack-sso',
			'jetpack_sso_require_two_step',
			array( $this, 'validate_jetpack_sso_require_two_step' )
		);

		add_settings_field(
			'jetpack_sso_require_two_step',
			'', // Output done in render $callback: __( 'Require Two-Step Authentication' , 'jetpack-connection' ).
			array( $this, 'render_require_two_step' ),
			'jetpack-sso',
			'jetpack_sso_settings'
		);

		/*
		 * Settings > General > Secure Sign On
		 */
		register_setting(
			'jetpack-sso',
			'jetpack_sso_match_by_email',
			array( $this, 'validate_jetpack_sso_match_by_email' )
		);

		add_settings_field(
			'jetpack_sso_match_by_email',
			'', // Output done in render $callback: __( 'Match by Email' , 'jetpack-connection' ).
			array( $this, 'render_match_by_email' ),
			'jetpack-sso',
			'jetpack_sso_settings'
		);
	}

	/**
	 * Builds the display for the checkbox allowing user to require two step
	 * auth be enabled on WordPress.com accounts before login. Displays in Settings > General
	 *
	 * @since jetpack-2.7
	 **/
	public function render_require_two_step() {
		?>
		<label>
			<input
				type="checkbox"
				name="jetpack_sso_require_two_step"
		<?php checked( Helpers::is_two_step_required() ); ?>
		<?php disabled( Helpers::is_require_two_step_checkbox_disabled() ); ?>
			>
		<?php esc_html_e( 'Require Two-Step Authentication', 'jetpack-connection' ); ?>
		</label>
		<?php
	}

	/**
	 * Validate the require  two step checkbox in Settings > General.
	 *
	 * @param bool $input The jetpack_sso_require_two_step option setting.
	 *
	 * @since jetpack-2.7
	 * @return int
	 **/
	public function validate_jetpack_sso_require_two_step( $input ) {
		return ( ! empty( $input ) ) ? 1 : 0;
	}

	/**
	 * Builds the display for the checkbox allowing the user to allow matching logins by email
	 * Displays in Settings > General
	 *
	 * @since jetpack-2.9
	 **/
	public function render_match_by_email() {
		?>
			<label>
				<input
					type="checkbox"
					name="jetpack_sso_match_by_email"
			<?php checked( Helpers::match_by_email() ); ?>
			<?php disabled( Helpers::is_match_by_email_checkbox_disabled() ); ?>
				>
		<?php esc_html_e( 'Match by Email', 'jetpack-connection' ); ?>
			</label>
		<?php
	}

	/**
	 * Validate the match by email check in Settings > General.
	 *
	 * @param bool $input The jetpack_sso_match_by_email option setting.
	 *
	 * @since jetpack-2.9
	 * @return int
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

		// Cover default WordPress behavior.
		$action = isset( $_REQUEST['action'] ) ? filter_var( wp_unslash( $_REQUEST['action'] ) ) : 'login'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		// And now the exceptions.
		$action = isset( $_GET['loggedout'] ) ? 'loggedout' : $action; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( Helpers::display_sso_form_for_action( $action ) ) {
			$wants_to_login = true;
		}

		return $wants_to_login;
	}

	/**
	 * Checks to determine if the user has indicated they want to use the wp-admin interface.
	 */
	private function use_wp_admin_interface() {
		return 'wp-admin' === get_option( 'wpcom_admin_interface' );
	}

	/**
	 * Initialization for a SSO request.
	 */
	public function login_init() {
		global $action;

		$tracking = new Tracking();

		if ( Helpers::should_hide_login_form() ) {
			/**
			 * Since the default authenticate filters fire at priority 20 for checking username and password,
			 * let's fire at priority 30. wp_authenticate_spam_check is fired at priority 99, but since we return a
			 * WP_Error in disable_default_login_form, then we won't trigger spam processing logic.
			 */
			add_filter( 'authenticate', array( Notices::class, 'disable_default_login_form' ), 30 );

			/**
			 * Filter the display of the disclaimer message appearing when default WordPress login form is disabled.
			 *
			 * @module sso
			 *
			 * @since jetpack-2.8.0
			 *
			 * @param bool true Should the disclaimer be displayed. Default to true.
			 */
			$display_sso_disclaimer = apply_filters( 'jetpack_sso_display_disclaimer', true );
			if ( $display_sso_disclaimer ) {
				add_filter( 'login_message', array( Notices::class, 'msg_login_by_jetpack' ) );
			}
		}

		if ( 'jetpack-sso' === $action ) {
			if ( isset( $_GET['result'] ) && isset( $_GET['user_id'] ) && isset( $_GET['sso_nonce'] ) && 'success' === $_GET['result'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$this->handle_login();
				$this->display_sso_login_form();
			} elseif ( ( new Status() )->is_staging_site() ) {
				add_filter( 'login_message', array( Notices::class, 'sso_not_allowed_in_staging' ) );
			} else {
				// Is it wiser to just use wp_redirect than do this runaround to wp_safe_redirect?
				add_filter( 'allowed_redirect_hosts', array( Helpers::class, 'allowed_redirect_hosts' ) );
				$reauth  = ! empty( $_GET['force_reauth'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$sso_url = $this->get_sso_url_or_die( $reauth );

				$tracking->record_user_event( 'sso_login_redirect_success' );
				wp_safe_redirect( $sso_url );
				exit;
			}
		} elseif ( Helpers::display_sso_form_for_action( $action ) ) {

			// Save cookies so we can handle redirects after SSO.
			static::save_cookies();

			/**
			 * Check to see if the site admin wants to automagically forward the user
			 * to the WordPress.com login page AND  that the request to wp-login.php
			 * is not something other than login (Like logout!)
			 */
			if ( ! $this->use_wp_admin_interface() && Helpers::bypass_login_forward_wpcom() && $this->wants_to_login() ) {
				add_filter( 'allowed_redirect_hosts', array( Helpers::class, 'allowed_redirect_hosts' ) );
				$reauth  = ! empty( $_GET['force_reauth'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$sso_url = $this->get_sso_url_or_die( $reauth );
				$tracking->record_user_event( 'sso_login_redirect_bypass_success' );
				wp_safe_redirect( $sso_url );
				exit;
			}

			$this->display_sso_login_form();
		}
	}

	/**
	 * Ensures that we can get a nonce from WordPress.com via XML-RPC before setting
	 * up the hooks required to display the SSO form.
	 */
	public function display_sso_login_form() {
		add_filter( 'login_body_class', array( $this, 'login_body_class' ) );
		add_action( 'login_head', array( $this, 'print_inline_admin_css' ) );

		if ( ( new Status() )->is_staging_site() ) {
			add_filter( 'login_message', array( Notices::class, 'sso_not_allowed_in_staging' ) );
			return;
		}

		$sso_nonce = self::request_initial_nonce();
		if ( is_wp_error( $sso_nonce ) ) {
			return;
		}

		add_action( 'login_form', array( $this, 'login_form' ) );
		add_action( 'login_enqueue_scripts', array( $this, 'login_enqueue_scripts' ) );
	}

	/**
	 * Conditionally save the redirect_to url as a cookie.
	 *
	 * @since jetpack-4.6.0 Renamed to save_cookies from maybe_save_redirect_cookies
	 */
	public static function save_cookies() {
		if ( headers_sent() ) {
			return new WP_Error( 'headers_sent', __( 'Cannot deal with cookie redirects, as headers are already sent.', 'jetpack-connection' ) );
		}

		setcookie(
			'jetpack_sso_original_request',
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sniff misses the wrapping esc_url_raw().
			esc_url_raw( set_url_scheme( ( isset( $_SERVER['HTTP_HOST'] ) ? wp_unslash( $_SERVER['HTTP_HOST'] ) : '' ) . ( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '' ) ) ),
			time() + HOUR_IN_SECONDS,
			COOKIEPATH,
			COOKIE_DOMAIN,
			is_ssl(),
			true
		);

		if ( ! empty( $_GET['redirect_to'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			// If we have something to redirect to.
			$url = esc_url_raw( wp_unslash( $_GET['redirect_to'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			setcookie( 'jetpack_sso_redirect_to', $url, time() + HOUR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true );
		} elseif ( ! empty( $_COOKIE['jetpack_sso_redirect_to'] ) ) {
			// Otherwise, if it's already set, purge it.
			setcookie( 'jetpack_sso_redirect_to', ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true );
		}
	}

	/**
	 * Outputs the Jetpack SSO button and description as well as the toggle link
	 * for switching between Jetpack SSO and default login.
	 */
	public function login_form() {
		$site_name = get_bloginfo( 'name' );
		if ( ! $site_name ) {
			$site_name = get_bloginfo( 'url' );
		}

		$display_name = ! empty( $_COOKIE[ 'jetpack_sso_wpcom_name_' . COOKIEHASH ] )
		? sanitize_text_field( wp_unslash( $_COOKIE[ 'jetpack_sso_wpcom_name_' . COOKIEHASH ] ) )
		: false;
		$gravatar     = ! empty( $_COOKIE[ 'jetpack_sso_wpcom_gravatar_' . COOKIEHASH ] )
		? esc_url_raw( wp_unslash( $_COOKIE[ 'jetpack_sso_wpcom_gravatar_' . COOKIEHASH ] ) )
		: false;

		?>
		<div id="jetpack-sso-wrap">
		<?php
		/**
		 * Allow extension above Jetpack's SSO form.
		 *
		 * @module sso
		 *
		 * @since jetpack-8.6.0
		 */
		do_action( 'jetpack_sso_login_form_above_wpcom' );

		if ( $display_name && $gravatar ) :
			?>
				<div id="jetpack-sso-wrap__user">
					<img width="72" height="72" src="<?php echo esc_html( $gravatar ); ?>" />

					<h2>
				<?php
				echo wp_kses(
					/* translators: %s a user display name. */
					sprintf( __( 'Log in as <span>%s</span>', 'jetpack-connection' ), esc_html( $display_name ) ),
					array( 'span' => true )
				);
				?>
					</h2>
				</div>

				<?php endif; ?>


			<div id="jetpack-sso-wrap__action">
					<?php echo $this->build_sso_button( array(), true ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaping done in build_sso_button() ?>

					<?php if ( $display_name && $gravatar ) : ?>
					<a rel="nofollow" class="jetpack-sso-wrap__reauth" href="<?php echo esc_url( $this->build_sso_button_url( array( 'force_reauth' => '1' ) ) ); ?>">
						<?php esc_html_e( 'Log in as a different WordPress.com user', 'jetpack-connection' ); ?>
					</a>
				<?php else : ?>
					<p>
						<?php
							/**
							 * Filter the messeage displayed below the SSO button.
							 *
							 * @module sso
							 *
							 * @since jetpack-10.3.0
							 *
							 * @param string $sso_explanation Message displayed below the SSO button.
							 */
							$sso_explanation = apply_filters(
								'jetpack_sso_login_form_explanation_text',
								sprintf(
									/* Translators: %s is the name of the site. */
									__( 'You can now save time spent logging in by connecting your WordPress.com account to %s.', 'jetpack-connection' ),
									esc_html( $site_name )
								)
							);
							echo esc_html( $sso_explanation );
						?>
					</p>
				<?php endif; ?>
			</div>

					<?php
					/**
					 * Allow extension below Jetpack's SSO form.
					 *
					 * @module sso
					 *
					 * @since jetpack-8.6.0
					 */
					do_action( 'jetpack_sso_login_form_below_wpcom' );

					if ( ! Helpers::should_hide_login_form() ) :
						?>
					<div class="jetpack-sso-or">
						<span><?php esc_html_e( 'Or', 'jetpack-connection' ); ?></span>
					</div>

					<a href="<?php echo esc_url( add_query_arg( 'jetpack-sso-show-default-form', '1' ) ); ?>" class="jetpack-sso-toggle wpcom">
						<?php
						esc_html_e( 'Log in with username and password', 'jetpack-connection' )
						?>
					</a>

					<a href="<?php echo esc_url( add_query_arg( 'jetpack-sso-show-default-form', '0' ) ); ?>" class="jetpack-sso-toggle default">
						<?php
						esc_html_e( 'Log in with WordPress.com', 'jetpack-connection' )
						?>
					</a>
					<?php endif; ?>
		</div>
				<?php
	}

	/**
	 * Clear cookies that are no longer needed once the user has logged in.
	 *
	 * @since jetpack-4.8.0
	 */
	public static function clear_cookies_after_login() {
		Helpers::clear_wpcom_profile_cookies();
		if ( isset( $_COOKIE['jetpack_sso_nonce'] ) ) {
			setcookie(
				'jetpack_sso_nonce',
				' ',
				time() - YEAR_IN_SECONDS,
				COOKIEPATH,
				COOKIE_DOMAIN,
				is_ssl(),
				true
			);
		}

		if ( isset( $_COOKIE['jetpack_sso_original_request'] ) ) {
			setcookie(
				'jetpack_sso_original_request',
				' ',
				time() - YEAR_IN_SECONDS,
				COOKIEPATH,
				COOKIE_DOMAIN,
				is_ssl(),
				true
			);
		}

		if ( isset( $_COOKIE['jetpack_sso_redirect_to'] ) ) {
			setcookie(
				'jetpack_sso_redirect_to',
				' ',
				time() - YEAR_IN_SECONDS,
				COOKIEPATH,
				COOKIE_DOMAIN,
				is_ssl(),
				true
			);
		}
	}

	/**
	 * Clean up after Jetpack gets disconnected.
	 *
	 * @since jetpack-10.7
	 */
	public static function disconnect() {
		if ( ( new Manager() )->is_user_connected() ) {
			Helpers::delete_connection_for_user( get_current_user_id() );
		}
	}

	/**
	 * Retrieves nonce used for SSO form.
	 *
	 * @return string|WP_Error
	 */
	public static function request_initial_nonce() {
		$nonce = ! empty( $_COOKIE['jetpack_sso_nonce'] )
		? sanitize_key( wp_unslash( $_COOKIE['jetpack_sso_nonce'] ) )
		: false;

		if ( ! $nonce ) {
			$xml = new Jetpack_IXR_Client();
			$xml->query( 'jetpack.sso.requestNonce' );

			if ( $xml->isError() ) {
				return new WP_Error( $xml->getErrorCode(), $xml->getErrorMessage() );
			}

			$nonce = sanitize_key( $xml->getResponse() );

			setcookie(
				'jetpack_sso_nonce',
				$nonce,
				time() + ( 10 * MINUTE_IN_SECONDS ),
				COOKIEPATH,
				COOKIE_DOMAIN,
				is_ssl(),
				true
			);
		}

		return $nonce;
	}

	/**
	 * The function that actually handles the login!
	 */
	public function handle_login() {
		$wpcom_nonce   = isset( $_GET['sso_nonce'] ) ? sanitize_key( $_GET['sso_nonce'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$wpcom_user_id = isset( $_GET['user_id'] ) ? (int) $_GET['user_id'] : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.sso.validateResult', $wpcom_nonce, $wpcom_user_id );

		$user_data = $xml->isError() ? false : $xml->getResponse();
		if ( empty( $user_data ) ) {
			add_filter( 'jetpack_sso_default_to_sso_login', '__return_false' );
			add_filter( 'login_message', array( Notices::class, 'error_invalid_response_data' ) );
			return;
		}

		$user_data = (object) $user_data;
		$user      = null;

		/**
		 * Fires before Jetpack's SSO modifies the log in form.
		 *
		 * @module sso
		 *
		 * @since jetpack-2.6.0
		 *
		 * @param object $user_data WordPress.com User information.
		 */
		do_action( 'jetpack_sso_pre_handle_login', $user_data );

		$tracking = new Tracking();

		if ( Helpers::is_two_step_required() && 0 === (int) $user_data->two_step_enabled ) {
			$this->user_data = $user_data;

			$tracking->record_user_event(
				'sso_login_failed',
				array(
					'error_message' => 'error_msg_enable_two_step',
				)
			);

			$error = new WP_Error( 'two_step_required', __( 'You must have Two-Step Authentication enabled on your WordPress.com account.', 'jetpack-connection' ) );

			/** This filter is documented in core/src/wp-includes/pluggable.php */
			do_action( 'wp_login_failed', $user_data->login, $error );
			add_filter( 'login_message', array( Notices::class, 'error_msg_enable_two_step' ) );
			return;
		}

		$user_found_with = '';
		if ( empty( $user ) && isset( $user_data->external_user_id ) ) {
			$user_found_with = 'external_user_id';
			$user            = get_user_by( 'id', (int) $user_data->external_user_id );
			if ( $user ) {
				$expected_id = get_user_meta( $user->ID, 'wpcom_user_id', true );
				if ( $expected_id && $expected_id != $user_data->ID ) { // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison, Universal.Operators.StrictComparisons.LooseNotEqual
					$error = new WP_Error( 'expected_wpcom_user', __( 'Something got a little mixed up and an unexpected WordPress.com user logged in.', 'jetpack-connection' ) );

					$tracking->record_user_event(
						'sso_login_failed',
						array(
							'error_message' => 'error_unexpected_wpcom_user',
						)
					);

					/** This filter is documented in core/src/wp-includes/pluggable.php */
					do_action( 'wp_login_failed', $user_data->login, $error );
					add_filter( 'login_message', array( Notices::class, 'error_invalid_response_data' ) ); // @todo Need to have a better notice. This is only for the sake of testing the validation.
					return;
				}
				update_user_meta( $user->ID, 'wpcom_user_id', $user_data->ID );
			}
		}

		// If we don't have one by wpcom_user_id, try by the email?
		if ( empty( $user ) && Helpers::match_by_email() ) {
			$user_found_with = 'match_by_email';
			$user            = get_user_by( 'email', $user_data->email );
			if ( $user ) {
				update_user_meta( $user->ID, 'wpcom_user_id', $user_data->ID );
			}
		}

		// If we've still got nothing, create the user.
		$new_user_override_role = Helpers::new_user_override( $user_data );
		if ( empty( $user ) && ( get_option( 'users_can_register' ) || $new_user_override_role ) ) {
			/**
			 * If not matching by email we still need to verify the email does not exist
			 * or this blows up
			 *
			 * If match_by_email is true, we know the email doesn't exist, as it would have
			 * been found in the first pass.  If get_user_by( 'email' ) doesn't find the
			 * user, then we know that email is unused, so it's safe to add.
			 */
			if ( Helpers::match_by_email() || ! get_user_by( 'email', $user_data->email ) ) {

				if ( $new_user_override_role ) {
					$user_data->role = $new_user_override_role;
				}

				$user = Utils::generate_user( $user_data );
				if ( ! $user ) {
					$tracking->record_user_event(
						'sso_login_failed',
						array(
							'error_message' => 'could_not_create_username',
						)
					);
					add_filter( 'login_message', array( Notices::class, 'error_unable_to_create_user' ) );
					return;
				}

				$user_found_with = $new_user_override_role
				? 'user_created_new_user_override'
				: 'user_created_users_can_register';
			} else {
				$tracking->record_user_event(
					'sso_login_failed',
					array(
						'error_message' => 'error_msg_email_already_exists',
					)
				);

				$this->user_data = $user_data;
				add_action( 'login_message', array( Notices::class, 'error_msg_email_already_exists' ) );
				return;
			}
		}

		/**
		 * Fires after we got login information from WordPress.com.
		 *
		 * @module sso
		 *
		 * @since jetpack-2.6.0
		 *
		 * @param WP_User|false|null $user      Local User information.
		 * @param object             $user_data WordPress.com User Login information.
		 */
		do_action( 'jetpack_sso_handle_login', $user, $user_data );

		if ( $user ) {
			// Cache the user's details, so we can present it back to them on their user screen.
			update_user_meta( $user->ID, 'wpcom_user_data', $user_data );

			add_filter( 'auth_cookie_expiration', array( Helpers::class, 'extend_auth_cookie_expiration_for_sso' ) );
			wp_set_auth_cookie( $user->ID, true );
			remove_filter( 'auth_cookie_expiration', array( Helpers::class, 'extend_auth_cookie_expiration_for_sso' ) );

			/** This filter is documented in core/src/wp-includes/user.php */
			do_action( 'wp_login', $user->user_login, $user );

			wp_set_current_user( $user->ID );

			$_request_redirect_to = isset( $_REQUEST['redirect_to'] ) ? esc_url_raw( wp_unslash( $_REQUEST['redirect_to'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$redirect_to          = user_can( $user, 'edit_posts' ) ? admin_url() : self::profile_page_url();

			// If we have a saved redirect to request in a cookie.
			if ( ! empty( $_COOKIE['jetpack_sso_redirect_to'] ) ) {
				// Set that as the requested redirect to.
				$redirect_to          = esc_url_raw( wp_unslash( $_COOKIE['jetpack_sso_redirect_to'] ) );
				$_request_redirect_to = $redirect_to;
			}

			$json_api_auth_environment = Helpers::get_json_api_auth_environment();

			$is_json_api_auth  = ! empty( $json_api_auth_environment );
			$is_user_connected = ( new Manager() )->is_user_connected( $user->ID );
			$roles             = new Roles();
			$tracking->record_user_event(
				'sso_user_logged_in',
				array(
					'user_found_with'  => $user_found_with,
					'user_connected'   => (bool) $is_user_connected,
					'user_role'        => $roles->translate_current_user_to_role(),
					'is_json_api_auth' => $is_json_api_auth,
				)
			);

			if ( $is_json_api_auth ) {
				$authorize_json_api = new Authorize_Json_Api();
				$authorize_json_api->verify_json_api_authorization_request( $json_api_auth_environment );
				$authorize_json_api->store_json_api_authorization_token( $user->user_login, $user );

			} elseif ( ! $is_user_connected ) {
				wp_safe_redirect(
					add_query_arg(
						array(
							'redirect_to'               => $redirect_to,
							'request_redirect_to'       => $_request_redirect_to,
							'calypso_env'               => ( new Host() )->get_calypso_env(),
							'jetpack-sso-auth-redirect' => '1',
						),
						admin_url()
					)
				);
				exit;
			}

			add_filter( 'allowed_redirect_hosts', array( Helpers::class, 'allowed_redirect_hosts' ) );
			wp_safe_redirect(
			/** This filter is documented in core/src/wp-login.php */
				apply_filters( 'login_redirect', $redirect_to, $_request_redirect_to, $user )
			);
			exit;
		}

		add_filter( 'jetpack_sso_default_to_sso_login', '__return_false' );

		$tracking->record_user_event(
			'sso_login_failed',
			array(
				'error_message' => 'cant_find_user',
			)
		);

		$this->user_data = $user_data;

		$error = new WP_Error( 'account_not_found', __( 'Account not found. If you already have an account, make sure you have connected to WordPress.com.', 'jetpack-connection' ) );

		/** This filter is documented in core/src/wp-includes/pluggable.php */
		do_action( 'wp_login_failed', $user_data->login, $error );
		add_filter( 'login_message', array( Notices::class, 'cant_find_user' ) );
	}

	/**
	 * Retrieve the admin profile page URL.
	 */
	public static function profile_page_url() {
		return admin_url( 'profile.php' );
	}

	/**
	 * Builds the "Login to WordPress.com" button that is displayed on the login page as well as user profile page.
	 *
	 * @param  array   $args       An array of arguments to add to the SSO URL.
	 * @param  boolean $is_primary If the button have the `button-primary` class.
	 * @return string              Returns the HTML markup for the button.
	 */
	public function build_sso_button( $args = array(), $is_primary = false ) {
		$url     = $this->build_sso_button_url( $args );
		$classes = $is_primary
		? 'jetpack-sso button button-primary'
		: 'jetpack-sso button';

		return sprintf(
			'<a rel="nofollow" href="%1$s" class="%2$s">%3$s %4$s</a>',
			esc_url( $url ),
			$classes,
			'<span class="genericon genericon-wordpress"></span>',
			esc_html__( 'Log in with WordPress.com', 'jetpack-connection' )
		);
	}

	/**
	 * Builds a URL with `jetpack-sso` action and option args which is used to setup SSO.
	 *
	 * @param  array $args An array of arguments to add to the SSO URL.
	 * @return string       The URL used for SSO.
	 */
	public function build_sso_button_url( $args = array() ) {
		$defaults = array(
			'action' => 'jetpack-sso',
		);

		$args = wp_parse_args( $args, $defaults );

		if ( ! empty( $_GET['redirect_to'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$args['redirect_to'] = rawurlencode( esc_url_raw( wp_unslash( $_GET['redirect_to'] ) ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}

		return add_query_arg( $args, wp_login_url() );
	}

	/**
	 * Retrieves a WordPress.com SSO URL with appropriate query parameters or dies.
	 *
	 * @param  boolean $reauth  If the user be forced to reauthenticate on WordPress.com.
	 * @param  array   $args    Optional query parameters.
	 * @return string            The WordPress.com SSO URL.
	 */
	public function get_sso_url_or_die( $reauth = false, $args = array() ) {
		$custom_login_url = Helpers::get_custom_login_url();
		if ( $custom_login_url ) {
			$args['login_url'] = rawurlencode( $custom_login_url );
		}

		if ( empty( $reauth ) ) {
			$sso_redirect = $this->build_sso_url( $args );
		} else {
			Helpers::clear_wpcom_profile_cookies();
			$sso_redirect = $this->build_reauth_and_sso_url( $args );
		}

		// If there was an error retrieving the SSO URL, then error.
		if ( is_wp_error( $sso_redirect ) ) {
			$error_message = sanitize_text_field(
				sprintf( '%s: %s', $sso_redirect->get_error_code(), $sso_redirect->get_error_message() )
			);
			$tracking      = new Tracking();
			$tracking->record_user_event(
				'sso_login_redirect_failed',
				array(
					'error_message' => $error_message,
				)
			);
			wp_die( esc_html( $error_message ) );
		}

		return $sso_redirect;
	}

	/**
	 * Build WordPress.com SSO URL with appropriate query parameters.
	 *
	 * @param array $args Optional query parameters.
	 * @return string|WP_Error WordPress.com SSO URL
	 */
	public function build_sso_url( $args = array() ) {
		$sso_nonce = ! empty( $args['sso_nonce'] ) ? $args['sso_nonce'] : self::request_initial_nonce();
		$defaults  = array(
			'action'       => 'jetpack-sso',
			'site_id'      => Manager::get_site_id( true ),
			'sso_nonce'    => $sso_nonce,
			'calypso_auth' => '1',
		);

		$args = wp_parse_args( $args, $defaults );

		if ( is_wp_error( $sso_nonce ) ) {
			return $sso_nonce;
		}

		return add_query_arg( $args, 'https://wordpress.com/wp-login.php' );
	}

	/**
	 * Build WordPress.com SSO URL with appropriate query parameters,
	 * including the parameters necessary to force the user to reauthenticate
	 * on WordPress.com.
	 *
	 * @param array $args Optional query parameters.
	 * @return string|WP_Error WordPress.com SSO URL
	 */
	public function build_reauth_and_sso_url( $args = array() ) {
		$sso_nonce = ! empty( $args['sso_nonce'] ) ? $args['sso_nonce'] : self::request_initial_nonce();
		$redirect  = $this->build_sso_url(
			array(
				'force_auth' => '1',
				'sso_nonce'  => $sso_nonce,
			)
		);

		if ( is_wp_error( $redirect ) ) {
			return $redirect;
		}

		$defaults = array(
			'action'       => 'jetpack-sso',
			'site_id'      => Manager::get_site_id( true ),
			'sso_nonce'    => $sso_nonce,
			'reauth'       => '1',
			'redirect_to'  => rawurlencode( $redirect ),
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
	 * @since jetpack-2.6.0
	 *
	 * @param int $wpcom_user_id User ID from WordPress.com.
	 * @return null|object Local user object if found, null if not.
	 */
	public static function get_user_by_wpcom_id( $wpcom_user_id ) {
		$user_query = new WP_User_Query(
			array(
				'meta_key'   => 'wpcom_user_id',
				'meta_value' => (int) $wpcom_user_id,
				'number'     => 1,
			)
		);

		$users = $user_query->get_results();
		return $users ? array_shift( $users ) : null;
	}

	/**
	 * When jetpack-sso-auth-redirect query parameter is set, will redirect user to
	 * WordPress.com authorization flow.
	 *
	 * We redirect here instead of in handle_login() because Jetpack::init()->build_connect_url
	 * calls menu_page_url() which doesn't work properly until admin menus are registered.
	 */
	public function maybe_authorize_user_after_sso() {
		if ( empty( $_GET['jetpack-sso-auth-redirect'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		$redirect_to         = ! empty( $_GET['redirect_to'] ) ? esc_url_raw( wp_unslash( $_GET['redirect_to'] ) ) : admin_url(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$request_redirect_to = ! empty( $_GET['request_redirect_to'] ) ? esc_url_raw( wp_unslash( $_GET['request_redirect_to'] ) ) : $redirect_to; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

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
		 * We remove any other filters that may be turning on the in-place connection
		 * since we will be redirecting the user as opposed to iFraming.
		 */
		remove_all_filters( 'jetpack_use_iframe_authorization_flow' );
		add_filter( 'jetpack_use_iframe_authorization_flow', '__return_false' );

		$connection  = new Manager( 'jetpack-connection' );
		$connect_url = ( new Authorize_Redirect( $connection ) )->build_authorize_url( $redirect_after_auth, 'sso', true );

		add_filter( 'allowed_redirect_hosts', array( Helpers::class, 'allowed_redirect_hosts' ) );
		wp_safe_redirect( $connect_url );
		exit;
	}

	/**
	 * Cache user's display name and Gravatar so it can be displayed on the login screen. These cookies are
	 * stored when the user logs out, and then deleted when the user logs in.
	 */
	public function store_wpcom_profile_cookies_on_logout() {
		$user_id = get_current_user_id();
		if ( ! ( new Manager() )->is_user_connected( $user_id ) ) {
			return;
		}

		$user_data = $this->get_user_data( $user_id );
		if ( ! $user_data ) {
			return;
		}

		setcookie(
			'jetpack_sso_wpcom_name_' . COOKIEHASH,
			$user_data->display_name,
			time() + WEEK_IN_SECONDS,
			COOKIEPATH,
			COOKIE_DOMAIN,
			is_ssl(),
			true
		);

		setcookie(
			'jetpack_sso_wpcom_gravatar_' . COOKIEHASH,
			get_avatar_url(
				$user_data->email,
				array(
					'size'    => 144,
					'default' => 'mystery',
				)
			),
			time() + WEEK_IN_SECONDS,
			COOKIEPATH,
			COOKIE_DOMAIN,
			is_ssl(),
			true
		);
	}

	/**
	 * Determines if a local user is connected to WordPress.com
	 *
	 * @since jetpack-2.8
	 * @param integer $user_id - Local user id.
	 * @return boolean
	 **/
	public function is_user_connected( $user_id ) {
		return $this->get_user_data( $user_id );
	}

	/**
	 * Retrieves a user's WordPress.com data
	 *
	 * @since jetpack-2.8
	 * @param integer $user_id - Local user id.
	 * @return mixed null or stdClass
	 **/
	public function get_user_data( $user_id ) {
		return get_user_meta( $user_id, 'wpcom_user_data', true );
	}
}
