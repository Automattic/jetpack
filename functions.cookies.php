<?php
/**
 * This file is meant to be the home for any function handling cookies that can
 * be accessed anywhere within Jetpack.
 *
 * This file is loaded whether or not Jetpack is connected to WP.com.
 *
 * @package Jetpack
 */

/**
 * A PHP 5.X compatible version of the array argument version of PHP 7.3's setcookie().
 *
 * Useful for setting SameSite cookies in PHP 7.2 or earlier.
 *
 * @param string $name    Name of the cookie.
 * @param string $value   Value of the cookie.
 * @param array  $options Options to include with the cookie.
 * @return bool False when error happens, other wise true.
 */
function jetpack_shim_setcookie( $name, $value, $options ) {
	$not_allowed_chars = ",; \t\r\n\013\014";

	if ( strpbrk( $name, $not_allowed_chars ) !== false ) {
		return false;
	}

	$cookie = 'Set-Cookie: ' . $name . '=' . rawurlencode( $value ) . '; ';

	if ( ! empty( $options['expires'] ) ) {
		$cookie_date = gmdate( 'D, d M Y H:i:s \G\M\T', $options['expires'] );
		$cookie     .= sprintf( 'expires=%s', $cookie_date ) . ';';
	}

	if ( ! empty( $options['secure'] ) && true === $options['secure'] ) {
		$cookie .= 'secure; ';
	}

	if ( ! empty( $options['httponly'] ) && true === $options['httponly'] ) {
		$cookie .= 'HttpOnly; ';
	}

	if ( ! empty( $options['domain'] ) && is_string( $options['domain'] ) ) {
		if ( strpbrk( $options['domain'], false !== $not_allowed_chars ) ) {
			return false;
		}
		$cookie .= sprintf( 'domain=%s', $options['domain'] . '; ' );
	}

	if ( ! empty( $options['path'] ) && is_string( $options['path'] ) ) {
		if ( strpbrk( $options['path'], false !== $not_allowed_chars ) ) {
			return false;
		}
		$cookie .= sprintf( 'path=%s', $options['path'] . '; ' );
	}

	if ( ! empty( $options['samesite'] ) && is_string( $options['samesite'] ) ) {
		$cookie .= sprintf( 'SameSite=%s', $options['samesite'] . '; ' );
	}

	$cookie = trim( $cookie );
	$cookie = trim( $cookie, ';' );
	header( $cookie, false );

	return true;
}

