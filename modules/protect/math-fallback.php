<?php

if ( ! class_exists( 'Jetpack_Protect_Math_Authenticate' ) ) {
	/*
	 * The math captcha fallback if we can't talk to the Protect API
	 */
	class Jetpack_Protect_Math_Authenticate {
		
		static $loaded;

		function __construct() {
			
			if ( self::$loaded ) {
				return;
			}
			
			self::$loaded = 1;
			
			add_action( 'login_form', array( $this, 'math_form' ) );
			
			if( isset( $_POST[ 'jetpack_protect_process_math_form' ] ) ) {
				add_action( 'init', array( $this, 'process_generate_math_page' ) );
			}
		}

		/**
		 * Verifies that a user answered the math problem correctly while logging in.
		 *
		 * @return bool Returns true if the math is correct
		 * @throws Error if insuffient $_POST variables are present.
		 * @throws Error message if the math is wrong
		 */
		static function math_authenticate() {
			$salt        = get_site_option( 'jetpack_protect_key' ) . get_site_option( 'admin_email' );
			$ans         = isset( $_POST['jetpack_protect_num'] ) ? (int) $_POST['jetpack_protect_num'] : '' ;
			$salted_ans  = sha1( $salt . $ans );
			$correct_ans = isset( $_POST[ 'jetpack_protect_answer' ] ) ? $_POST[ 'jetpack_protect_answer' ] : '' ;

			if( isset( $_COOKIE[ 'jpp_math_pass' ] ) ) {
				$transient = Jetpack_Protect_Module::get_transient( 'jpp_math_pass_' . $_COOKIE[ 'jpp_math_pass' ] );
				if( !$transient || $transient < 1 ) {
					Jetpack_Protect_Math_Authenticate::generate_math_page();
				}
				return true;
			}

			if ( ! $correct_ans || !$_POST['jetpack_protect_num'] ) {
				Jetpack_Protect_Math_Authenticate::generate_math_page();
			} elseif ( $salted_ans != $correct_ans ) {
				wp_die( __( '<strong>You failed to correctly answer the math problem.</strong>  This is used to combat spam when the Jetpack Protect API is unavailable.  Please use your browser\'s back button to return to the login form, press the "refresh" button to generate a new math problem, and try to log in again.', 'jetpack' ) );
			} else {
				return true;
			}
		}

		/**
		 * Creates an interim page to collect answers to a math captcha
		 *
		 * @return none, execution stopped
		 */
		static function generate_math_page( $error = false ) {
			$salt = get_site_option( 'jetpack_protect_key' ) . get_site_option( 'admin_email' );
			$num1 = rand( 0, 10 );
			$num2 = rand( 1, 10 );
			$sum  = $num1 + $num2;
			$ans  = sha1( $salt . $sum );
			ob_start();
			?>
			<h2><?php _e( 'Please solve this math problem to prove that you are not a bot.  Once you solve it, you will need to log in again.', 'jetpack' ); ?></h2>
			<?php if ($error): ?>
				<h3><?php _e( 'Your answer was incorrect, please try again.', 'jetpack' ); ?></h3>
			<?php endif ?>

			<form action="<?php echo wp_login_url(); ?>" method="post" accept-charset="utf-8">
				<?php Jetpack_Protect_Math_Authenticate::math_form(); ?>
				<input type="hidden" name="jetpack_protect_process_math_form" value="1" id="jetpack_protect_process_math_form" />
				<p><input type="submit" value="<?php esc_html_e( 'Continue &rarr;', 'jetpack' ); ?>"></p>
			</form>
		<?php
			$mathage = ob_get_contents();
			ob_end_clean();
			wp_die( $mathage );
		}

		public function process_generate_math_page() {
			$salt        = get_site_option( 'jetpack_protect_key' ) . get_site_option( 'admin_email' );
			$ans         = (int)$_POST['jetpack_protect_num'];
			$salted_ans  = sha1( $salt . $ans );
			$correct_ans = $_POST[ 'jetpack_protect_answer' ];

			if ( $salted_ans != $correct_ans ) {
				Jetpack_Protect_Math_Authenticate::generate_math_page(true);
			} else {
				$temp_pass = substr( sha1( rand( 1, 100000000 ) . get_site_option( 'jetpack_protect_key' ) ), 5, 25 );
				Jetpack_Protect_Module::set_transient( 'jpp_math_pass_' . $temp_pass, 3, DAY_IN_SECONDS );
				setcookie('jpp_math_pass', $temp_pass, time() + DAY_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, false);
				return true;
			}
		}

		/**
		 * Requires a user to solve a simple equation. Added to any WordPress login form.
		 *
		 * @return VOID outputs html
		 */
		static function math_form() {
			$salt = get_site_option( 'jetpack_protect_key' ) . get_site_option( 'admin_email' );
			$num1 = rand( 0, 10 );
			$num2 = rand( 1, 10 );
			$sum  = $num1 + $num2;
			$ans  = sha1( $salt . $sum );
			?>
			<div style="margin: 5px 0 20px;">
				<strong><?php esc_html_e( 'Prove your humanity:', 'jetpack' ); ?> </strong>
				<?php echo $num1 ?> &nbsp; + &nbsp; <?php echo $num2 ?> &nbsp; = &nbsp;
				<input type="input" name="jetpack_protect_num" value="" size="2" />
				<input type="hidden" name="jetpack_protect_answer" value="<?php echo $ans; ?>" />
			</div>
		<?php
		}

	}
}
