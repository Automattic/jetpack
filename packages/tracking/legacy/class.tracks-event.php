<?php

/**
 * @autounit nosara tracks-client
 *
 * Example Usage:
```php
	require_once( dirname(__FILE__) . 'path/to/tracks/class.tracks-event' );

	$event = new Jetpack_Tracks_Event( array(
		'_en'        => $event_name,       // required
		'_ui'        => $user_id,          // required unless _ul is provided
		'_ul'        => $user_login,       // required unless _ui is provided

		// Optional, but recommended
		'_via_ip'    => $client_ip,        // for geo, etc.

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

	if ( is_wp_error( $event->error ) ) {
		// Handle the error in your app
	}

	$bump_and_redirect_pixel = $event->build_signed_pixel_url();
```
 */

class Jetpack_Tracks_Event {
	const EVENT_NAME_REGEX = '/^(([a-z0-9]+)_){2}([a-z0-9_]+)$/';
	const PROP_NAME_REGEX = '/^[a-z_][a-z0-9_]*$/';
	public $error;

	function __construct( $event ) {
		$_event = self::validate_and_sanitize( $event );
		if ( is_wp_error( $_event ) ) {
			$this->error = $_event;
			return;
		}

		foreach( $_event as $key => $value ) {
			$this->{$key} = $value;
		}
	}

	function record() {
		return Jetpack_Tracks_Client::record_event( $this );
	}

	/**
	 * Annotate the event with all relevant info.
	 * @param  mixed		$event Object or (flat) array
	 * @return mixed        The transformed event array or WP_Error on failure.
	 */
	static function validate_and_sanitize( $event ) {
		$event = (object) $event;

		// Required
		if ( ! $event->_en ) {
			return new WP_Error( 'invalid_event', 'A valid event must be specified via `_en`', 400 );
		}

		// delete non-routable addresses otherwise geoip will discard the record entirely
		if ( property_exists( $event, '_via_ip' ) && preg_match( '/^192\.168|^10\./', $event->_via_ip ) ) {
			unset($event->_via_ip);
		}

		$validated = array(
			'browser_type'      => Jetpack_Tracks_Client::BROWSER_TYPE,
			'_aua'              => Jetpack_Tracks_Client::get_user_agent(),
		);

		$_event = (object) array_merge( (array) $event, $validated );

		// If you want to blacklist property names, do it here.

		// Make sure we have an event timestamp.
		if ( ! isset( $_event->_ts ) ) {
			$_event->_ts = Jetpack_Tracks_Client::build_timestamp();
		}

		return $_event;
	}

	/**
	 * Build a pixel URL that will send a Tracks event when fired.
	 * On error, returns an empty string ('').
	 *
	 * @return string A pixel URL or empty string ('') if there were invalid args.
	 */
	function build_pixel_url() {
		if ( $this->error ) {
			return '';
		}

		$args = get_object_vars( $this );

		// Request Timestamp and URL Terminator must be added just before the HTTP request or not at all.
		unset( $args['_rt'] );
		unset( $args['_'] );

		$validated = self::validate_and_sanitize( $args );

		if ( is_wp_error( $validated ) )
			return '';

		return Jetpack_Tracks_Client::PIXEL . '?' . http_build_query( $validated );
	}

	static function event_name_is_valid( $name ) {
		return preg_match( Jetpack_Tracks_Event::EVENT_NAME_REGEX, $name );
	}

	static function prop_name_is_valid( $name ) {
		return preg_match( Jetpack_Tracks_Event::PROP_NAME_REGEX, $name );
	}

	static function scrutinize_event_names( $event ) {
		if ( ! Jetpack_Tracks_Event::event_name_is_valid( $event->_en ) ) {
			return;
		}

		$whitelisted_key_names = array(
			'anonId',
			'Browser_Type',
		);

		foreach ( array_keys( (array) $event ) as $key ) {
			if ( in_array( $key, $whitelisted_key_names ) ) {
				continue;
			}
			if ( ! Jetpack_Tracks_Event::prop_name_is_valid( $key ) ) {
				return;
			}
		}
	}
}
