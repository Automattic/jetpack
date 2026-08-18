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
	 * The Constraint_Checker object.
	 *
	 * @var Constraint_Checker
	 */
	private $constraint_checker;

	/**
	 * The constructor.
	 *
	 * @param Version_Selector   $version_selector   The Version_Selector object.
	 * @param Constraint_Checker $constraint_checker  The Constraint_Checker object.
	 */
	public function __construct( $version_selector, $constraint_checker = null ) {
		$this->version_selector   = $version_selector;
		$this->constraint_checker = $constraint_checker;
	}

	/**
	 * Reads all of the manifests in the given plugin paths.
	 *
	 * First collects all entries from all plugins, then resolves version conflicts
	 * using constraint-aware selection.
	 *
	 * @param array  $plugin_paths  The paths to the plugins we're loading the manifest in.
	 * @param string $manifest_path The path that we're loading the manifest from in each plugin.
	 * @param array  $path_map The path map to add the contents of the manifests to.
	 *
	 * @return array $path_map The path map we've built using the manifests in each plugin.
	 */
	public function read_manifests( $plugin_paths, $manifest_path, &$path_map ) {
		// Collect all candidates from all plugins, keyed by entry identifier.
		$all_candidates = array();

		foreach ( $plugin_paths as $plugin_path ) {
			$file_path = trailingslashit( $plugin_path ) . $manifest_path;
			$this->collect_manifest_candidates( $file_path, $plugin_path, $all_candidates );
		}

		// Resolve each entry using constraint-aware selection.
		foreach ( $all_candidates as $key => $candidates ) {
			$path_map[ $key ] = $this->resolve_candidates( $candidates );
		}

		return $path_map;
	}

	/**
	 * Collects all entries from a single manifest into the candidates array.
	 *
	 * @param string $manifest_path The absolute path to the manifest file.
	 * @param string $plugin_path   The absolute path to the plugin directory.
	 * @param array  $all_candidates Reference to the candidates collection.
	 */
	private function collect_manifest_candidates( $manifest_path, $plugin_path, &$all_candidates ) {
		if ( ! is_readable( $manifest_path ) ) {
			return;
		}

		$manifest = require $manifest_path;
		if ( ! is_array( $manifest ) ) {
			return;
		}

		foreach ( $manifest as $key => $data ) {
			$data['_plugin_path'] = $plugin_path;
			$data['_entry_key']   = $key;

			// If this manifest doesn't have constraints (old autoloader), we'll fill them later.
			if ( ! isset( $data['constraints'] ) ) {
				$data['constraints'] = array();
			}

			$all_candidates[ $key ][] = $data;
		}
	}

	/**
	 * Resolves multiple candidates for the same entry using constraint-aware selection.
	 *
	 * When all candidates share the same major version, the highest is picked (existing behavior).
	 * When major versions differ, constraints are used to find the version that satisfies all plugins.
	 *
	 * @param array $candidates Array of candidate data arrays, each with version, path, constraints, etc.
	 *
	 * @return array The selected entry (version, path, and optionally other fields).
	 */
	private function resolve_candidates( $candidates ) {
		if ( 1 === count( $candidates ) ) {
			return $this->strip_internal_fields( $candidates[0] );
		}

		// Check if all candidates share the same major version.
		$majors = array();
		foreach ( $candidates as $candidate ) {
			if ( $this->version_selector->is_dev_version( $candidate['version'] ) ) {
				continue;
			}
			$parts    = explode( '.', $candidate['version'] );
			$majors[] = (int) $parts[0];
		}
		$majors = array_unique( $majors );

		// Same major version (or all dev): use existing behavior — pick the highest.
		if ( count( $majors ) <= 1 ) {
			return $this->strip_internal_fields( $this->pick_highest( $candidates ) );
		}

		// Different major versions detected: use constraint-aware selection.
		return $this->strip_internal_fields( $this->resolve_with_constraints( $candidates ) );
	}

	/**
	 * Resolves a multi-major-version conflict using constraint data.
	 *
	 * Strategy:
	 * 1. Collect all constraints from all candidates (embedded in manifests).
	 * 2. For candidates missing constraints (old autoloader), attempt to load them from installed.json.
	 * 3. Find the candidate whose version satisfies ALL collected constraints.
	 * 4. If multiple satisfy, pick the highest. If none satisfy, fall back to highest (existing behavior).
	 *
	 * @param array $candidates Array of candidate data arrays.
	 *
	 * @return array The selected candidate.
	 */
	private function resolve_with_constraints( $candidates ) {
		// Collect all constraints across all candidates.
		$all_constraints = array();
		foreach ( $candidates as $candidate ) {
			$constraints = $candidate['constraints'];

			// Fallback: if no embedded constraints, try installed.json.
			if ( empty( $constraints ) && null !== $this->constraint_checker ) {
				$package_name = isset( $candidate['package'] ) ? $candidate['package'] : '';
				$plugin_path  = isset( $candidate['_plugin_path'] ) ? $candidate['_plugin_path'] : '';

				// If no package name in manifest (old autoloader), try to find it
				// by matching the namespace key against installed.json autoload entries.
				if ( '' === $package_name && '' !== $plugin_path && isset( $candidate['_entry_key'] ) ) {
					$package_name = $this->constraint_checker->find_package_for_namespace(
						$plugin_path,
						$candidate['_entry_key']
					);
				}

				if ( '' !== $package_name && '' !== $plugin_path ) {
					$constraints = $this->constraint_checker->get_constraints_from_installed_json(
						$plugin_path,
						$package_name
					);
				}
			}

			$all_constraints = array_merge( $all_constraints, $constraints );
		}

		$all_constraints = array_values( array_unique( $all_constraints ) );

		// If we have no constraint data at all, fall back to existing behavior.
		if ( empty( $all_constraints ) || null === $this->constraint_checker ) {
			return $this->pick_highest( $candidates );
		}

		// Find candidates that satisfy ALL collected constraints.
		$satisfying = array();
		foreach ( $candidates as $candidate ) {
			if ( $this->version_selector->is_dev_version( $candidate['version'] ) ) {
				continue;
			}
			if ( $this->constraint_checker->satisfies_all( $candidate['version'], $all_constraints ) ) {
				$satisfying[] = $candidate;
			}
		}

		// If exactly zero satisfy, this is a genuine conflict. Fall back to highest and log a warning.
		if ( empty( $satisfying ) ) {
			$this->log_version_conflict( $candidates, $all_constraints );
			return $this->pick_highest( $candidates );
		}

		// Among satisfying candidates, pick the highest version.
		return $this->pick_highest( $satisfying );
	}

	/**
	 * Picks the candidate with the highest version (existing autoloader behavior).
	 *
	 * @param array $candidates Array of candidate data arrays.
	 *
	 * @return array The candidate with the highest version.
	 */
	private function pick_highest( $candidates ) {
		$selected = $candidates[0];

		for ( $i = 1, $len = count( $candidates ); $i < $len; $i++ ) {
			if ( $this->version_selector->is_version_update_required( $selected['version'], $candidates[ $i ]['version'] ) ) {
				$selected = $candidates[ $i ];
			}
		}

		return $selected;
	}

	/**
	 * Removes internal tracking fields before returning a candidate entry.
	 *
	 * @param array $candidate The candidate data.
	 *
	 * @return array The cleaned candidate with only version and path.
	 */
	private function strip_internal_fields( $candidate ) {
		return array(
			'version' => $candidate['version'],
			'path'    => $candidate['path'],
		);
	}

	/**
	 * Logs a warning when no available version satisfies all constraints.
	 *
	 * @param array $candidates      The conflicting candidates.
	 * @param array $all_constraints The combined constraints that could not be satisfied.
	 */
	private function log_version_conflict( $candidates, $all_constraints ) {
		$versions = array();
		foreach ( $candidates as $c ) {
			$pkg        = isset( $c['package'] ) ? $c['package'] : 'unknown';
			$versions[] = $pkg . '@' . $c['version'];
		}

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log(
			sprintf(
				'Jetpack Autoloader: Version conflict detected. Available: %s. Constraints: %s. Falling back to highest version.',
				implode( ', ', $versions ),
				implode( ', ', $all_constraints )
			)
		);
	}
}
