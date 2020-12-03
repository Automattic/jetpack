<?php
/* HEADER */ // phpcs:ignore

/**
 * This class reads autoloader manifest files.
 */
class Manifest_Reader {

	/**
	 * The Version_Selector object.
	 *
	 * @var Version_Selector
	 */
	private $version_selector;

	/**
	 * The constructor.
	 *
	 * @param Version_Selector $version_selector The Version_Selector object.
	 */
	public function __construct( $version_selector ) {
		$this->version_selector = $version_selector;
	}

	/**
	 * Reads all of the manifests in the given plugin paths.
	 *
	 * @param array  $plugin_paths  The paths to the plugins we're loading the manifest in.
	 * @param string $manifest_path The path that we're loading the manifest from in each plugin.
	 * @param array  $path_map The path map to add the contents of the manifests to.
	 *
	 * @return array $path_map The path map we've built using the manifests in each plugin.
	 */
	public function read_manifests( $plugin_paths, $manifest_path, &$path_map ) {
		$file_paths = array_map(
			function ( $path ) use ( $manifest_path ) {
				return trailingslashit( $path ) . $manifest_path;
			},
			$plugin_paths
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

		foreach ( $manifest as $key => $data ) {
			$this->register_record( $key, $data, $path_map );
		}
	}

	/**
	 * Registers an entry from the manifest in the path map.
	 *
	 * @param string $key The identifier for the entry we're registering.
	 * @param array  $data The data for the entry we're registering.
	 * @param array  $path_map The path map to add the contents of the manifest to.
	 */
	protected function register_record( $key, $data, &$path_map ) {
		if ( isset( $path_map[ $key ]['version'] ) ) {
			$selected_version = $path_map[ $key ]['version'];
		} else {
			$selected_version = null;
		}

		if ( $this->version_selector->is_version_update_required( $selected_version, $data['version'] ) ) {
			$path_map[ $key ] = array(
				'version' => $data['version'],
				'path'    => $data['path'],
			);
		}
	}
}
