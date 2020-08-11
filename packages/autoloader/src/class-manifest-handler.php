<?php
/* HEADER */ // phpcs:ignore

/**
 * This class selects the most recent version of a registered path.
 */
class Manifest_Handler {

	/**
	 * The Plugins_Handler object.
	 *
	 * @var Plugins_Handler
	 */
	private $plugins_handler = null;

	/**
	 * The Version_Selector object.
	 *
	 * @var Version_Selector
	 */
	private $version_selector = null;

	/**
	 * The constructor.
	 *
	 * @param Plugins_Handler  $plugins_handler The Plugins_Handler object.
	 * @param Version_Selector $version_selector The Version_Selector object.
	 */
	public function __construct( $plugins_handler, $version_selector ) {
		$this->plugins_handler  = $plugins_handler;
		$this->version_selector = $version_selector;
	}

	/**
	 * Registers all of the paths in a given manifest.
	 *
	 * @param string $manifest_path The path that we're loading the manifest from in each plugin.
	 * @param array  $path_map The path map to add the contents of the manifests to.
	 *
	 * @return array $path_map The path map we've built using the manifests in each plugin.
	 */
	public function register_plugin_manifests( $manifest_path, &$path_map ) {
		$file_paths = array_map(
			function ( $path ) use ( $manifest_path ) {
				return trailingslashit( $path ) . $manifest_path;
			},
			$this->plugins_handler->get_all_active_plugins_paths()
		);

		foreach ( $file_paths as $path ) {
			$this->register_manifest( $path, $path_map );
		}

		return $path_map;
	}

	/**
	 * Registers a plugin's manifest file with the path map.
	 *
	 * @param string $manifest_path The absolute path to the manifest that we're loading.
	 * @param array  $path_map The path map to add the contents of the manifest to.
	 */
	protected function register_manifest( $manifest_path, &$path_map ) {
		if ( ! is_readable( $manifest_path ) ) {
			return;
		}

		$manifest = require $manifest_path;
		if ( ! is_array( $manifest ) ) {
			return;
		}

		foreach ( $manifest as $file_identifier => $file_data ) {
			if ( isset( $path_map[ $file_identifier ]['version'] ) ) {
				$selected_version = $path_map[ $file_identifier ]['version'];
			} else {
				$selected_version = null;
			}

			if ( $this->version_selector->is_version_update_required( $selected_version, $file_data['version'] ) ) {
				$path_map[ $file_identifier ] = array(
					'version' => $file_data['version'],
					'path'    => $file_data['path'],
				);
			}
		}
	}
}
