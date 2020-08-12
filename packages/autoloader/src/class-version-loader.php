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
	private $version_selector = null;

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

		// Sort all of the namespaces longest-to-shortest so that the most-specific namespace is used for autoloading.
		uksort(
			$this->psr4_map,
			function ( $a, $b ) {
				$len_a = strlen( $a );
				$len_b = strlen( $b );

				if ( $len_a < $len_b ) {
					return 1;
				} elseif ( $len_b > $len_a ) {
					return -1;
				}

				return 0;
			}
		);
	}

	/**
	 * Finds the file path for the given class.
	 *
	 * @param string $class_name The class to find.
	 * @return string|null $file_path The path to the file if found, null if no class was found.
	 */
	public function find_class_file( $class_name ) {
		$classmap_data = isset( $this->class_map[ $class_name ] ) ? $this->class_map[ $class_name ] : null;
		$psr4_data     = $this->find_psr4_file( $class_name );

		if ( ! isset( $classmap_data ) && ! isset( $psr4_data ) ) {
			return null;
		} elseif ( isset( $classmap_data ) && ! isset( $psr4_data ) ) {
			return $classmap_data['path'];
		} elseif ( ! isset( $classmap_data ) && isset( $psr4_data ) ) {
			return $psr4_data['path'];
		}

		if ( $this->version_selector->is_version_update_required( $classmap_data['version'], $psr4_data['version'] ) ) {
			return $psr4_data['path'];
		}

		return $classmap_data['path'];
	}

	/**
	 * Finds the file for a given class in a PSR-4 namespace.
	 *
	 * @param string $class_name The class to find.
	 * @return array|null $data The version and path path to the file if found, null otherwise.
	 */
	protected function find_psr4_file( $class_name ) {
		if ( ! isset( $this->psr4_map ) ) {
			return null;
		}

		foreach ( $this->psr4_map as $namespace => $data ) {
			$len = strlen( $namespace );
			if ( substr( $class_name, 0, $len ) === $namespace ) {
				$file = $data['path'] . '/' . str_replace( '\\', '/', substr( $class_name, $len ) ) . '.php';
				if ( file_exists( $file ) ) {
					return array(
						'version' => $data['version'],
						'path'    => $file,
					);
				}
			}
		}

		return null;
	}
}
