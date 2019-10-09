<?php

use Automattic\Jetpack\Tracking;

function jetpack_tracks_record_grunion_pre_message_sent( $post_id, $all_values, $extra_values ) {
	$tracking = new Automattic\Jetpack\Tracking();
	if ( $extra_values['is_block'] ) {
		$tracking->tracks_record_event( wp_get_current_user(), 'jetpack_contact_form_block_message_sent', array(
			'entry_permalink' => esc_url( $all_values['entry_permalink'] ),
			'feedback_id' => absint( $all_values['feedback_id'] ),
		) );
	}
}

add_action( 'grunion_pre_message_sent', 'jetpack_tracks_record_grunion_pre_message_sent', 12, 3 );
