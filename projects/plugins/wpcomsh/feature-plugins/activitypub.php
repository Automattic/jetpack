<?php
/**
 * ActivityPub plugin compatibility file.
 *
 * @package wpcomsh
 */

/**
 * Pass extra data to WordPress.com when the ActivityPub plugin is activated.
 *
 * @param array $args {
 *  activated_plugin hook arguments.
 *   @type string $plugin       Path to the plugin file relative to the plugins directory.
 *   @type bool   $network_wide Whether to enable the plugin for all sites in the network or just the current site. Multisite only. Default false.
 * }
 *
 * @return array $args The hook arguments.
 */
function wpcomsh_activitypub_sync_plugin_activation( $args ) {
	$plugin_name = 'activitypub/activitypub.php';
	if ( $plugin_name !== $args[0] ) {
		return $args;
	}

	if ( ! class_exists( 'Activitypub\Collection\Actors' ) ) {
		return $args;
	}

	// @phan-suppress-next-line PhanUndeclaredClassMethod We're checking the class exists above, and that class exists in the ActivityPub plugin.
	$blog_actor = Activitypub\Collection\Actors::get_by_id( 0 );
	if ( ! is_wp_error( $blog_actor ) ) {
		$args[] = array( 'actor' => $blog_actor->get_id() );
	}

	return $args;
}
add_filter( 'jetpack_sync_before_enqueue_activated_plugin', 'wpcomsh_activitypub_sync_plugin_activation', 20, 1 );
