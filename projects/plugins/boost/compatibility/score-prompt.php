<?php
/**
 * Compatibility file for old way of storing dismissed score prompt.
 *
 * @package automattic/jetpack-boost
 */

$old_value = get_option( 'jb_show_score_prompt' );
if ( false !== $old_value ) {
	$ds_value = get_option( 'jetpack_boost_ds_dismissed_score_prompt' );
	if ( false === $ds_value ) {
		add_option( 'jetpack_boost_ds_dismissed_score_prompt', $old_value );
	}
}
