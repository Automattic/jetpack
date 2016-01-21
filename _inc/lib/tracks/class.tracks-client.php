<?php

/**
 * Jetpack_Tracks_Client
 * @autounit nosara tracks-client
 *
 * Send Tracks events on behalf of a user
 *
 * Example Usage:
```php
	require( dirname(__FILE__).'path/to/tracks/class.tracks-client' );

	$result = Jetpack_Tracks_Client::record_event( array(
		'_en'        => $event_name,       // required
		'_ui'        => $user_id,          // required unless _ul is provided
		'_ul'        => $user_login,       // required unless _ui is provided

		// Optional, but recommended
		'_ts'        => $ts_in_ms,         // Default: now
		'_via_ip'    => $client_ip,        // we use it for geo, etc.

		// Possibly useful to set some context for the event
		'_via_ua'    => $client_user_agent,
		'_via_url'   => $client_url,
		'_via_ref'   => $client_referrer,

		// For user-targeted tests
		'abtest_name'        => $abtest_name,
		'abtest_variation'   => $abtest_variation,

		// Your application-specific properties
		'custom_property'    => $some_value,
	) );

	if ( is_wp_error( $result ) ) {
		// Handle the error in your app
	}
```
 */

require_once( dirname(__FILE__).'/class.tracks-client.php' );

class Jetpack_Tracks_Client {
	const PIXEL = 'http://pixel.wp.com/t.gif';
	const BROWSER_TYPE = 'php-agent';
	const USER_AGENT_SLUG = 'tracks-client';
	const VERSION = '0.3';

	/**
	 * record_event
	 * @param  mixed  $event Event object to send to Tracks. An array will be cast to object. Required.
	 *                       Properties are included directly in the pixel query string after light validation.
	 * @return mixed         True on success, WP_Error on failure
	 */
	static function record_event( $event ) {
		if ( ! $event instanceof Jetpack_Tracks_Event ) {
			$event = new Jetpack_Tracks_Event( $event );
		}
		if ( is_wp_error( $event ) ) {
			return $event;
		}

		$pixel = $event->build_pixel_url( $event );

		if ( ! $pixel ) {
			return new WP_Error( 'invalid_pixel', 'cannot generate tracks pixel for given input', 400 );
		}

		return self::record_pixel( $pixel );
	}

	/**
	 * Synchronously request the pixel
	 */
	static function record_pixel( $pixel ) {
		// Add the Request Timestamp and URL terminator just before the HTTP request.
		$pixel .= '&_rt=' . self::build_timestamp() . '&_=_';

		$response = wp_remote_get( $pixel, array(
			'blocking'    => true, // The default, but being explicit here :)
			'timeout'     => 1,
			'redirection' => 2,
			'httpversion' => '1.1',
			'user-agent'  => self::get_user_agent(),
		) );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = isset( $response['response']['code'] ) ? $response['response']['code'] : 0;

		if ( $code !== 200 ) {
			return new WP_Error( 'request_failed', 'Tracks pixel request failed', $code );
		}

		return true;
	}

	static function get_user_agent() {
		return Jetpack_Tracks_Client::USER_AGENT_SLUG . '-v' . Jetpack_Tracks_Client::VERSION;
	}

	/**
	 * Build an event and return its tracking URL
	 * @deprecated          Call the `build_pixel_url` method on a Jetpack_Tracks_Event object instead.
	 * @param  array $event Event keys and values
	 * @return string       URL of a tracking pixel
	 */
	static function build_pixel_url( $event ) {
		$_event = new Jetpack_Tracks_Event( $event );
		return $_event->build_pixel_url();
	}

	/**
	 * Validate input for a tracks event.
	 * @deprecated          Instantiate a Jetpack_Tracks_Event object instead
	 * @param  array $event Event keys and values
	 * @return mixed        Validated keys and values or WP_Error on failure
	 */
	private static function validate_and_sanitize( $event ) {
		$_event = new Jetpack_Tracks_Event( $event );
		if ( is_wp_error( $_event ) ) {
			return $_event;
		}
		return get_object_vars( $_event );
	}

	// Milliseconds since 1970-01-01
	static function build_timestamp() {
		$ts = round( microtime( true ) * 1000 );
		return number_format( $ts, 0, '', '' );
	}

	/**
	 * Grabs the user's anon id from cookies, or generates and sets a new one
	 *
	 * @return string An anon id for the user
	 */
	static function get_anon_id() {
		static $anon_id = null;

		if ( ! isset( $anon_id ) ) {

			// Did the browser send us a cookie?
			if ( isset( $_COOKIE[ 'tk_ai' ] ) && preg_match( '#^[A-Za-z0-9+/=]{24}$#', $_COOKIE[ 'tk_ai' ] ) ) {
				$anon_id = $_COOKIE[ 'tk_ai' ];
			} else {

				$binary = '';

				// Generate a new anonId and try to save it in the browser's cookies
				// Note that base64-encoding an 18 character string generates a 24-character anon id
				for ( $i = 0; $i < 18; ++$i ) {
					$binary .= chr( mt_rand( 0, 255 ) );
				}

				$anon_id = 'jetpack:' . base64_encode( $binary );

				if ( ! headers_sent() ) {
					setcookie( 'tk_ai', $anon_id );
				}
			}
		}

		return $anon_id;
	}
}
