<?php
/**
 * Class representing a changelog.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelog;

use InvalidArgumentException;
use JsonSerializable;

/**
 * Class representing a changelog.
 */
class Changelog implements JsonSerializable {

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
	 * @param ChangelogEntry $entry New entry.
	 * @return $this
	 */
	public function addEntry( ChangelogEntry $entry ) {
		array_unshift( $this->entries, $entry );
		return $this;
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
	 * Return data for serializing to JSON.
	 *
	 * @return array
	 */
	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return array(
			'__class__' => static::class,
			'prologue'  => $this->prologue,
			'epilogue'  => $this->epilogue,
			'entries'   => $this->entries,
		);
	}

	/**
	 * Unserialize from JSON.
	 *
	 * @param array $data JSON data as returned by self::jsonSerialize().
	 * @return static
	 * @throws InvalidArgumentException If the data is invalid.
	 */
	public static function jsonUnserialize( $data ) {
		$data = (array) $data;
		if ( ! isset( $data['__class__'] ) ) {
			throw new InvalidArgumentException( 'Invalid data' );
		}
		$class = $data['__class__'];
		unset( $data['__class__'] );
		if ( ! class_exists( $class ) || ! is_a( $class, static::class, true ) ) {
			throw new InvalidArgumentException( "Cannot instantiate $class via " . static::class . '::' . __FUNCTION__ );
		}
		$ret = new $class();
		if ( isset( $data['prologue'] ) ) {
			$ret->setPrologue( $data['prologue'] );
		}
		if ( isset( $data['epilogue'] ) ) {
			$ret->setEpilogue( $data['epilogue'] );
		}
		if ( isset( $data['entries'] ) ) {
			$ret->setEntries( array_map( array( ChangelogEntry::class, 'jsonUnserialize' ), $data['entries'] ) );
		}
		return $ret;
	}

}
