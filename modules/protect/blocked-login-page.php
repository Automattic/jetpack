<?php


/**
 * Class Jetpack_Protect_Blocked_Login_Page
 *
 * Instanciated on the wp-login page when Jetpack modules are loaded and $pagenow
 * is available, or during the login_head hook.
 *
 * Class will only be instanciated if Protect has detected a hard blocked IP address.
 *
 *
 */
class Jetpack_Protect_Blocked_Login_Page {

	private static $__instance = null;
	public $can_send_recovery_emails;
	public $ip_address;
	public $valid_blocked_user_id;
	public $page_title;
	public $email_address;
	const HELP_URL = 'https://jetpack.com/support/security-features/#unblock';
	const HTTP_STATUS_CODE_TOO_MANY_REQUESTS = 429;

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance( $ip_address ) {
		if ( ! is_a( self::$__instance, 'Jetpack_Protect_Blocked_Login_Page' ) ) {
			self::$__instance = new Jetpack_Protect_Blocked_Login_Page( $ip_address );
		}

		return self::$__instance;
	}


	function __construct( $ip_address ) {
		/**
		 * Filter controls if an email recovery form is shown to blocked IPs.
		 *
		 * A recovery form allows folks to re-gain access to the login form
		 * via an email link if their IP was mistakenly blocked.
		 *
		 * @module protect
		 *
		 * @since 5.6
		 *
		 * @param bool $can_send_recovery_emails Defaults to true.
		 */
		$this->can_send_recovery_emails = apply_filters( 'jetpack_protect_can_send_recovery_emails', true );
		$this->ip_address               = $ip_address;

		add_filter( 'wp_authenticate_user', array( $this, 'check_valid_blocked_user' ), 10, 1 );
		add_filter( 'site_url', array( $this, 'add_args_to_login_post_url' ), 10, 3 );
		add_filter( 'network_site_url', array( $this, 'add_args_to_login_post_url' ), 10, 3 );
		add_filter( 'lostpassword_url', array( $this, 'add_args_to_lostpassword_url' ), 10, 2 );
		add_filter( 'login_url', array( $this, 'add_args_to_login_url' ), 10, 3 );
		add_filter( 'lostpassword_redirect', array( $this, 'add_args_to_lostpassword_redirect_url' ), 10, 1 );
	}

	public function add_args_to_lostpassword_redirect_url( $url ) {
		if ( $this->valid_blocked_user_id ) {
			$url = empty( $url ) ? wp_login_url() : $url;
			$url = add_query_arg(
				array(
					'validate_jetpack_protect_recovery' => $_GET['validate_jetpack_protect_recovery'],
					'user_id'                           => $_GET['user_id'],
					'checkemail'                        => 'confirm',
				),
				$url
			);
		}

		return $url;
	}

	public function add_args_to_lostpassword_url( $url, $redirect ) {
		if ( $this->valid_blocked_user_id ) {
			$args = array(
				'validate_jetpack_protect_recovery' => $_GET['validate_jetpack_protect_recovery'],
				'user_id'                           => $_GET['user_id'],
				'action'                            => 'lostpassword',
			);
			if ( ! empty( $redirect ) ) {
				$args['redirect_to'] = $redirect;
			}
			$url = add_query_arg( $args, $url );
		}

		return $url;
	}

	public function add_args_to_login_post_url( $url, $path, $scheme ) {
		if ( $this->valid_blocked_user_id && ( 'login_post' === $scheme || 'login' === $scheme ) ) {
			$url = add_query_arg(
				array(
					'validate_jetpack_protect_recovery' => $_GET['validate_jetpack_protect_recovery'],
					'user_id'                           => $_GET['user_id'],
				),
				$url
			);

		}

		return $url;
	}

