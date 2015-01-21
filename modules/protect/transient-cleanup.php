<?php
/*
Adapted from Purge Transients by Seebz
https://github.com/Seebz/Snippets/tree/master/Wordpress/plugins/purge-transients
*/

if ( ! function_exists('jp_purge_transients') ) {
	function jp_purge_transients( $older_than = '7 days' ) {
		global $wpdb;

		$older_than_time = strtotime( '-' . $older_than );
		if ( $older_than_time > time() || $older_than_time < 1 ) {
			return false;
		}

		$sql = $wpdb->prepare( "
		SELECT REPLACE(option_name, '_transient_timeout_jpp_', '') AS transient_name
		FROM {$wpdb->options}
		WHERE option_name LIKE '\_transient\_timeout\_jpp\__%%'
		AND option_value < %d
		", $older_than_time );

		$transients = $wpdb->get_col( $sql );

		$options_names = array();

		foreach( $transients as $transient ) {
			$options_names[] = '_transient_jpp_' . $transient;
			$options_names[] = '_transient_timeout_jpp_' . $transient;
		}

		if ($options_names) {
			$options_names = array_map( array( $wpdb, 'escape' ), $options_names );
			$options_names = "'" . implode( "','", $options_names ) . "'";

			$result = $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name IN (%s)", $options_names ) );
			if (!$result) {
				return false;
			}
		}

		return;
	}
}


function jp_purge_transients_activation() {
	if ( !wp_next_scheduled( 'jp_purge_transients_cron' ) ) {	
		wp_schedule_event( time(), 'daily', 'jp_purge_transients_cron' );
	}
}
add_action( 'admin_init', 'jp_purge_transients_activation' );

add_action( 'jp_purge_transients_cron', 'jp_purge_transients' );
