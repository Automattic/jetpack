<?php
/* HEADER */ // phpcs:ignore

/**
 * This class selects the package versions for the package files.
 */
class Files_Handler {

	/**
	 * The Plugins_Handler object.
	 *
	 * @var Plugins_Handler
	 */
	private $plugins_handler = null;

	/**
	 * The constructor.
	 *
	 * @param Plugins_Handler $plugins_handler The plugins_handler object.
	 */
	public function __construct( $plugins_handler ) {
		$this->plugins_handler = $plugins_handler;
	}

	/**
	 * Adds the version of a package file to the $jetpack_packages_filemap global
	 * array so that we can load the most recent version.
	 *
	 * @param string $file_identifier Unique id to file assigned by composer based on package name and filename.
	 * @param string $version Version of the file.
	 * @param string $path Absolute path to the file so that we can load it.
	 */
	public function enqueue_package_file( $file_identifier, $version, $path ) {
		global $jetpack_packages_filemap;

		if ( ! isset( $jetpack_packages_filemap[ $file_identifier ] ) ) {
			$jetpack_packages_filemap[ $file_identifier ] = array(
				'version' => $version,
				'path'    => $path,
			);

			return;
		}
		// If we have a @dev version set always use that one!
		if ( 'dev-' === substr( $jetpack_packages_filemap[ $file_identifier ]['version'], 0, 4 ) ) {
			return;
		}

		// Always favour the @dev version. Since that version is the same as bleeding edge.
		// We need to make sure that we don't do this in production!
		if ( 'dev-' === substr( $version, 0, 4 ) ) {
			$jetpack_packages_filemap[ $file_identifier ] = array(
				'version' => $version,
				'path'    => $path,
			);

			return;
		}
		// Set the latest version!
		if ( version_compare( $jetpack_packages_filemap[ $file_identifier ]['version'], $version, '<' ) ) {
			$jetpack_packages_filemap[ $file_identifier ] = array(
				'version' => $version,
				'path'    => $path,
			);
		}
	}

	/**
	 *  Initializes the filemap.
	 */
	public function set_file_paths() {
		$paths = $this->plugins_handler->get_active_plugins_paths();

		foreach ( $paths as $path ) {
			if ( is_readable( $path['file'] ) ) {
				$file_map = require $path['file'];

				if ( is_array( $file_map ) ) {
					foreach ( $file_map as $file_identifier => $file_data ) {
						$this->enqueue_package_file( $file_identifier, $file_data['version'], $file_data['path'] );
					}
				}
			}
		}
	}

	/**
	 * Include latest version of all enqueued files.
	 */
	public function file_loader() {
		global $jetpack_packages_filemap;
		foreach ( $jetpack_packages_filemap as $file_identifier => $file_data ) {
			if ( empty( $GLOBALS['__composer_autoload_files'][ $file_identifier ] ) ) {
				require_once $file_data['path'];

				$GLOBALS['__composer_autoload_files'][ $file_identifier ] = true;
			}
		}
	}
}
