<?php

use Automattic\Jetpack\Tracking;

class JetpackTracking {

	static function enqueue_tracks_scripts() {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Tracking' );

		$tracking = new Tracking();
		return $tracking->enqueue_tracks_scripts();
	}

	static function record_user_event( $event_type, $data = array(), $user = null ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Tracking' );

		$tracking = new Tracking();
		return $tracking->record_user_event( $event_type, $data, $user );
	}

}