// Only proceed if Jetpack is connected to WordPress.com and there is no active short-circuit filter.
if (
	Jetpack::is_active() &&
	/**
	 * Allow plugins to short-circuit the `wp_set_auth_cookie` override that adds support for SameSite cookies.
	 *
	 * Note that because the `wp_set_auth_cookie` override executes on plugin load (to be able to define it before
	 * `pluggable.php`), a third party can only use the short-circuit filter in plugins loaded before Jetpack, or
	 * in an mu-plugin.
	 *
	 * @since 8.1.1
	 *
	 * @param false bool Whether the `wp_set_auth_cookie` override should be blocked. False by default.
	 */
	! apply_filters( 'jetpack_disable_auth_cookie_pluggable', false ) &&
	! function_exists( 'wp_set_auth_cookie' )
) :
	/**
	 * Sets the authentication cookies based on user ID.
	 *
	 * The $remember parameter increases the time that the cookie will be kept. The
	 * default the cookie is kept without remembering is two days. When $remember is
	 * set, the cookies will be kept for 14 days or two weeks.
	 *
	 * This overrides the `wp_set_auth_cookie` pluggable function in order to support `SameSite` cookies.
	 *
	 * @param int    $user_id  User ID.
	 * @param bool   $remember Whether to remember the user.
	 * @param mixed  $secure   Whether the admin cookies should only be sent over HTTPS.
	 *                         Default is the value of is_ssl().
	 * @param string $token    Optional. User's session token to use for this cookie.
	 *
	 * @since 8.1.1
	 */
	function wp_set_auth_cookie( $user_id, $remember = false, $secure = '', $token = '' ) {
		if ( $remember ) {
			/** This filter is documented in wp-includes/pluggable.php */
			$expiration = time() + apply_filters( 'auth_cookie_expiration', 14 * DAY_IN_SECONDS, $user_id, $remember );

			/*
			 * Ensure the browser will continue to send the cookie after the expiration time is reached.
			 * Needed for the login grace period in wp_validate_auth_cookie().
			 */
			$expire = $expiration + ( 12 * HOUR_IN_SECONDS );
		} else {
			/** This filter is documented in wp-includes/pluggable.php */
			$expiration = time() + apply_filters( 'auth_cookie_expiration', 2 * DAY_IN_SECONDS, $user_id, $remember );
			$expire     = 0;
		}

		if ( '' === $secure ) {
			$secure = is_ssl();
		}

		// Front-end cookie is secure when the auth cookie is secure and the site's home URL is forced HTTPS.
		$secure_logged_in_cookie = $secure && 'https' === wp_parse_url( get_option( 'home' ), PHP_URL_SCHEME );

		/** This filter is documented in wp-includes/pluggable.php */
		$secure = apply_filters( 'secure_auth_cookie', $secure, $user_id );

		/** This filter is documented in wp-includes/pluggable.php */
		$secure_logged_in_cookie = apply_filters( 'secure_logged_in_cookie', $secure_logged_in_cookie, $user_id, $secure );

		if ( $secure ) {
			$auth_cookie_name = SECURE_AUTH_COOKIE;
			$scheme           = 'secure_auth';
		} else {
			$auth_cookie_name = AUTH_COOKIE;
			$scheme           = 'auth';
		}

		if ( '' === $token ) {
			$manager = WP_Session_Tokens::get_instance( $user_id );
			$token   = $manager->create( $expiration );
		}

		$auth_cookie      = wp_generate_auth_cookie( $user_id, $expiration, $scheme, $token );
		$logged_in_cookie = wp_generate_auth_cookie( $user_id, $expiration, 'logged_in', $token );

		/** This filter is documented in wp-includes/pluggable.php */
		do_action( 'set_auth_cookie', $auth_cookie, $expire, $expiration, $user_id, $scheme, $token );

		/** This filter is documented in wp-includes/pluggable.php */
		do_action( 'set_logged_in_cookie', $logged_in_cookie, $expire, $expiration, $user_id, 'logged_in', $token );

		/** This filter is documented in wp-includes/pluggable.php */
		if ( ! apply_filters( 'send_auth_cookies', true ) ) {
			return;
		}

		/**
		 * Filters the SameSite attribute to use in auth cookies.
		 *
		 * @param string $samesite SameSite attribute to use in auth cookies.
		 *
		 * @since 8.1.1
		 */
		$samesite = apply_filters( 'jetpack_auth_cookie_samesite', 'Lax' );

		jetpack_shim_setcookie(
			$auth_cookie_name,
			$auth_cookie,
			array(
				'expires'  => $expire,
				'path'     => PLUGINS_COOKIE_PATH,
				'domain'   => COOKIE_DOMAIN,
				'secure'   => $secure,
				'httponly' => true,
				'samesite' => $samesite,
			)
		);

		jetpack_shim_setcookie(
			$auth_cookie_name,
			$auth_cookie,
			array(
				'expires'  => $expire,
				'path'     => ADMIN_COOKIE_PATH,
				'domain'   => COOKIE_DOMAIN,
				'secure'   => $secure,
				'httponly' => true,
				'samesite' => $samesite,
			)
		);

		jetpack_shim_setcookie(
			LOGGED_IN_COOKIE,
			$logged_in_cookie,
			array(
				'expires'  => $expire,
				'path'     => COOKIEPATH,
				'domain'   => COOKIE_DOMAIN,
				'secure'   => $secure_logged_in_cookie,
				'httponly' => true,
				'samesite' => $samesite,
			)
		);

		if ( COOKIEPATH !== SITECOOKIEPATH ) {
			jetpack_shim_setcookie(
				LOGGED_IN_COOKIE,
				$logged_in_cookie,
				array(
					'expires'  => $expire,
					'path'     => SITECOOKIEPATH,
					'domain'   => COOKIE_DOMAIN,
					'secure'   => $secure_logged_in_cookie,
					'httponly' => true,
					'samesite' => $samesite,
				)
			);
		}
	}
endif;
