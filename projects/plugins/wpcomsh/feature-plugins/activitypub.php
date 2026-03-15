<?php
/**
 * ActivityPub plugin compatibility file.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\Manager;

/**
 * Pass extra data to WordPress.com when the ActivityPub plugin is activated.
 *
 * Hooked at priority 20 on the `jetpack_sync_before_enqueue_activated_plugin` filter,
 * which means the Sync Plugins module's `expand_plugin_data()` (priority 10) has
 * already expanded the original positional args into the three-element array below.
 *
 * When the activated plugin is ActivityPub, this function appends a fourth element
 * containing the Jetpack connection owner's ActivityPub actor URI and WebFinger handle
 * so they can be synced to WordPress.com.
 *
 * @param array|false $args {
 *     Positional activated_plugin hook arguments. False if a previous filter aborted.
 *
 *     @type string $0 Plugin path relative to the plugins directory (e.g. 'activitypub/activitypub.php').
 *     @type bool   $1 Whether the plugin was network-activated. Default false.
 *     @type array  $2 Plugin header data added by `expand_plugin_data()` (keys: 'name', 'version').
 *     @type array  $3 Optional. Added by this function when the plugin is ActivityPub.
 *                     Contains 'actor' (URI) and 'WebFinger' (acct handle).
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

	$connection_owner_id = ( new Manager() )->get_connection_owner_id();
	if ( ! $connection_owner_id ) {
		return $args;
	}

	// @phan-suppress-next-line PhanUndeclaredClassMethod We're checking the class exists above, and that class exists in the ActivityPub plugin.
	$actor = Activitypub\Collection\Actors::get_by_id( $connection_owner_id );
	if ( ! is_wp_error( $actor ) ) {
		$args[] = array(
			'actor'     => $actor->get_id(),
			'webfinger' => $actor->get_webfinger(),
		);
	}

	return $args;
}
add_filter( 'jetpack_sync_before_enqueue_activated_plugin', 'wpcomsh_activitypub_sync_plugin_activation', 20, 1 );
