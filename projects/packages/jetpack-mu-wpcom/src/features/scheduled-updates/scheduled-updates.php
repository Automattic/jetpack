<?php
/**
 * Manages update schedules for plugins and themes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Run the scheduled update.
 *
 * @param array $plugins List of plugins to update.
 */
function jetpack_run_scheduled_update( $plugins = array() ) {
	$available_updates = get_site_transient( 'update_plugins' );
	$plugins_to_update = array();

	foreach ( $plugins as $plugin ) {
		if ( isset( $available_updates->response[ $plugin ] ) ) {
			$plugins_to_update[ $plugin ]              = $available_updates->response[ $plugin ];
			$plugins_to_update[ $plugin ]->old_version = $available_updates->checked[ $plugin ];
		}
	}

	if ( ! empty( $plugins_to_update ) ) {
		wp_remote_post(
			'https://public-api.wordpress.com/wpcom/v2/scheduled-updates/update-plugins', // TODO: Create the endpoint.
			array(
				'body' => array(
					'plugins' => $plugins_to_update,
				),
			)
		);
	}
}
add_action( 'jetpack_scheduled_update', 'jetpack_run_scheduled_update' );

/**
 * Allow plugins that are part of scheduled updates to be updated automatically.
 *
 * @param bool|null $update Whether to update. The value of null is internally used
 *                          to detect whether nothing has hooked into this filter.
 * @param object    $item   The update offer.
 * @return bool
 */
function jetpack_allowlist_scheduled_plugins( $update, $item ) {
	// TODO: Check if we're in a scheduled update request from Jetpack_Autoupdates.
	$schedules = get_option( 'jetpack_update_schedules', array() );

	foreach ( $schedules as $plugins ) {
		if ( in_array( $item->slug, $plugins, true ) ) {
			return true;
		}
	}

	return $update;
}
add_filter( 'auto_update_plugin', 'jetpack_allowlist_scheduled_plugins', 10, 2 );

/**
 * Registers the is_managed field for the plugin REST API.
 */
function jetpack_managed_extension_field() {
	if ( ! Automattic\Jetpack\Current_Plan::supports( 'scheduled-updates' ) ) {
		return;
	}

	register_rest_field(
		'plugin',
		'is_managed',
		array(
			/**
			 * Populates the is_managed field.
			 *
			 * @see p9o2xV-3Nx-p2#comment-8728
			 *
			 * @param array $data Prepared response array.
			 * @return bool
			 */
			'get_callback' => function ( $data ) {
				$folder = strtok( $data['plugin'], '/' );
				$target = readlink( WP_PLUGIN_DIR . '/' . $folder );

				return $target && 0 === strpos( $target, '/wordpress/' );
			},
			'schema'       => array(
				'description' => 'Whether the plugin is managed by the host.',
				'type'        => 'boolean',
			),
		)
	);
}
add_action( 'rest_api_init', 'jetpack_managed_extension_field' );
