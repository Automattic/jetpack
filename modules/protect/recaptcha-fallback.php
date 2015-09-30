<?php

if ( ! class_exists( 'Jetpack_Protect_Recaptcha_Fallback' ) ) {
	/*
	 * The recaptcha fallback if we can't talk to the Protect API and recapcha
	 * keys are defined
	 */
	class Jetpack_Protect_Recaptcha_Fallback {

		static $loaded;

		function __construct() {

			if ( self::$loaded ) {
				return;
			}

			self::$loaded = 1;

			add_action( 'login_form', array( $this, 'recaptcha_form' ) );

			if( isset( $_POST[ 'jetpack_protect_process_recaptcha_form' ] ) ) {
				add_action( 'init', array( $this, 'process_generate_recaptcha_page' ) );
			}

			require_once plugin_dir_path( __FILE__ ) . '../sharedaddy/recaptcha.php';
		}

		/**
		 * Verifies that a user answered correctly the recaptcha challenge while logging in.
		 *
		 * @return bool Returns true if the math is correct
		 * @throws Error if insuffient $_POST variables are present.
		 * @throws Error message if the math is wrong
		 */
		static function recaptcha_authenticate() {
			$recaptcha_response = isset( $_POST['g-recaptcha-response'] ) ? $_POST['g-recaptcha-response'] : '' ;

			if( isset( $_COOKIE[ 'jpp_fallback_pass' ] ) ) {
				$transient = Jetpack_Protect_Module::get_transient( 'jpp_fallback_pass_' . $_COOKIE[ 'jpp_fallback_pass' ] );
				if( !$transient || $transient < 1 ) {
					Jetpack_Protect_Recaptcha_Fallback::generate_recaptcha_page();
				}
				return true;
			}

			$recaptcha = new Jetpack_ReCaptcha( RECAPTCHA_PUBLIC_KEY, RECAPTCHA_PRIVATE_KEY );
			$result    = $recaptcha->verify( $recaptcha_response, $_SERVER['REMOTE_ADDR'] );

			if ( empty( $recaptcha_response ) ) {
				Jetpack_Protect_Recaptcha_Fallback::generate_recaptcha_page();
			} elseif ( $result !== true ) {
				wp_die(
				__( '<strong>You failed to correctly answer the recaptcha challenge.</strong>  This is used to combat spam when the Protect API is unavailable.  Please use your browser\'s back button to return to the login form, press the "refresh" button to generate a new challenge, and try to log in again.', 'jetpack' ),
				'',
				401
				);
			} else {
				return true;
			}
		}

		/**
		 * Creates an interim page to show a recaptcha challenge
		 *
		 * @return none, execution stopped
		 */
		static function generate_recaptcha_page( $error = false ) {
			ob_start();
			?>
			<h2><?php _e( 'Please solve this captcha to prove that you are not a bot.  Once you solve it, you will need to log in again.', 'jetpack' ); ?></h2>
			<?php if ($error): ?>
				<h3><?php _e( 'Your answer was incorrect, please try again.', 'jetpack' ); ?></h3>
			<?php endif ?>

			<form action="<?php echo wp_login_url(); ?>" method="post" accept-charset="utf-8">
				<?php Jetpack_Protect_Recaptcha_Fallback::recaptcha_form(true); ?>
				</div>
				<input type="hidden" name="jetpack_protect_process_recaptcha_form" value="1" id="jetpack_protect_process_recaptcha_form" />
				<p><input type="submit" value="<?php esc_html_e( 'Continue &rarr;', 'jetpack' ); ?>"></p>
			</form>
			<?php
			$recaptchapage = ob_get_contents();
			ob_end_clean();
			wp_die( $recaptchapage );
		}

		public function process_generate_recaptcha_page() {
			$recaptcha = new Jetpack_ReCaptcha( RECAPTCHA_PUBLIC_KEY, RECAPTCHA_PRIVATE_KEY );
			$response  = ! empty( $_POST['g-recaptcha-response'] ) ? $_POST['g-recaptcha-response'] : '';
			$result    = $recaptcha->verify( $response, $_SERVER['REMOTE_ADDR'] );

			if ( true === $result ) {
				$temp_pass = substr( sha1( rand( 1, 100000000 ) . get_site_option( 'jetpack_protect_key' ) ), 5, 25 );
				Jetpack_Protect_Module::set_transient( 'jpp_fallback_pass_' . $temp_pass, 3, DAY_IN_SECONDS );
				setcookie('jpp_fallback_pass_', $temp_pass, time() + DAY_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, false);
				return true;
			} else {
				Jetpack_Protect_Recaptcha_Fallback::generate_recaptcha_page(true);
			}
		}

		/**
		 * Requires a user to solve recaptcha challenge. Added to any WordPress login form.
		 *
		 * @param boolean $is_form_page
		 *
		 * @return VOID outputs html
		 */
		static function recaptcha_form( $is_form_page = false ) {
			$options = array(
				'tag_attributes' => array(
					'size'     => ! $is_form_page ? 'compact' : 'normal',
				),
			);

			$recaptcha = new Jetpack_ReCaptcha( RECAPTCHA_PUBLIC_KEY, RECAPTCHA_PRIVATE_KEY, $options );
			if ( ! $is_form_page) :
			?>
			<div style="    margin: 0 auto; width: 164px;">
			<?php
			endif;
			echo $recaptcha->get_recaptcha_html(); // xss ok
			if ( ! $is_form_page ) :
			?>
			</div>
			<?php
			endif;
		}
	}
}
