<?php
/**
 * Stand-in for the wpcomsh function that reads an Atomic site's purchases.
 *
 * @package automattic/jetpack-plans
 */

if ( ! function_exists( 'wpcom_get_site_purchases' ) ) {
	/**
	 * The purchases wpcomsh keeps in sync on an Atomic site.
	 *
	 * @param int $blog_id Blog ID.
	 * @return object[]
	 */
	function wpcom_get_site_purchases( $blog_id = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- the signature mirrors wpcomsh's.
		return array( (object) array( 'product_slug' => 'personal-bundle' ) );
	}
}
