<?php
/**
 * Mock of the wpcom-only Email_Verification class.
 *
 * The real class is a wpcom mu-plugin, absent in the Jetpack test environment,
 * so endpoints that call it (e.g. send-email-preview) would fatal without this.
 * Excluded from Phan analysis in .phan/config.php — Phan has its own stub for
 * the class and would otherwise report a redefinition.
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( 'Email_Verification' ) ) {
	/**
	 * Minimal stand-in that treats the current user as verified.
	 */
	class Email_Verification {
		/**
		 * Whether the email is unverified. Always false in tests.
		 *
		 * @param int|false $user_id     Unused.
		 * @param string    $legacy_type Unused.
		 * @return bool
		 */
		public static function is_email_unverified( $user_id = false, $legacy_type = 'NEWKEY' ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return false;
		}
	}
}
