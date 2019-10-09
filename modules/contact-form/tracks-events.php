<?php
/**
 * Jetpack_Contact_Form: Add tracking for submitting contact form blocks
 *
 * @package    Jetpack
 * @since      ?
 */

use Automattic\Jetpack\Tracking;
use Automattic\Jetpack\Status;


/**
 * Function that sends a `jetpack_contact_form_block_message_sent` event to Tracks
 *
 * @param int   $post_id - the post_id for the CPT that is created.
 * @param array $all_values - fields from the default contact form.
 * @param array $extra_values - extra fields added to from the contact form.

 * @return void
 */
function jetpack_tracks_record_grunion_pre_message_sent( $post_id, $all_values, $extra_values ) {
	$status = new Automattic\Jetpack\Status();

	if ( ! $status->is_development_mode() && isset( $extra_values['is_block'] ) && $extra_values['is_block'] ) {
		$tracking = new Automattic\Jetpack\Tracking();
		$tracking->tracks_record_event(
			wp_get_current_user(),
			'jetpack_contact_form_block_message_sent',
			array(
				'entry_permalink' => esc_url( $all_values['entry_permalink'] ),
				'feedback_id'     => absint( $all_values['feedback_id'] ),
			)
		);
	}
}

add_action( 'grunion_pre_message_sent', 'jetpack_tracks_record_grunion_pre_message_sent', 12, 3 );
