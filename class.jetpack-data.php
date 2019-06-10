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
	 * @param int|false    $user_id   false: Return the Blog Token. int: Return that user's User Token.
	 * @param string|false $token_key If provided, check that the token matches the provided input.
	 *                                false                                : Use first token. Default.
	 *                                Jetpack_Data::MAGIC_NORMAL_TOKEN_KEY : Use first Normal Token.
	 *                                non-empty string                     : Use matching token
	 * @return object|false
	 */
	public static function get_access_token( $user_id = false, $token_key = false ) {
		$possible_special_tokens = array();
		$possible_normal_tokens  = array();

		if ( $user_id ) {
			if ( !$user_tokens = Jetpack_Options::get_option( 'user_tokens' ) ) {
				return false;
			}
			if ( $user_id === JETPACK_MASTER_USER ) {
				if ( !$user_id = Jetpack_Options::get_option( 'master_user' ) ) {
					return false;
				}
			}
			if ( !isset( $user_tokens[$user_id] ) || ! $user_tokens[$user_id] ) {
				return false;
			}
			$user_token_chunks = explode( '.', $user_tokens[$user_id] );
			if ( empty( $user_token_chunks[1] ) || empty( $user_token_chunks[2] ) ) {
				return false;
			}
			if ( $user_id != $user_token_chunks[2] ) {
				return false;
			}
			$possible_normal_tokens[] = "{$user_token_chunks[0]}.{$user_token_chunks[1]}";
		} else {
			$stored_blog_token = Jetpack_Options::get_option( 'blog_token' );
			if ( $stored_blog_token ) {
				$possible_normal_tokens[] = $stored_blog_token;
			}

			$defined_tokens = Jetpack_Constants::is_defined( 'JETPACK_BLOG_TOKEN' )
				? explode( ',', Jetpack_Constants::get_constant( 'JETPACK_BLOG_TOKEN' ) )
				: array();

			foreach ( $defined_tokens as $defined_token ) {
				if ( ';' === $defined_token[0] ) {
					$possible_special_tokens[] = $defined_token;
				} else {
					$possible_normal_tokens[] = $defined_token;
				}
			}
		}

		if ( self::MAGIC_NORMAL_TOKEN_KEY === $token_key ) {
			$possible_tokens = $possible_normal_tokens;
		} else {
			$possible_tokens = array_merge( $possible_special_tokens, $possible_normal_tokens );
		}

		if ( ! $possible_tokens ) {
			return false;
		}

		$valid_token = false;

		if ( false === $token_key ) {
			// Use first token.
			$valid_token = $possible_tokens[0];
		} elseif ( self::MAGIC_NORMAL_TOKEN_KEY === $token_key ) {
			// Use first normal token.
			$valid_token = $possible_tokens[0]; // $possible_tokens only contains normal tokens because of earlier check.
		} else {
			// Use the token matching $token_key or false if none.
			// Ensure we check the full key.
			$token_check = rtrim( $token_key, '.' ) . '.';

			foreach ( $possible_tokens as $possible_token ) {
				if ( hash_equals( substr( $possible_token, 0, strlen( $token_check ) ), $token_check ) ) {
					$valid_token = $possible_token;
					break;
				}
			}
		}

		if ( ! $valid_token ) {
			return false;
		}

		return (object) array(
			'secret' => $valid_token,
			'external_user_id' => (int) $user_id,
		);
	}

	/**
	 * This function mirrors Jetpack_Data::is_usable_domain() in the WPCOM codebase.
	 *
	 * @param $domain
	 * @param array $extra
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

	/**
	 * Returns true if the IP address passed in should not be in a reserved range, even if PHP says that it is.
	 * See: https://bugs.php.net/bug.php?id=66229 and https://github.com/php/php-src/commit/d1314893fd1325ca6aa0831101896e31135a2658
	 *
	 * This function mirrors Jetpack_Data::php_bug_66229_check() in the WPCOM codebase.
	 */
	public static function php_bug_66229_check( $ip ) {
		if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
			return false;
		}

		$ip_arr = array_map( 'intval', explode( '.', $ip ) );

		if ( 128 == $ip_arr[0] && 0 == $ip_arr[1] ) {
			return true;
		}

		if ( 191 == $ip_arr[0] && 255 == $ip_arr[1] ) {
			return true;
		}

		return false;
	}
}
