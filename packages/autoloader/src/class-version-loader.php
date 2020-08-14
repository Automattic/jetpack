<?php
/* HEADER */ // phpcs:ignore

/**
 * This class loads other classes based on given parameters.
 */
class Version_Loader {

	/**
	 * The Version_Selector object.
	 *
	 * @var Version_Selector
	 */
	private $version_selector;

	/**
	 * A map of available classes and their version and file path.
	 *
	 * @var array
	 */
	private $class_map = array();

	/**
	 * A map of PSR-4 namespaces and their version and directory path.
	 *
	 * @var array
	 */
	private $psr4_map = array();

	/**
	 * The constructor.
	 *
	 * @param Version_Selector $version_selector The Version_Selector object.
	 */
	public function __construct( $version_selector ) {
		$this->version_selector = $version_selector;
	}

	/**
	 * Sets the class map used for autoloading.
	 *
	 * @param array $class_map The class version and path map.
	 */
	public function set_class_map( $class_map ) {
		$this->class_map = $class_map;
	}

	/**
	 * Sets the PSR-4 directory paths used for autoloading.
	 *
	 * @param array $psr4_map The PSR-4 version and directory path map.
	 */
	public function set_psr4( $psr4_map ) {
		$this->psr4_map = $psr4_map;
	}

	/**
	 * Finds the file path for the given class.
	 *
	 * @param string $class_name The class to find.
	 *
	 * @return string|null $file_path The path to the file if found, null if no class was found.
	 */
	public function find_class_file( $class_name ) {
		$data = $this->find_newest_file(
			isset( $this->class_map[ $class_name ] ) ? $this->class_map[ $class_name ] : null,
			$this->find_psr4_file( $class_name )
		);
		if ( ! isset( $data ) ) {
			return null;
		}

		return $data['path'];
	}

	/**
	 * Compares different class sources and returns the newest.
	 *
	 * @param array|null $classmap_data The classmap class data.
	 * @param array|null $psr4_data The PSR-4 class data.
	 *
	 * @return array|null $data
	 */
	private function find_newest_file( $classmap_data, $psr4_data ) {
		if ( ! isset( $classmap_data ) ) {
			return $psr4_data;
		} elseif ( ! isset( $psr4_data ) ) {
			return $classmap_data;
		}

		if ( $this->version_selector->is_version_update_required( $classmap_data['version'], $psr4_data['version'] ) ) {
			return $psr4_data;
		}

		return $classmap_data;
	}

	/**
	 * Finds the file for a given class in a PSR-4 namespace.
	 *
	 * @param string $class_name The class to find.
	 *
	 * @return array|null $data The version and path path to the file if found, null otherwise.
	 */
	private function find_psr4_file( $class_name ) {
		if ( ! isset( $this->psr4_map ) ) {
			return null;
		}

		// Don't bother with classes that have no namespace.
		$class_index = strrpos( $class_name, '\\' );
		if ( ! $class_index ) {
			return null;
		}
		$class_namespace = substr( $class_name, 0, $class_index );
		$class_for_path  = str_replace( '\\', '/', $class_name );

		// Find the most-specific namespace for this class.
		for ( ; ! empty( $class_namespace ); $class_namespace = substr( $class_namespace, 0, strrpos( $class_namespace, '\\' ) ) ) {
			$namespace = $class_namespace . '\\';
			if ( ! isset( $this->psr4_map[ $namespace ] ) ) {
				continue;
			}
			$data = $this->psr4_map[ $namespace ];

			foreach ( $data['path'] as $path ) {
				$path .= '/' . substr( $class_for_path, strlen( $namespace ) ) . '.php';
				if ( file_exists( $path ) ) {
					return array(
						'version' => $data['version'],
						'path'    => $path,
					);
				}
			}
		}

		return null;
	}
}