	public function add_args_to_login_url( $url, $redirect, $force_reauth ) {
		if ( $this->valid_blocked_user_id ) {
			$args = array(
				'validate_jetpack_protect_recovery' => $_GET['validate_jetpack_protect_recovery'],
				'user_id'                           => $_GET['user_id'],
			);

			if ( ! empty( $redirect ) ) {
				$args['redirect_to'] = $redirect;
			}

			if ( ! empty( $force_reauth ) ) {
				$args['reauth'] = '1';
			}
			$url = add_query_arg( $args, $url );
		}

		return $url;
	}

	public function check_valid_blocked_user( $user ) {
		if ( $this->valid_blocked_user_id && $this->valid_blocked_user_id != $user->ID ) {
			return new WP_Error( 'invalid_recovery_token', __( 'The recovery token is not valid for this user.', 'jetpack' ) );
		}

		return $user;
	}

	public function is_blocked_user_valid() {
		if ( ! $this->can_send_recovery_emails ) {
			return false;
		}

		if ( $this->valid_blocked_user_id ) {
			return true;
		}

		if ( ! isset( $_GET['validate_jetpack_protect_recovery'], $_GET['user_id'] ) ) {
			return false;
		}

		if ( ! $this->is_valid_protect_recovery_key( $_GET['validate_jetpack_protect_recovery'], $_GET['user_id'] ) ) {
			return false;
		}

		$this->valid_blocked_user_id = (int) $_GET['user_id'];

		return true;
	}

	public function is_valid_protect_recovery_key( $key, $user_id ) {

		$path     = sprintf( '/sites/%d/protect/recovery/confirm', Jetpack::get_option( 'id' ) );
		$response = Jetpack_Client::wpcom_json_api_request_as_blog(
			$path,
			'1.1',
			array(
				'method' => 'post'
			),
			array(
				'token'   => $key,
				'user_id' => $user_id,
				'ip'      => $this->ip_address,
			)
		);

		$result = json_decode( wp_remote_retrieve_body( $response ) );

		if ( is_wp_error( $result ) || empty( $result ) || isset( $result->error ) ) {
			return false;
		}

		return true;
	}

	public function render_and_die() {
		$this->page_title = __( 'Login Blocked by Jetpack', 'jetpack' );

		if ( ! $this->can_send_recovery_emails ) {
			$this->render_blocked_login_message();

			return;
		}

		if ( isset( $_GET['validate_jetpack_protect_recovery'] ) && $_GET['user_id'] ) {
			$this->protect_die( __( 'Could not validate recovery token.', 'jetpack' ) );

			return;
		}

		if (
			isset( $_GET['jetpack-protect-recovery'] ) &&
			isset( $_POST['_wpnonce'] ) &&
			wp_verify_nonce( $_POST['_wpnonce'], 'bypass-protect' )
		) {
			$this->process_recovery_email();

			return;
		}

		if ( isset( $_GET['loggedout'] ) && 'true' === $_GET['loggedout'] ) {
			$this->protect_die( __( 'You successfully logged out.', 'jetpack' ) );
		}

		$this->render_recovery_form();
	}

	public function render_blocked_login_message() {
		$this->protect_die( $this->get_html_blocked_login_message() );
	}

	function process_recovery_email() {
		$sent = $this->send_recovery_email();

		if ( is_wp_error( $sent ) ) {
			$this->protect_die( $sent, true );
		} else {
			$this->render_recovery_success();
		}
	}

