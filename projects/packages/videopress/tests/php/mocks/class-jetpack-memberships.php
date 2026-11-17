<?php
/**
 * Test double for the Jetpack plugin's memberships class.
 *
 * Posts are open to everybody unless a test sets `$GLOBALS['__vp_memberships_access_level']`;
 * visitors hold no membership unless a test sets `$GLOBALS['__vp_memberships_has_access']`.
 *
 * @package automattic/jetpack-videopress
 */

if ( ! class_exists( 'Jetpack_Memberships' ) ) {
	/**
	 * Memberships double driven by globals.
	 */
	class Jetpack_Memberships {
		/**
		 * Who the post is for.
		 *
		 * @return string
		 */
		public static function get_post_access_level() {
			return $GLOBALS['__vp_memberships_access_level'] ?? 'everybody';
		}

		/**
		 * Whether the visitor holds the membership the post asks for.
		 *
		 * @return bool
		 */
		public static function user_has_subscription_access() {
			return ! empty( $GLOBALS['__vp_memberships_has_access'] );
		}
	}
}
