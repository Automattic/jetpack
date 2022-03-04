<?php
/* HEADER */ // phpcs:ignore

/**
 * This class handles plugin upgrades and uninstalls.
 */
class Upgrade_Handler {

	/**
	 * Handles a plugin upgrade.
	 *
	 * @param bool|WP_Error $response Response.
	 * @param array         $hook_extra Extra arguments passed to hooked filters.
	 * @return bool|WP_Error Response
	 */
	public function upgrader_pre_install( $response, $hook_extra ) {
		if ( isset( $hook_extra['plugin'] ) ) {
			$this->load_plugin_classes( $hook_extra['plugin'] );
		}
		return $response;
	}

	/**
	 * Handles a plugin deletion.
	 *
	 * @param string $plugin_file Path to the plugin file relative to the plugins directory.
	 */
	public function delete_plugin( $plugin_file ) {
		$this->load_plugin_classes( $plugin_file );
	}

	/**
	 * Load classes for a plugin.
	 *
	 * The intention here is to avoid errors on upgrade when a file is deleted,
	 * by loading everything the autoloader knows about before the upgrade
	 * happens.
	 *
	 * Note this can't load classes autoloaded by PSR-0 or PSR-4 unless an
	 * optimized autoloader was used.
	 *
	 * See p9dueE-4c4-p2 for internal discussion.
	 *
	 * @param string $plugin Path to the plugin file relative to the plugins directory.
	 */
	private function load_plugin_classes( $plugin ) {
		global $jetpack_autoloader_loader;
		if ( isset( $jetpack_autoloader_loader ) && defined( 'WP_PLUGIN_DIR' ) ) {
			$jetpack_autoloader_loader->load_classes_in_path( WP_PLUGIN_DIR . '/' . dirname( $plugin ) );
		}
	}
}
