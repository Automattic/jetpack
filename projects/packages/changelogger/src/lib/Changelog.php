<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Class representing a changelog.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid

namespace Automattic\Jetpack\Changelog;

use InvalidArgumentException;

/**
 * Class representing a changelog.
 */
class Changelog {

	/**
	 * Content before the changelog itself.
	 *
	 * @var string
	 */
	protected $prologue = '';

	/**
	 * Content after the changelog itself.
	 *
	 * @var string
	 */
	protected $epilogue = '';

	/**
	 * Changelog entries, one per version.
	 *
	 * @var ChangelogEntry[]
	 */
	protected $entries = array();

	/**
	 * Get the prologue content.
	 *
	 * @return string
	 */
	public function getPrologue() {
		return $this->prologue;
	}

	/**
	 * Set the prologue content.
	 *
	 * @param string $prologue Prologue content to set.
	 * @return $this
	 */
	public function setPrologue( $prologue ) {
		$this->prologue = (string) $prologue;
		return $this;
	}

	/**
	 * Get the epilogue content.
	 *
	 * @return string
	 */
	public function getEpilogue() {
		return $this->epilogue;
	}

	/**
	 * Set the epilogue content.
	 *
	 * @param string $epilogue Epilogue content to set.
	 * @return $this
	 */
	public function setEpilogue( $epilogue ) {
		$this->epilogue = (string) $epilogue;
		return $this;
	}

	/**
	 * Get the list of changelog entries.
	 *
	 * @return ChangelogEntry[]
	 */
	public function getEntries() {
		return $this->entries;
	}

	/**
	 * Set the list of changelog entries.
	 *
	 * This replaces all existing entries.
	 *
	 * @param ChangelogEntry[] $entries Changelog entries.
	 * @return $this
	 * @throws InvalidArgumentException If an argument is invalid.
	 */
	public function setEntries( array $entries ) {
		foreach ( $entries as $i => $entry ) {
			if ( ! $entry instanceof ChangelogEntry ) {
				$what = is_object( $entry ) ? get_class( $entry ) : gettype( $entry );
				throw new InvalidArgumentException( __METHOD__ . ": Expected a ChangelogEntry, got $what at index $i" );
			}
		}
		$this->entries = array_values( $entries );
		return $this;
	}

	/**
	 * Get the latest changelog entry.
	 *
	 * @return ChangelogEntry|null
	 */
	public function getLatestEntry() {
		return isset( $this->entries[0] ) ? $this->entries[0] : null;
	}

	/**
	 * Add a new entry as the latest.
	 *
	 * If no new entry object is provided, one will be created. The version
	 * number on the new entry is selected as follows.
	 *
	 * - If there are no existing entries, the new entry is version "0.0.1-dev".
	 * - If the latest existing entry has a version number ending in something
	 *   like "-p1" (see `version_compare()`), the patch number is incremented.
	 * - Otherwise, "-p1" is appended.
	 *
	 * You'll probably want to chain to `ChangelogEntry::setVersion()` to
	 * replace that with something else.
	 *
	 * @param ChangelogEntry|null $entry New entry, or null to create an empty entry.
	 * @return ChangelogEntry The added entry. Always `$entry` if an entry was passed.
	 */
	public function addEntry( ChangelogEntry $entry = null ) {
		if ( null === $entry ) {
			$latest = $this->getLatestEntry();
			if ( $latest ) {
				$version = $latest->getVersion();
				if ( preg_match( '/[._+-]pl?[._+-]?(\d+)$/', $version, $m ) ) {
					$version = substr( $version, 0, -strlen( $m[1] ) ) . ( $m[1] + 1 );
				} else {
					$version .= '-p1';
				}
			} else {
				$version = '0.0.1-dev';
			}
			$entry = new ChangelogEntry( $version );
		}
		array_unshift( $this->entries, $entry );
		return $entry;
	}

	/**
	 * Get the list of versions in the changelog.
	 *
	 * @return string[]
	 */
	public function getVersions() {
		$ret = array();
		foreach ( $this->entries as $entry ) {
			$ret[] = $entry->getVersion();
		}
		return $ret;
	}

	/**
	 * Find an entry by version.
	 *
	 * @param string $version Version to search for.
	 * @param string $operator Operator as for `version_compare()`. Note the
	 *   passed `$version` is passed to `version_compare()` as the second
	 *   argument, and the first entry matching is returned.
	 * @return ChangelogEntry|null
	 */
	public function findEntryByVersion( $version, $operator = '==' ) {
		foreach ( $this->entries as $entry ) {
			if ( version_compare( $entry->getVersion(), $version, $operator ) ) {
				return $entry;
			}
		}
		return null;
	}

	/**
	 * Fetch all entries by a version check.
	 *
	 * @param array $constraints Version constraints. Keys are operations
	 *   recognized by `version_compare()`, values are the version to compare
	 *   with as the second argument.
	 * @return ChangelogEntry[]
	 */
	public function findEntriesByVersions( $constraints ) {
		$ret = array();
		foreach ( $this->entries as $entry ) {
			foreach ( $constraints as $op => $version ) {
				if ( ! version_compare( $entry->getVersion(), $version, $op ) ) {
					continue 2;
				}
			}
			$ret[] = $entry;
		}
		return $ret;
	}

}
