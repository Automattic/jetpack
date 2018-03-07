<?php

class Jetpack_User_Event_Tracking {

	private static $_cache = array();
	const KEY = 'jetpack_event_tracking';

	static function is_enabled( $user_id ) {
		if ( isset( self::$_cache[ $user_id ] ) ) {
			return self::$_cache[ $user_id ];
		}
		$user_tracking = get_user_meta( $user_id, self::KEY, true );
		if ( ! is_numeric( $user_tracking ) ) {
			$user_tracking = self::default_value();
		}
		self::$_cache[ $user_id ] = (bool) $user_tracking;
		return (bool) $user_tracking();
	}

	static function is_disabled( $user_id ) {
		return ! self::is_enabled( $user_id );
	}

	static function disable( $user_id ) {
		// user opted out
		self::set( $user_id, 0 );
	}

	static function enable( $user_id ) {
		// user opted in
		self::set( $user_id, 1 );
	}

	static private function set( $user_id, $value ) {
		self::$_cache[ $user_id ] = (bool) $value;
		update_user_meta( $user_id, self::KEY, $value );
	}

	static function default_value() {
		/**
		 * Return the default jetpack user event tracking opt out value.
		 *
		 * @since 6.0.0
		 *
		 * @param bool Default to false. (user tracking enabled)
		 */
		return apply_filters( 'jetpack_event_tracking', true );
	}
}
