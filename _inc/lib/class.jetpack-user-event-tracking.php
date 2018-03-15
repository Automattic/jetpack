<?php

class Jetpack_User_Event_Tracking {
	public static $KEY = 'jetpack_event_tracking';

	static function is_enabled( $user_id ) {
		$user_tracking = get_user_meta( $user_id, self::$KEY, true );
		if ( ! is_numeric( $user_tracking ) ) {
			$user_tracking = self::default_value();
		}
		return (bool) $user_tracking;
	}

	static function has_value( $user_id ) {
		$user_tracking = get_user_meta( $user_id, self::$KEY, true );
		if ( is_numeric( $user_tracking ) ) {
			return true;
		}
		return false;
	}

	static function is_disabled( $user_id ) {
		return ! self::is_enabled( $user_id );
	}

	static function disable( $user_id ) {
		// user opted out
		return self::set( $user_id, 0 );
	}

	static function enable( $user_id ) {
		// user opted in
		return self::set( $user_id, 1 );
	}

	static private function set( $user_id, $value ) {
		return update_user_meta( $user_id, self::$KEY, $value );
	}

	static function default_value() {
		/**
		 * Return the default jetpack user event tracking opt out value.
		 *
		 * @since 6.0.0
		 *
		 * @param bool Default to true. (user tracking enabled)
		 */
		return apply_filters( 'jetpack_user_event_tracking', true );
	}
}
