<?php
/**
 * Compatibility file for WP Migrate DB Pro.
 *
 * @package Jetpack
 */

/**
 *
 * Block migration of the 'jetpack_options' and jetpack_private_options values.
 *
 * @param array $options Array of preserved options.
 *
 * @return array $options Array of preserved options.
 */
function wpmdb_jetpack_preserved_options( $options ) {
	$options = array_merge( $options, array(
		'jetpack_options',
		'jetpack_private_options',
	));

	return array_unique( $options );
}
add_filter( 'wpmdb_preserved_options', 'wpmdb_jetpack_preserved_options' );
