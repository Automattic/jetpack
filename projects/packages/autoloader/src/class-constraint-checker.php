<?php
/* HEADER */ // phpcs:ignore

/**
 * Semver constraint checker for the Jetpack Autoloader.
 *
 * Uses composer/semver (a required dependency) for accurate constraint matching.
 * Falls back to a lightweight built-in checker if composer/semver is not autoloadable
 * at runtime (e.g., stripped vendor directory).
 */
class Constraint_Checker {

	/**
	 * Cached VersionParser instance (composer/semver).
	 *
	 * @var \Composer\Semver\VersionParser|null|false Null = not yet checked, false = unavailable.
	 */
	private $parser = null;

	/**
	 * Checks whether a version satisfies ALL of the given constraints.
	 *
	 * @param string $version     The version to check (e.g. '3.0.0.0').
	 * @param array  $constraints An array of constraint strings (e.g. array( '^1.0 || ^2.0', '^1.0' )).
	 *
	 * @return bool True if the version satisfies every constraint.
	 */
	public function satisfies_all( $version, $constraints ) {
		if ( empty( $constraints ) ) {
			return true;
		}

		foreach ( $constraints as $constraint ) {
			if ( ! $this->satisfies( $version, $constraint ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Checks whether a version satisfies a single constraint string.
	 *
	 * @param string $version    The version string (e.g. '3.0.0.0').
	 * @param string $constraint The constraint string (e.g. '^1.0 || ^2.0 || ^3.0').
	 *
	 * @return bool True if the version satisfies the constraint.
	 */
	private function satisfies( $version, $constraint ) {
		$constraint = trim( $constraint );
		if ( '' === $constraint || '*' === $constraint ) {
			return true;
		}

		// Try composer/semver first (accurate, handles all edge cases).
		$parser = $this->get_parser();
		if ( false !== $parser ) {
			try {
				$parsed_constraint = $parser->parseConstraints( $constraint );
				$provided          = $parser->parseConstraints( $version );
				return $parsed_constraint->matches( $provided );
			} catch ( \Exception $e ) {
				// Fall through to built-in checker on parse errors.
			}
		}

		// Fallback: lightweight built-in checker for common patterns.
		return $this->satisfies_builtin( $this->normalize_version( $version ), $constraint );
	}

	/**
	 * Returns the cached VersionParser instance, or false if unavailable.
	 *
	 * @return \Composer\Semver\VersionParser|false
	 */
	private function get_parser() {
		if ( null === $this->parser ) {
			if ( class_exists( '\\Composer\\Semver\\VersionParser' ) ) {
				$this->parser = new \Composer\Semver\VersionParser();
			} else {
				$this->parser = false;
			}
		}

		return $this->parser;
	}

	// -------------------------------------------------------------------------
	// Built-in fallback constraint checker (used when composer/semver is absent)
	// -------------------------------------------------------------------------

	/**
	 * Built-in constraint check supporting OR (||), AND (space/comma), ^, ~, >=, <, wildcards.
	 *
	 * @param string $version    The normalized version string.
	 * @param string $constraint The constraint string.
	 *
	 * @return bool True if the version satisfies the constraint.
	 */
	private function satisfies_builtin( $version, $constraint ) {
		// Handle OR alternatives: "^1.0 || ^2.0 || ^3.0"
		$alternatives = preg_split( '/\s*\|\|\s*/', $constraint );
		foreach ( $alternatives as $alt ) {
			if ( $this->satisfies_range( $version, trim( $alt ) ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Checks whether a version satisfies a single range (no OR operators).
	 *
	 * @param string $version The normalized version string.
	 * @param string $range   A single range string.
	 *
	 * @return bool True if the version satisfies the range.
	 */
	private function satisfies_range( $version, $range ) {
		$range = trim( $range );
		if ( '' === $range || '*' === $range ) {
			return true;
		}

		// Handle compound AND constraints: ">=1.0 <3.0" or ">=1.0,<3.0"
		$parts = preg_split( '/\s*,\s*|\s+/', $range );
		if ( count( $parts ) > 1 ) {
			foreach ( $parts as $part ) {
				$part = trim( $part );
				if ( '' !== $part && ! $this->satisfies_single( $version, $part ) ) {
					return false;
				}
			}
			return true;
		}

		return $this->satisfies_single( $version, $range );
	}

	/**
	 * Checks a single atomic constraint.
	 *
	 * @param string $version    The normalized version string.
	 * @param string $constraint A single constraint.
	 *
	 * @return bool True if the version satisfies the constraint.
	 */
	private function satisfies_single( $version, $constraint ) {
		$constraint = trim( $constraint );

		if ( 0 === strpos( $constraint, '^' ) ) {
			return $this->check_caret( $version, substr( $constraint, 1 ) );
		}
		if ( 0 === strpos( $constraint, '~' ) ) {
			return $this->check_tilde( $version, substr( $constraint, 1 ) );
		}
		if ( 0 === strpos( $constraint, '>=' ) ) {
			return version_compare( $version, $this->normalize_version( substr( $constraint, 2 ) ), '>=' );
		}
		if ( 0 === strpos( $constraint, '<=' ) ) {
			return version_compare( $version, $this->normalize_version( substr( $constraint, 2 ) ), '<=' );
		}
		if ( 0 === strpos( $constraint, '>' ) ) {
			return version_compare( $version, $this->normalize_version( substr( $constraint, 1 ) ), '>' );
		}
		if ( 0 === strpos( $constraint, '<' ) ) {
			return version_compare( $version, $this->normalize_version( substr( $constraint, 1 ) ), '<' );
		}
		if ( 0 === strpos( $constraint, '!=' ) ) {
			return version_compare( $version, $this->normalize_version( substr( $constraint, 2 ) ), '!=' );
		}
		if ( false !== strpos( $constraint, '*' ) ) {
			return $this->check_wildcard( $version, $constraint );
		}

		return version_compare( $version, $this->normalize_version( $constraint ), '==' );
	}

	/**
	 * Caret constraint: ^X.Y.Z → >=X.Y.Z <(X+1).0.0. For ^0.Y.Z → >=0.Y.Z <0.(Y+1).0.
	 *
	 * @param string $version The normalized version.
	 * @param string $base    The base version after '^'.
	 *
	 * @return bool
	 */
	private function check_caret( $version, $base ) {
		$base  = $this->normalize_version( trim( $base ) );
		$parts = explode( '.', $base );
		$major = (int) $parts[0];

		if ( 0 === $major && isset( $parts[1] ) ) {
			$next_max = '0.' . ( (int) $parts[1] + 1 ) . '.0';
		} else {
			$next_max = ( $major + 1 ) . '.0.0';
		}

		return version_compare( $version, $base, '>=' ) && version_compare( $version, $next_max, '<' );
	}

	/**
	 * Tilde constraint: ~X.Y → >=X.Y.0 <(X+1).0.0, ~X.Y.Z → >=X.Y.Z <X.(Y+1).0.
	 *
	 * @param string $version The normalized version.
	 * @param string $base    The base version after '~'.
	 *
	 * @return bool
	 */
	private function check_tilde( $version, $base ) {
		$raw_parts = explode( '.', ltrim( trim( $base ), 'vV' ) );
		$base      = $this->normalize_version( trim( $base ) );
		$parts     = explode( '.', $base );

		if ( count( $raw_parts ) >= 3 ) {
			$next_max = $parts[0] . '.' . ( (int) $parts[1] + 1 ) . '.0';
		} else {
			$next_max = ( (int) $parts[0] + 1 ) . '.0.0';
		}

		return version_compare( $version, $base, '>=' ) && version_compare( $version, $next_max, '<' );
	}

	/**
	 * Wildcard constraint: X.Y.* → >=X.Y.0 <X.(Y+1).0.
	 *
	 * @param string $version    The normalized version.
	 * @param string $constraint The wildcard constraint.
	 *
	 * @return bool
	 */
	private function check_wildcard( $version, $constraint ) {
		$base  = array();
		$count = 0;

		foreach ( explode( '.', $constraint ) as $part ) {
			if ( '*' === $part ) {
				break;
			}
			$base[] = $part;
			++$count;
		}

		if ( empty( $base ) ) {
			return true;
		}

		$min_version        = implode( '.', $base ) . '.0';
		$base[ $count - 1 ] = (int) $base[ $count - 1 ] + 1;
		$max_version        = implode( '.', $base ) . '.0';

		return version_compare( $version, $min_version, '>=' ) && version_compare( $version, $max_version, '<' );
	}

	/**
	 * Normalizes a version string: strips 'v' prefix, trailing '.0' padding, ensures X.Y.Z.
	 *
	 * @param string $version The version string to normalize.
	 *
	 * @return string The normalized version.
	 */
	private function normalize_version( $version ) {
		$version = ltrim( trim( $version ), 'vV' );

		// Strip trailing '.0' from Composer's 4-segment format (e.g. '3.0.0.0' → '3.0.0').
		while ( substr_count( $version, '.' ) > 2 && '.0' === substr( $version, -2 ) ) {
			$version = substr( $version, 0, -2 );
		}

		$parts = explode( '.', $version );
		while ( count( $parts ) < 3 ) {
			$parts[] = '0';
		}

		return implode( '.', $parts );
	}

	// -------------------------------------------------------------------------
	// installed.json fallback for old-format manifests
	// -------------------------------------------------------------------------

	/**
	 * Extracts constraints for a given package from a plugin's installed.json file.
	 * Results are cached in a WordPress transient to avoid repeated JSON parsing.
	 *
	 * @param string $plugin_path  The absolute path to the plugin directory.
	 * @param string $package_name The Composer package name (e.g. 'psr/simple-cache').
	 *
	 * @return array An array of constraint strings, or empty array if not found.
	 */
	public function get_constraints_from_installed_json( $plugin_path, $package_name ) {
		$installed_json_path = trailingslashit( $plugin_path ) . 'vendor/composer/installed.json';

		if ( ! is_readable( $installed_json_path ) ) {
			return array();
		}

		// Try to load from transient cache first.
		$cache_key = 'jp_al_constraints_' . md5( $installed_json_path );
		$cached    = function_exists( 'get_transient' ) ? get_transient( $cache_key ) : false;

		if ( false !== $cached && is_array( $cached ) ) {
			return isset( $cached[ $package_name ] ) ? $cached[ $package_name ] : array();
		}

		// Parse installed.json and build a constraint map: package_name => [constraints].
		$constraint_map = $this->parse_installed_json( $installed_json_path );

		// Cache for 1 hour — the file only changes on composer install/update.
		if ( function_exists( 'set_transient' ) ) {
			$hour = defined( 'HOUR_IN_SECONDS' ) ? HOUR_IN_SECONDS : 3600;
			set_transient( $cache_key, $constraint_map, $hour );
		}

		return isset( $constraint_map[ $package_name ] ) ? $constraint_map[ $package_name ] : array();
	}

	/**
	 * Finds the package name that provides a given PSR-4 namespace by scanning installed.json.
	 *
	 * @param string $plugin_path The absolute path to the plugin directory.
	 * @param string $namespace   The PSR-4 namespace key (e.g. 'Psr\\SimpleCache\\').
	 *
	 * @return string The package name, or empty string if not found.
	 */
	public function find_package_for_namespace( $plugin_path, $namespace ) {
		$installed_json_path = trailingslashit( $plugin_path ) . 'vendor/composer/installed.json';

		if ( ! is_readable( $installed_json_path ) ) {
			return '';
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$json = file_get_contents( $installed_json_path );
		if ( false === $json ) {
			return '';
		}

		$data = json_decode( $json, true );
		if ( ! is_array( $data ) ) {
			return '';
		}

		$packages = isset( $data['packages'] ) ? $data['packages'] : $data;
		if ( ! is_array( $packages ) ) {
			return '';
		}

		foreach ( $packages as $package ) {
			if ( ! isset( $package['autoload']['psr-4'] ) || ! isset( $package['name'] ) ) {
				continue;
			}
			foreach ( $package['autoload']['psr-4'] as $ns => $paths ) {
				if ( $ns === $namespace ) {
					return $package['name'];
				}
			}
		}

		return '';
	}

	/**
	 * Parses an installed.json file and returns a map of package_name => [constraint strings].
	 *
	 * @param string $file_path The absolute path to the installed.json file.
	 *
	 * @return array Map of package_name => array of constraint strings.
	 */
	private function parse_installed_json( $file_path ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$json = file_get_contents( $file_path );
		if ( false === $json ) {
			return array();
		}

		$data = json_decode( $json, true );
		if ( ! is_array( $data ) ) {
			return array();
		}

		$packages = isset( $data['packages'] ) ? $data['packages'] : $data;
		if ( ! is_array( $packages ) ) {
			return array();
		}

		$constraint_map = array();
		foreach ( $packages as $package ) {
			if ( ! isset( $package['require'] ) || ! is_array( $package['require'] ) ) {
				continue;
			}
			foreach ( $package['require'] as $dep_name => $constraint ) {
				$constraint_map[ $dep_name ][] = $constraint;
			}
		}

		// Deduplicate.
		foreach ( $constraint_map as $name => $constraints ) {
			$constraint_map[ $name ] = array_values( array_unique( $constraints ) );
		}

		return $constraint_map;
	}
}
