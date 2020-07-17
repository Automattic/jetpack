<?php
/**
 * Action Hooks for Gif block.
 *
 * @package automattic/jetpack-gif-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

// Clean up expired Helper Scripts from a scheduled event.
// add_action( 'jetpack_backup_cleanup_helper_scripts', array( 'Automattic\\Jetpack\\Backup\\Helper_Script_Manager', 'cleanup_expired_helper_scripts' ) );

error_log( 'loading actions' );

add_filter(
	'jetpack_set_available_extensions',
	function( $list, $variation ) {
		// you can test for variation here, e.g. if ( $variation === 'experimental' ) {}
		$list[] = 'gif';
		return $list;
	},
	10,
	2
);
