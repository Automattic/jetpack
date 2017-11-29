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
			$this->protect_die( __( 'Oops, we couldn’t validate the recovery token.', 'jetpack' ) );

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
		$show_recovery_form = true;
		if ( is_wp_error( $sent ) ) {
			if( $sent->get_error_code() !== 'email_already_sent' ) {
				$show_recovery_form = true;
			}
			$this->protect_die( $sent,  null,true, $show_recovery_form );
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
			return new WP_Error( 'invalid_user', __( 'Oops, we couldn’t find a user with that email. Please try again!', 'jetpack' ) );
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
			return new WP_Error( 'email_already_sent', sprintf( __( 'Recovery instructions were sent to %s. Check your inbox!', 'jetpack' ), $this->email_address ) );
		} else if ( is_wp_error( $result ) || empty( $result ) || isset( $result->error ) ) {
			return new WP_Error( 'email_send_error', __( 'Oops, we were unable to send a recovery email. Try again.', 'jetpack' ) );
		}

		return true;
	}

	function protect_die( $content, $title = null, $back_link = false, $recovery_form = false ) {
		if( empty( $title ) ) {
			$title = __( 'Jetpack has locked your site\'s login page.', 'jetpack' );
		}
		if ( is_wp_error( $content ) ) {
			$content = $content->get_error_message();
		}
		$content =  '<p>'. $content .'</p>';

		// If for some reason the login pop up box show up in the wp-admin.
		if ( isset( $_GET['interim-login'] ) ) {
			$content = "<style>html{ background-color: #fff; } #error-message { margin:0 auto; padding: 1em; box-shadow: none; } </style>" . $content;
		}

		$this->display_page( $title, $content, 'error message goes here', $back_link, $recovery_form );
	}

	function render_recovery_form() {
		$content = $this->get_html_blocked_login_message();
		$this->protect_die( $content, null, null, true );
	}

	function render_recovery_success() {
		$this->protect_die( sprintf( __( 'Recovery instructions were sent to %s. Check your inbox!', 'jetpack' ), $this->email_address ) );
	}


	function get_html_blocked_login_message() {
		$icon = '<svg class="gridicon gridicons-spam" style="fill:#d94f4f" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M17 2H7L2 7v10l5 5h10l5-5V7l-5-5zm-4 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"/></g></svg>';
		$ip = str_replace( 'http://', '', esc_url( 'http://' . $this->ip_address ) );
		return sprintf(
			__( '<p>Your IP address <code>%2$s</code> has been flagged for potential security violations. You can unlock your login by sending yourself a special link via email. <a href="%3$s">Learn More</a></p>', 'jetpack' ),
			$icon,
			$ip,
			esc_url( self::HELP_URL )
		);
	}

	function get_html_recovery_form() {
		ob_start(); ?>
        <div>
            <form method="post" action="?jetpack-protect-recovery=true">
				<?php echo wp_nonce_field( 'bypass-protect' ); ?>
                <p><label for="email">Your email<br/></label>
                    <input type="email" name="email" class="text-input"/>
                    <input type="submit" class="button"
                           value="<?php echo esc_attr( __( 'Send email', 'jetpack' ) ); ?>"/>
                </p>
            </form>
        </div>

		<?php
		$contents = ob_get_contents();
		ob_end_clean();

		return $contents;
	}

	function display_page( $title, $message, $error, $back_button = false, $recovery_form = false ) {

		if ( ! headers_sent() ) {
			status_header( 500 );
			nocache_headers();
			header( 'Content-Type: text/html; charset=utf-8' );
		}

		$text_direction = 'ltr';
		if ( is_rtl() ) {
			$text_direction = 'rtl';
		}
		?>
		<!DOCTYPE html>
		<html xmlns="http://www.w3.org/1999/xhtml" <?php if ( function_exists( 'language_attributes' ) && function_exists( 'is_rtl' ) ) {
			language_attributes();
		} else {
			echo "dir='$text_direction'";
		} ?>>
		<head>
			<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
			<meta name="viewport" content="width=device-width">
			<?php
			if ( function_exists( 'wp_no_robots' ) ) {
				wp_no_robots();
			}
			?>
			<title><?php echo $title ?></title>
			<style type="text/css">
				html {
					background: #f3f6f8;
				}

				body {
					color: #2e4453;
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
					margin: 2em auto;
					padding: 1em 2em;
					max-width: 460px;
					}

				h1 {
					clear: both;
					color: #3d596d;
					font-size: 24px;
					margin:0 0 24px 0;
					padding: 0;
					font-weight: 400;
				}

				#error-message {
					box-sizing: border-box;
					background: white;
					box-shadow: 0 0 0 1px rgba(200, 215, 225, 0.5), 0 1px 2px #e9eff3;
					padding:32px;
				}

				#error-message img {
					margin: 0 auto;
					display: block;
				}

				#error-page {
					margin-top: 50px;
				}

				#error-page p {
					font-size: 14px;
					line-height: 1.5;
					margin: 25px 0 20px;
				}

				#error-page code {
					font-family: Consolas, Monaco, monospace;
				}

				ul li {
					margin-bottom: 10px;
					font-size: 14px;
				}

				a {
					color: #00aadc;
				}

				label {
					font-weight: bold;
					font-size:16px;
				}

				a:hover,
				a:active {
					color: #0085be;
				}

				a:focus {
					color: #124964;
					-webkit-box-shadow: 0 0 0 1px #5b9dd9,
					0 0 2px 1px rgba(30, 140, 190, .8);
					box-shadow: 0 0 0 1px #5b9dd9,
					0 0 2px 1px rgba(30, 140, 190, .8);
					outline: none;
				}

				.button {
					background: #00aadc;
					color: white;
					border-color: #008ab3;
					border-style: solid;
					border-width: 1px 1px 2px;
					cursor: pointer;
					display: inline-block;
					margin: 0;
					margin-right: 0px;
					outline: 0;
					overflow: hidden;
					font-weight: 500;
					text-overflow: ellipsis;
					text-decoration: none;
					vertical-align: top;
					box-sizing: border-box;
					font-size: 14px;
					line-height: 21px;
					border-radius: 4px;
					padding: 7px 14px 9px;
					-webkit-appearance: none;
					-moz-appearance: none;
					appearance: none;
					font-size: 14px;
					width: 100%;
				}

				.button:hover,
				.button:focus {
					border-color: #005082;
					outline: none;
				}

				.button:focus {
					border-color: #005082;
					-webkit-box-shadow: 0 0 3px rgba(0, 115, 170, .8);
					box-shadow: 0 0 3px rgba(0, 115, 170, .8);
					outline: none;
				}
				.button::-moz-focus-inner {
					border: 0;
				}

				.button:active {
					border-width: 2px 1px 1px;
				}
				.gridicon {
					fill: currentColor;
					vertical-align: middle;
				}
				#error-footer {
					padding: 16px;
				}
				#error-footer a {
					text-decoration: none;
					line-height:20px;
					font-size: 14px;
					color: #4f748e;
				}
				#error-footer a:hover {
					color: #2e4453;
				}
				#error-footer .gridicon{
					width: 16px;
				}
				#error-footer .gridicons-help {
					width: 24px;
					margin-right:8px;
				}

				.text-input {
					margin: 0;
					padding: 7px 14px;
					width: 100%;
					color: #2e4453;
					font-size: 16px;
					line-height: 1.5;
					border: 1px solid #c8d7e1;
					background-color: white;
					transition: all .15s ease-in-out;
					box-sizing: border-box;
					margin: 8px 0 16px;
				}

				<?php
				if ( 'rtl' == $text_direction ) {
					echo 'body { font-family: Tahoma, Arial; }';
				}
				?>
			</style>
		</head>
		<body id="error-page">
			<h1 id="error-title"><?php echo esc_html( $title ); ?></h1>
			<div id="error-message">
				<?php echo $message; ?>
				<?php if ( $recovery_form ) {
					echo $this->get_html_recovery_form();
				} ?>
			</div>
			<div id="error-footer">
			<?php if ( $back_button && ! $recovery_form ) {
				$back_button_icon = '<svg class="gridicon gridicons-arrow-left" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></g></svg>';
			?>
				<a href='javascript:history.back()'><?php printf( __( '%s Back' ), $back_button_icon ); ?></a>
			<?php } else {
				$help_icon = '<svg class="gridicon gridicons-help" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 16h-2v-2h2v2zm0-4.14V15h-2v-2c0-.552.448-1 1-1 1.103 0 2-.897 2-2s-.897-2-2-2-2 .897-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.862-1.278 3.413-3 3.86z"/></g></svg>';?>
					<a href="<?php echo esc_url( self::HELP_URL ); ?>" target="_blank"><?php printf( __( '%s Get help unlocking your site' ), $help_icon );?></a>
			<?php } ?>
			</div>
		</body>
		</html>
		<?php
		die();
	}
}
