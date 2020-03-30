<?php
/* HEADER */ // phpcs:ignore

/**
 * This class selects the package versions for the package classes.
 */
class Classes_Handler {

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
	 * Adds the version of a package to the $jetpack_packages_classmap global
	 * array so that the autoloader is able to find it.
	 *
	 * @param string $class_name Name of the class that you want to autoload.
	 * @param string $version Version of the class.
	 * @param string $path Absolute path to the class so that we can load it.
	 */
	public function enqueue_package_class( $class_name, $version, $path ) {
		global $jetpack_packages_classmap;

		if ( ! isset( $jetpack_packages_classmap[ $class_name ] ) ) {
			$jetpack_packages_classmap[ $class_name ] = array(
				'version' => $version,
				'path'    => $path,
			);

			return;
		}
		// If we have a @dev version set always use that one!
		if ( 'dev-' === substr( $jetpack_packages_classmap[ $class_name ]['version'], 0, 4 ) ) {
			return;
		}

		// Always favour the @dev version. Since that version is the same as bleeding edge.
		// We need to make sure that we don't do this in production!
		if ( 'dev-' === substr( $version, 0, 4 ) ) {
			$jetpack_packages_classmap[ $class_name ] = array(
				'version' => $version,
				'path'    => $path,
			);

			return;
		}
		// Set the latest version!
		if ( version_compare( $jetpack_packages_classmap[ $class_name ]['version'], $version, '<' ) ) {
			$jetpack_packages_classmap[ $class_name ] = array(
				'version' => $version,
				'path'    => $path,
			);
		}
	}

	/**
	 *  Initializes the classmap.
	 */
	public function set_class_paths() {
		$paths = $this->plugins_handler->get_active_plugins_paths();

		foreach ( $paths as $path ) {
			if ( is_readable( $path['class'] ) ) {
				$class_map = require $path['class'];

				if ( is_array( $class_map ) ) {
					foreach ( $class_map as $class_name => $class_info ) {
						$this->enqueue_package_class( $class_name, $class_info['version'], $class_info['path'] );
					}
				}
			}
		}
	}
}
