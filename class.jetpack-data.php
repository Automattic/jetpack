<?php

class Jetpack_Data {
	/*
	 * Used internally when we want to look for the Normal Blog Token
	 * without knowing its token key ahead of time.
	 */
	const MAGIC_NORMAL_TOKEN_KEY = ';normal;';

	/**
	 * Gets the requested token.
	 *
	 * Tokens are one of two types:
	 * 1. Blog Tokens: These are the "main" tokens. Each site typically has one Blog Token,
	 *    though some sites can have multiple "Special" Blog Tokens (see below). These tokens
	 *    are not associated with a user account. They represent the site's connection with
	 *    the Jetpack servers.
	 * 2. User Tokens: These are "sub-"tokens. Each connected user account has one User Token.
	 *
	 * All tokens look like "{$token_key}.{$private}". $token_key is a public ID for the
	 * token, and $private is a secret that should never be displayed anywhere or sent
	 * over the network; it's used only for signing things.
	 *
	 * Blog Tokens can be "Normal" or "Special".
	 * * Normal: The result of a normal connection flow. They look like
	 *   "{$random_string_1}.{$random_string_2}"
	 *   That is, $token_key and $private are both random strings.
	 *   Sites only have one Normal Blog Token. Normal Tokens are found in either
	 *   Jetpack_Options::get_option( 'blog_token' ) (usual) or the JETPACK_BLOG_TOKEN
	 *   constant (rare).
	 * * Special: A connection token for sites that have gone through an alternative
	 *   connection flow. They look like:
	 *   ";{$special_id}{$special_version};{$wpcom_blog_id};.{$random_string}"
	 *   That is, $private is a random string and $token_key has a special structure with
	 *   lots of semicolons.
	 *   Most sites have zero Special Blog Tokens. Special tokens are only found in the
	 *   JETPACK_BLOG_TOKEN constant.
	 *
	 * In particular, note that Normal Blog Tokens never start with ";" and that
	 * Special Blog Tokens always do.
	 *
	 * When searching for a matching Blog Tokens, Blog Tokens are examined in the following
	 * order:
	 * 1. Defined Special Blog Tokens (via the JETPACK_BLOG_TOKEN constant)
	 * 2. Stored Normal Tokens (via Jetpack_Options::get_option( 'blog_token' ))
	 * 3. Defined Normal Tokens (via the JETPACK_BLOG_TOKEN constant)
	 *
	 * @deprecated 7.5 Use Connection_Manager instead
	 *
	 * @param int|false    $user_id   false: Return the Blog Token. int: Return that user's User Token.
	 * @param string|false $token_key If provided, check that the token matches the provided input.
	 *                                false                                : Use first token. Default.
	 *                                Jetpack_Data::MAGIC_NORMAL_TOKEN_KEY : Use first Normal Token.
	 *                                non-empty string                     : Use matching token
	 * @return object|false
	 */
	public static function get_access_token( $user_id = false, $token_key = false ) {
		_deprecated_function( __METHOD__, '7.5', 'Connection_Manager' );
		$connection_manager = new Connection_Manager();
		return $connection_manager->get_access_token( $user_id, $token_key );
	}

	/**
	 * This function mirrors Jetpack_Data::is_usable_domain() in the WPCOM codebase.
	 *
	 * @param $domain
	 * @param array $extra
	 *
	 * @deprecated
	 *
	 * @return bool|WP_Error
	 */
	public static function is_usable_domain( $domain, $extra = array() ) {

		// If it's empty, just fail out.
		if ( ! $domain ) {
			return new WP_Error( 'fail_domain_empty', sprintf( __( 'Domain `%1$s` just failed is_usable_domain check as it is empty.', 'jetpack' ), $domain ) );
		}

		/**
		 * Skips the usuable domain check when connecting a site.
		 *
		 * Allows site administrators with domains that fail gethostname-based checks to pass the request to WP.com
		 *
		 * @since 4.1.0
		 *
		 * @param bool If the check should be skipped. Default false.
		 */
		if ( apply_filters( 'jetpack_skip_usuable_domain_check', false ) ) {
			return true;
		}

		// None of the explicit localhosts.
		$forbidden_domains = array(
			'wordpress.com',
			'localhost',
			'localhost.localdomain',
			'127.0.0.1',
			'local.wordpress.test',         // VVV
			'local.wordpress-trunk.test',   // VVV
			'src.wordpress-develop.test',   // VVV
			'build.wordpress-develop.test', // VVV
		);
		if ( in_array( $domain, $forbidden_domains ) ) {
			return new WP_Error( 'fail_domain_forbidden', sprintf( __( 'Domain `%1$s` just failed is_usable_domain check as it is in the forbidden array.', 'jetpack' ), $domain ) );
		}

		// No .test or .local domains
		if ( preg_match( '#\.(test|local)$#i', $domain ) ) {
			return new WP_Error( 'fail_domain_tld', sprintf( __( 'Domain `%1$s` just failed is_usable_domain check as it uses an invalid top level domain.', 'jetpack' ), $domain ) );
		}

		// No WPCOM subdomains
		if ( preg_match( '#\.wordpress\.com$#i', $domain ) ) {
			return new WP_Error( 'fail_subdomain_wpcom', sprintf( __( 'Domain `%1$s` just failed is_usable_domain check as it is a subdomain of WordPress.com.', 'jetpack' ), $domain ) );
		}

		// If PHP was compiled without support for the Filter module (very edge case)
		if ( ! function_exists( 'filter_var' ) ) {
			// Just pass back true for now, and let wpcom sort it out.
			return true;
		}

		return true;
	}
}
