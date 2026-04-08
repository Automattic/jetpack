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
	private $classmap;

	/**
	 * A map of PSR-4 namespaces and their version and directory path.
	 *
	 * @var array
	 */
	private $psr4_map;

	/**
	 * A map of all the files that we should load.
	 *
	 * @var array
	 */
	private $filemap;

	/**
	 * Cache: resolved and unresolved classes.
	 *
	 * @var array<string,mixed>
	 */
	private $resolved_classes = array();

	/**
	 * Cache: resolved PRS4 namespaces.
	 *
	 * @var array<string,string>
	 */
	private $resolved_namespaces = array();

	/**
	 * The constructor.
	 *
	 * @param Version_Selector $version_selector The Version_Selector object.
	 * @param array            $classmap The verioned classmap to load using.
	 * @param array            $psr4_map The versioned PSR-4 map to load using.
	 * @param array            $filemap The versioned filemap to load.
	 */
	public function __construct( $version_selector, $classmap, $psr4_map, $filemap ) {
		$this->version_selector = $version_selector;
		$this->classmap         = $classmap;
		$this->psr4_map         = $psr4_map;
		$this->filemap          = $filemap;
	}

	/**
	 * Fetch the classmap.
	 *
	 * @since 3.1.0
	 * @return array<string, array>
	 */
	public function get_class_map() {
		return $this->classmap;
	}

	/**
	 * Fetch the psr-4 mappings.
	 *
	 * @since 3.1.0
	 * @return array<string, array>
	 */
	public function get_psr4_map() {
		return $this->psr4_map;
	}

	/**
	 * Finds the file path for the given class.
	 *
	 * @param string $class_name The class to find.
	 *
	 * @return string|null $file_path The path to the file if found, null if no class was found.
	 */
	public function find_class_file( $class_name ) {
		// Prevent repeated attempts to load non-existent classes during class existence checks.
		// These attempts occur when extensions perform compatibility and integration checks.
		if ( ! array_key_exists( $class_name, $this->resolved_classes ) ) {
			$data                                  = $this->select_newest_file(
				$this->classmap[ $class_name ] ?? null,
				$this->find_psr4_file( $class_name )
			);
			$this->resolved_classes[ $class_name ] = $data['path'] ?? null;
		}

		return $this->resolved_classes[ $class_name ];
	}

	/**
	 * Load all of the files in the filemap.
	 */
	public function load_filemap() {
		if ( empty( $this->filemap ) ) {
			return;
		}

		foreach ( $this->filemap as $file_identifier => $file_data ) {
			if ( empty( $GLOBALS['__composer_autoload_files'][ $file_identifier ] ) ) {
				require_once $file_data['path'];

				$GLOBALS['__composer_autoload_files'][ $file_identifier ] = true;
			}
		}
	}

	/**
	 * Compares different class sources and returns the newest.
	 *
	 * @param array|null $classmap_data The classmap class data.
	 * @param array|null $psr4_data The PSR-4 class data.
	 *
	 * @return array|null $data
	 */
	private function select_newest_file( $classmap_data, $psr4_data ) {
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
		if ( empty( $this->psr4_map ) ) {
			return null;
		}

		// Don't bother with classes that have no namespace.
		$class_index = strrpos( $class_name, '\\' );
		if ( ! $class_index ) {
			return null;
		}
		$class_for_path     = str_replace( '\\', '/', $class_name );
		$original_namespace = substr( $class_name, 0, $class_index );

		// Warm phase: Since a previous lookup resolved a file in the same namespace, we will first
		// search for the target file in the same PSR4 map. It is likely that we will find it there.
		// TBD: hit to miss ratio for WooCommerce as an example to verify this warm branch working.
		if ( isset( $this->resolved_namespaces[ $original_namespace ] ) ) {
			$namespace = $this->resolved_namespaces[ $original_namespace ];
			$suffix    = '/' . substr( $class_for_path, strlen( $namespace ) ) . '.php';
			$data      = $this->psr4_map[ $namespace ];
			foreach ( $data['path'] as $path ) {
				$file = $path . $suffix;
				if ( file_exists( $file ) ) {
					return array(
						'version' => $data['version'],
						'path'    => $file,
					);
				}
			}
		}

		// Cold phase: search for the namespace by iteratively removing the last segment until a match
		// is found. This approach prioritizes the most specific namespaces, reducing search time.
		for (
			$class_namespace = $original_namespace;
			! empty( $class_namespace );
			$class_namespace = substr( $class_namespace, 0, strrpos( $class_namespace, '\\' ) )
		) {
			$namespace = $class_namespace . '\\';
			if ( ! isset( $this->psr4_map[ $namespace ] ) ) {
				continue;
			}

			$suffix = '/' . substr( $class_for_path, strlen( $namespace ) ) . '.php';
			$data   = $this->psr4_map[ $namespace ];
			foreach ( $data['path'] as $path ) {
				$file = $path . $suffix;
				if ( file_exists( $file ) ) {
					$this->resolved_namespaces[ $original_namespace ] = $namespace;
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