	function send_recovery_email() {
		$email = isset( $_POST['email'] ) ? $_POST['email'] : '';
		if ( sanitize_email( $email ) !== $email || ! is_email( $email ) ) {
			return new WP_Error( 'invalid_email', __( "Oops, looks like that's not the right email address. Please try again!", 'jetpack' ) );
		}
		$user = get_user_by( 'email', trim( $email ) );

		if ( ! $user ) {
			return new WP_Error( 'invalid_user', __( 'Oops, could not find a user with that email address.', 'jetpack' ) );
		}
		$this->email_address = $email;
		$path                = sprintf( '/sites/%d/protect/recovery/request', Jetpack::get_option( 'id' ) );


		$response = Jetpack_Client::wpcom_json_api_request_as_blog(
			$path,
			'1.1',
			array(
				'method' => 'post'
			),
			array(
				'user_id' => $user->ID,
				'ip'      => $this->ip_address
			)
		);

		$code   = wp_remote_retrieve_response_code( $response );
		$result = json_decode( wp_remote_retrieve_body( $response ) );

		if ( self::HTTP_STATUS_CODE_TOO_MANY_REQUESTS === $code ) {
			return new WP_Error( 'email_already_sent', __( 'An email was already sent to this address.', 'jetpack' ) );
		} else if ( is_wp_error( $result ) || empty( $result ) || isset( $result->error ) ) {
			return new WP_Error( 'email_send_error', __( 'There was an error sending your email.', 'jetpack' ) );
		}

		return true;
	}

	function protect_die( $content, $back_link = false ) {
		$image = sprintf(
			'<img src="%s" width="180" style="display: block; margin: 0 auto;" />',
			plugins_url( 'modules/protect/jetpack-security.png', JETPACK__PLUGIN_FILE )
		);

		if ( is_wp_error( $content ) ) {
			$content = $content->get_error_message();
		}
		// hack to get around default wp_die_handler. https://core.trac.wordpress.org/browser/tags/4.8.1/src/wp-includes/functions.php#L2698
		$content = $image . '</p> ' . $content . '<p>';

		if ( isset( $_GET['interim-login'] ) ) {
			$content = "<style>html{ background-color: #fff; } #error-page { margin:0 auto; padding: 1em; box-shadow: none; } </style>" . $content;
		}

		wp_die( $content, $this->page_title, array( 'back_link' => $back_link, 'response' => 200 ) );
	}

	function render_recovery_form() {
		$content = $this->get_html_blocked_login_message() . $this->get_html_recovery_form();
		$this->protect_die( $content );
	}

	function render_recovery_success() {
		$this->protect_die( sprintf( __( 'An email with recovery instructions was sent to %s.', 'jetpack' ), $this->email_address ) );
	}


	function get_html_blocked_login_message() {
		$icon = '<svg class="gridicon gridicons-spam" style="fill:#d94f4f" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M17 2H7L2 7v10l5 5h10l5-5V7l-5-5zm-4 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"/></g></svg>';
		$ip = str_replace( 'http://', '', esc_url( 'http://' . $this->ip_address ) );
		ob_start(); ?>
        <h3><?php printf( __( 'Jetpack Protect has locked your site\'s login page.', 'jetpack' ) ); ?></h3>
		<?php printf(
			__( '<p><span style="float:left; display:block; margin-right:10px;">%1$s</span>Your IP (%2$s) has been flagged for potential security violations. <a href="%3$s">Learn More</a></p>', 'jetpack' ),
			$icon,
			$ip,
			esc_url( self::HELP_URL )
		);

		$contents = ob_get_contents();
		ob_end_clean();

		return $contents;
	}

	function get_html_recovery_form() {
		ob_start(); ?>
        <div style="margin-top:100px;">
            <p><?php _e( 'Email yourself a special link to regain access the login form.', 'jetpack' ); ?></p>
            <form method="post" action="?jetpack-protect-recovery=true">
				<?php echo wp_nonce_field( 'bypass-protect' ); ?>
                <p><label for="email" style="font-size:12px;">Email Address<br/></label>
                    <input type="email" name="email" style="font-size:24px; padding:3px; margin: 2px 6px 16px 0; width:100%; border: 1px solid #ddd;
    box-shadow: inset 0 1px 2px rgba(0,0,0,.07);"/>
                    <input type="submit" class="button button-primary button-large"
                           value="<?php echo esc_attr( __( 'Send', 'jetpack' ) ); ?>"/>
                </p>
            </form>
        </div>

		<?php
		$contents = ob_get_contents();
		ob_end_clean();

		return $contents;
	}
}
