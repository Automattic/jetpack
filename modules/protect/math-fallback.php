<?php

if ( !class_exists( 'Jetpack_Protect_Math_Authenticate' ) ) {
	class Jetpack_Protect_Math_Authenticate {

		function __construct() {
			add_action( 'login_form', array( $this, 'math_form' ) );
		}

		/**
		 * Verifies that a user answered the math problem correctly while loggin in.
		 *
		 * @return bool Returns true if the math is correct
		 * @throws Error if insuffient $_POST variables are present.
		 * @throws Error message if the math is wrong
		 */
		static function math_authenticate() {
			$salt           = get_site_option( 'jetpack_protect_key' ) . get_site_option( 'admin_email' );
			$ans            = (int)$_POST[ 'jetpack_protect_num' ];
			$salted_ans     = sha1( $salt . $ans );
			$correct_ans    = $_POST[ 'jetpack_protect_answer' ];

			if ( ! $correct_ans && ! isset( $_POST[ 'jetpack_protect_answer' ] ) ) {
				// TODO: Sam, we need to rethink this error message
				wp_die( __( '<strong>This site is not properly configured.</strong> Please ask this site\'s web developer to review <a href="http://bruteprotect.com/faqs/error-bp100/">for information on how to resolve this issue</a>.' ) );
			} elseif ( $salted_ans != $correct_ans ) {
				wp_die( __( '<strong>You failed to correctly answer the math problem.</strong>  This is used to combat spam when the Jetpack Protect API is unavailable.  Please use your browser\'s back button to return to the login form, press the "refresh" button to generate a new math problem, and try to log in again.' ) );
			} else {
				return true;
			}
		}

		/**
		 * Requires a user to solve a simple equation. Added to any WordPress login form.
		 *
		 * @return VOID outputs html
		 */
		static function math_form()
		{
			$salt = get_site_option( 'jetpack_protect_key' ) . get_site_option( 'admin_email' );
			$num1 = rand( 0, 10 );
			$num2 = rand( 1, 10 );
			$sum = $num1 + $num2;
			$ans = sha1( $salt . $sum );
			?>
			<div style="margin: 5px 0 20px;">
				<strong>Prove your humanity: </strong>
				<?php echo $num1 ?> &nbsp; + &nbsp; <?php echo $num2 ?> &nbsp; = &nbsp;
				<input type="input" name="jetpack_protect_num" value="" size="2" />
				<input type="hidden" name="jetpack_protect_answer" value="<?php echo $ans; ?>" />
			</div>
		<?php
		}

	}
}