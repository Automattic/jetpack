<?php
/**
 * Track Forms Events class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Tracking;

/**
 * Class to handle tracking events for contact form views.
 */
class Track_Form_Events {

	/**
	 * Send an event to Tracks
	 *
	 * @param string $event_name - the name of the event.
	 * @param array  $event_props - event properties to send.
	 *
	 * @return null|void
	 */
	public function record_tracks_event( $event_name, $event_props = array() ) {
		/*
		 * Event details.
		 */
		$event_user = wp_get_current_user();

		/*
		 * Record event.
		 * We use different libs on wpcom and Jetpack.
		 */
		if ( ( new Host() )->is_wpcom_simple() ) {
			$event_name             = 'wpcom_' . $event_name;
			$event_props['blog_id'] = get_current_blog_id();
			// logged out visitor, record event with blog owner.
			if ( empty( $event_user->ID ) ) {
				$event_user_id = wpcom_get_blog_owner( $event_props['blog_id'] );
				$event_user    = get_userdata( $event_user_id );
			}

			require_lib( 'tracks/client' );
			tracks_record_event( $event_user, $event_name, $event_props );
		} else {

			$user_connected = ( new Manager( 'jetpack-forms' ) )->is_user_connected( get_current_user_id() );
			if ( ! $user_connected ) {
				return;
			}
			// logged out visitor, record event with Jetpack master user.
			if ( empty( $event_user->ID ) ) {
				$master_user_id = ( new Manager( 'jetpack-forms' ) )->get_connection_owner_id();
				if ( ! empty( $master_user_id ) ) {
					$event_user = get_userdata( $master_user_id );
				}
			}

			$tracking = new Tracking();
			$tracking->record_user_event( $event_name, $event_props, $event_user );
		}
	}

	/**
	 * Record a bump event
	 *
	 * @param string $event_name - the name of the event.
	 * @param array  $extra - extra data to send with the event.
	 */
	public function record_bump_event( $event_name, $extra ) {
		/** This action is documented in jetpack/modules/widgets/social-media-icons.php */
		do_action( 'jetpack_bump_stats_extras', 'jetpack_forms_' . $event_name, $extra );
	}
}
