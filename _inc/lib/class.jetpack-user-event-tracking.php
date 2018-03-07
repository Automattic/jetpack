<?php

class Jetpack_User_Event_Tracking {

	private static $_memorize_setting = array();
	const KEY = 'jetpack_event_tracking_opted_out';

	static function is_enabled( $user_id ) {
			return ! self::is_disabled( $user_id );
	}

	static function is_disabled( $user_id ) {
		if ( isset( self::$_memorize_setting[ $user_id ] ) ) {
			return self::$_memorize_setting[ $user_id ];
		}
		$user_tracking = get_user_meta( $user_id, self::KEY , true );
		if ( is_numeric( $user_tracking ) ) {
			self::$_memorize_setting[ $user_id ] = (bool) $user_tracking;
			return (bool) $user_tracking;
		}
		$default = self::default_value();
		self::$_memorize_setting[ $user_id ] = (bool) $default;
		return (bool) self::default_value();
	}

	static function disable( $user_id ) {
		// user opted out
		self::set( $user_id, 1 );
	}

	static function enable( $user_id ) {
		// user opted in
		self::set( $user_id, 0 );
	}

	static private function set( $user_id, $value ) {
		self::$_memorize_setting[ $user_id ] = (bool) $value;
		if ( ! add_user_meta( $user_id, self::KEY, $value, true ) ) {
			update_user_meta( $user_id, self::KEY, $value );
		}
	}

	static function default_value() {
		/**
		 * Return the default jetpack user event tracking opt out value.
		 *
		 * @since 6.0.0
		 *
		 * @param bool Default to false. (user tracking enabled)
		 */
		return apply_filters( 'jetpack_user_event_tracking_opt_out', false );
	}
}
