<?php
/**
 * Stand-in for the wpcomsh function that reads an Atomic site's purchases.
 *
 * @package automattic/jetpack-stats-admin
 */

if ( ! function_exists( 'wpcom_get_site_purchases' ) ) {
	/**
	 * The purchases wpcomsh keeps in sync on an Atomic site.
	 *
	 * @param int $blog_id Blog ID.
	 * @throws \Error When asked for a site other than the current one, as wpcomsh does.
	 * @return object[]
	 */
	function wpcom_get_site_purchases( $blog_id = 0 ) {
		if ( $blog_id && (int) $blog_id !== WPCOM_TEST_BLOG_ID ) {
			throw new Error( 'Atomic sites do not support looking up features for sites other than the current site.' );
		}

		return $GLOBALS['wpcom_test_site_purchases'];
	}

	// A site holding one plan. A test covering an unsynced registry empties this.
	$GLOBALS['wpcom_test_site_purchases'] = array( (object) array( 'product_slug' => 'personal-bundle' ) );
}
