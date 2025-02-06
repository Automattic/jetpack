<?php
/**
 * Compatibility file for old way of storing dismissed score prompt.
 *
 * @package automattic/jetpack-boost
 */

// Old value is the previous DS key, fallback to even older non-ds value.
$old_value = (array) get_option( 'jetpack_boost_ds_dismissed_score_prompt', get_option( 'jb_show_score_prompt' ) );
if ( false !== $old_value ) {
	$new_value = (array) get_option( 'jetpack_boost_ds_dismissed_alerts', array() );

	if ( in_array( 'score-increase', $old_value, true ) ) {
		$new_value['score_increase'] = true;
	}
	if ( in_array( 'score-decrease', $old_value, true ) ) {
		$new_value['score_decrease'] = true;
	}

	update_option( 'jetpack_boost_ds_dismissed_alerts', $new_value, false );
	delete_option( 'jetpack_boost_ds_dismissed_score_prompt' );
	delete_option( 'jb_show_score_prompt' );
}
