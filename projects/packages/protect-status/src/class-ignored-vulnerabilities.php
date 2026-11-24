<?php
/**
 * Storage for vulnerabilities a site owner has chosen to ignore.
 *
 * @package automattic/jetpack-protect-status
 */

namespace Automattic\Jetpack\Protect_Status;

use Automattic\Jetpack\Protect_Models\Threat_Model;
use Automattic\Jetpack\Protect_Models\Vulnerability_Model;

/**
 * Stores ignored vulnerabilities per extension, keyed by type and slug.
 *
 * @since $$next-version$$
 */
class Ignored_Vulnerabilities {

	/**
	 * Name of the option holding the ignored vulnerabilities.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_protect_ignored_vulnerabilities';

	/**
	 * Ignore every vulnerability of a threat, replacing any earlier entry for its extension.
	 *
	 * @since $$next-version$$
	 *
	 * @param Threat_Model $threat The threat to ignore.
	 * @return bool False when the threat has no extension or no vulnerabilities.
	 */
	public static function ignore( Threat_Model $threat ) {
		if ( empty( $threat->extension ) || empty( $threat->vulnerabilities ) ) {
			return false;
		}

		$vulnerabilities = array();
		foreach ( $threat->vulnerabilities as $vulnerability ) {
			$vulnerabilities[ self::key( $vulnerability ) ] = (string) $vulnerability->title;
		}

		$stored = self::read();

		$stored[ $threat->extension->type ][ $threat->extension->slug ] = array(
			'threat_id'       => $threat->id,
			'name'            => $threat->extension->name,
			'version'         => $threat->extension->version,
			'ignored_at'      => gmdate( 'Y-m-d H:i:s' ),
			'vulnerabilities' => $vulnerabilities,
		);

		return self::write( $stored );
	}

	/**
	 * Stop ignoring the threat with the given ID.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $threat_id The threat ID.
	 * @return bool False when no stored entry matches.
	 */
	public static function unignore( $threat_id ) {
		$stored = self::read();

		foreach ( $stored as $type => $extensions ) {
			foreach ( $extensions as $slug => $entry ) {
				if ( isset( $entry['threat_id'] ) && $entry['threat_id'] === $threat_id ) {
					unset( $stored[ $type ][ $slug ] );
					if ( empty( $stored[ $type ] ) ) {
						unset( $stored[ $type ] );
					}
					return self::write( $stored );
				}
			}
		}

		return false;
	}

	/**
	 * Whether every given vulnerability is ignored for the extension.
	 *
	 * @since $$next-version$$
	 *
	 * @param string                     $type            Extension type.
	 * @param string                     $slug            Extension slug.
	 * @param array<Vulnerability_Model> $vulnerabilities Current vulnerabilities.
	 * @return bool
	 */
	public static function is_ignored( $type, $slug, array $vulnerabilities ) {
		if ( empty( $vulnerabilities ) ) {
			return false;
		}

		$ignored = self::read()[ $type ][ $slug ]['vulnerabilities'] ?? array();

		foreach ( $vulnerabilities as $vulnerability ) {
			if ( ! isset( $ignored[ self::key( $vulnerability ) ] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Drop stored vulnerabilities that are no longer reported for the extension.
	 *
	 * @since $$next-version$$
	 *
	 * @param string                     $type            Extension type.
	 * @param string                     $slug            Extension slug.
	 * @param array<Vulnerability_Model> $vulnerabilities Current vulnerabilities.
	 * @return void
	 */
	public static function prune( $type, $slug, array $vulnerabilities ) {
		$stored = self::read();

		if ( ! isset( $stored[ $type ][ $slug ]['vulnerabilities'] ) ) {
			return;
		}

		$current = array();
		foreach ( $vulnerabilities as $vulnerability ) {
			$current[ self::key( $vulnerability ) ] = true;
		}

		$kept = array_intersect_key( $stored[ $type ][ $slug ]['vulnerabilities'], $current );
		if ( count( $kept ) === count( $stored[ $type ][ $slug ]['vulnerabilities'] ) ) {
			return;
		}

		if ( empty( $kept ) ) {
			unset( $stored[ $type ][ $slug ] );
			if ( empty( $stored[ $type ] ) ) {
				unset( $stored[ $type ] );
			}
		} else {
			$stored[ $type ][ $slug ]['vulnerabilities'] = $kept;
		}

		self::write( $stored );
	}

	/**
	 * Register the hooks that clear ignores when an extension is deleted.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function register_hooks() {
		add_action( 'deleted_plugin', array( self::class, 'on_plugin_deleted' ), 10, 2 );
		add_action( 'deleted_theme', array( self::class, 'on_theme_deleted' ), 10, 2 );
	}

	/**
	 * Drop the ignore for a plugin once it is deleted.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $plugin_file Plugin file, such as `akismet/akismet.php`.
	 * @param bool   $deleted     Whether the deletion succeeded.
	 * @return void
	 */
	public static function on_plugin_deleted( $plugin_file, $deleted ) {
		if ( $deleted ) {
			self::remove_extension( 'plugins', $plugin_file );
		}
	}

	/**
	 * Drop the ignore for a theme once it is deleted.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $stylesheet Theme stylesheet.
	 * @param bool   $deleted    Whether the deletion succeeded.
	 * @return void
	 */
	public static function on_theme_deleted( $stylesheet, $deleted ) {
		if ( $deleted ) {
			self::remove_extension( 'themes', $stylesheet );
		}
	}

	/**
	 * Remove the stored entry for one extension.
	 *
	 * @param string $type Extension type.
	 * @param string $slug Extension slug.
	 * @return void
	 */
	private static function remove_extension( $type, $slug ) {
		$stored = self::read();

		if ( ! isset( $stored[ $type ][ $slug ] ) ) {
			return;
		}

		unset( $stored[ $type ][ $slug ] );
		if ( empty( $stored[ $type ] ) ) {
			unset( $stored[ $type ] );
		}

		self::write( $stored );
	}

	/**
	 * Get all ignored entries as a flat list.
	 *
	 * @since $$next-version$$
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public static function get_all() {
		$all = array();

		foreach ( self::read() as $type => $extensions ) {
			foreach ( $extensions as $slug => $entry ) {
				$all[] = array(
					'type'            => $type,
					'slug'            => $slug,
					'threat_id'       => $entry['threat_id'] ?? null,
					'name'            => $entry['name'] ?? null,
					'version'         => $entry['version'] ?? null,
					'ignored_at'      => $entry['ignored_at'] ?? null,
					'vulnerabilities' => $entry['vulnerabilities'] ?? array(),
				);
			}
		}

		return $all;
	}

	/**
	 * Delete the option.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function delete_option() {
		return delete_option( self::OPTION_NAME );
	}

	/**
	 * Key identifying a vulnerability: its ID, or its title when it has none.
	 *
	 * @param object $vulnerability A vulnerability with `id` and `title`.
	 * @return string
	 */
	private static function key( $vulnerability ) {
		return empty( $vulnerability->id ) ? 'title:' . $vulnerability->title : (string) $vulnerability->id;
	}

	/**
	 * Read the stored data.
	 *
	 * @return array
	 */
	private static function read() {
		$stored = get_option( self::OPTION_NAME, array() );
		return is_array( $stored ) ? $stored : array();
	}

	/**
	 * Write the stored data without autoloading it.
	 *
	 * @param array $stored The data.
	 * @return bool
	 */
	private static function write( array $stored ) {
		if ( self::read() === $stored ) {
			return true;
		}

		return update_option( self::OPTION_NAME, $stored, false );
	}
}
