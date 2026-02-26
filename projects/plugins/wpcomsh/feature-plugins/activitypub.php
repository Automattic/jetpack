<?php
/**
 * ActivityPub plugin compatibility file.
 *
 * @package wpcomsh
 */

/**
 * Pass extra data to WordPress.com when the ActivityPub plugin is activated.
 *
 * Hooked at priority 20 on the `jetpack_sync_before_enqueue_activated_plugin` filter,
 * which means the Sync Plugins module's `expand_plugin_data()` (priority 10) has
 * already expanded the original positional args into the three-element array below.
 *
 * When the activated plugin is ActivityPub, this function appends a fourth element
 * containing the blog-level actor URI so it can be synced to WordPress.com.
 *
 * @param array|false $args {
 *     Positional activated_plugin hook arguments. False if a previous filter aborted.
 *
 *     @type string $0 Plugin path relative to the plugins directory (e.g. 'activitypub/activitypub.php').
 *     @type bool   $1 Whether the plugin was network-activated. Default false.
 *     @type array  $2 Plugin header data added by `expand_plugin_data()` (keys: 'name', 'version').
 *     @type array  $3 Optional. Added by this function when the plugin is ActivityPub.
 *                     Contains 'actor' — the blog-level ActivityPub actor URI.
 * }
 *
 * @return array|false The (possibly augmented) args, or false if a previous filter aborted.
 */
function wpcomsh_activitypub_sync_plugin_activation( $args ) {
	if ( ! is_array( $args ) || ! isset( $args[0] ) ) {
		return $args;
	}

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
