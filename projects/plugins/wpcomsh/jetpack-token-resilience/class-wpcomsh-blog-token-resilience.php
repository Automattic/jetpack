<?php
/**
 * Improves Blog token resilience by falling back to the token present in the Persistent Data if available.
 *
 * @package wpcomsh
 */

/**
 * Class WPCOMSH_Blog_Token_Resilience.
 */
class WPCOMSH_Blog_Token_Resilience {

	/**
	 * Filters the Jetpack::get_option method and looks for the blog token in Persistent Data if not available in the database.
	 *
	 * @param string $value The option name.
	 * @param string $name  The option value found in the database.
	 * @return string
	 */
	public static function filter_get_option( $value, $name ) {
		if ( 'blog_token' !== $name ) {
			return $value;
		}
		$persistent_blog_token = ( new Atomic_Persistent_Data() )->JETPACK_BLOG_TOKEN;

		if ( $persistent_blog_token ) {
			return $persistent_blog_token;
		}

		return $value;
	}
}
add_filter( 'jetpack_options', array( 'WPCOMSH_Blog_Token_Resilience', 'filter_get_option' ), 10, 2 );
