<?php
/**
 * This file is meant to be the home for any generic & reusable functions
 * that can be accessed anywhere within Jetpack.
 *
 * This file is loaded whether or not Jetpack is active.
 *
 * Please namespace with jetpack_
 * Please write docblocks
 */

/**
 * Disable direct access.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Determine if this site is an AT site or not looking first at the 'at_options' option.
 * As a fallback, check for presence of wpcomsh plugin to determine if a current site has undergone AT.
 *
 * @since 4.8.1
 *
 * @return bool
 */
function jetpack_is_automated_transfer_site() {
	$at_options = get_option( 'at_options', array() );
	return ! empty( $at_options ) || defined( 'WPCOMSH__PLUGIN_FILE' );
}

/**
 * Register post type for migration.
 *
 * @since 5.2
 */
function jetpack_register_migration_post_type() {
	register_post_type( 'jetpack_migration', array(
		'supports'     => array(),
		'taxonomies'   => array(),
		'hierarchical' => false,
		'public'       => false,
		'has_archive'  => false,
		'can_export'   => true,
	) );
}

/**
 * Stores migration data in the database.
 *
 * @since 5.2
 *
 * @param string $option_name
 * @param bool $option_value
 *
 * @return int|WP_Error
 */
function jetpack_store_migration_data( $option_name, $option_value ) {
	jetpack_register_migration_post_type();

	$insert = array(
		'post_title' => $option_name,
		'post_content_filtered' => $option_value,
		'post_type' => 'jetpack_migration',
		'post_date' => date( 'Y-m-d H:i:s', time() ),
	);

	$post = get_page_by_title( $option_name, 'OBJECT', 'jetpack_migration' );

	if ( null !== $post ) {
		$insert['ID'] = $post->ID;
	}

	return wp_insert_post( $insert, true );
}

/**
 * Retrieves legacy image widget data.
 *
 * @since 5.2
 *
 * @param string $option_name
 *
 * @return mixed|null
 */
function jetpack_get_migration_data( $option_name ) {
	$post = get_page_by_title( $option_name, 'OBJECT', 'jetpack_migration' );

	return null !== $post ? maybe_unserialize( $post->post_content_filtered ) : null;
}