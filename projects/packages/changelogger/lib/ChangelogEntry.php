<?php
/**
 * Class representing a changelog entry.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelog;

use DateTime;
use InvalidArgumentException;
use JsonSerializable;

/**
 * Class representing a changelog entry.
 */
class ChangelogEntry implements JsonSerializable {

	/**
	 * Entry version.
	 *
	 * @var string
	 */
	protected $version;

	/**
	 * Entry link.
	 *
	 * @var string|null
	 */
	protected $link = null;

	/**
	 * Entry timestamp.
	 *
	 * @var DateTime|null
	 */
	protected $timestamp;

	/**
	 * Content before the changes themselves.
	 *
	 * @var string
	 */
	protected $prologue = '';

	/**
	 * Content after the changes themselves.
	 *
	 * @var string
	 */
	protected $epilogue = '';

	/**
	 * Changes.
	 *
	 * @var ChangeEntry[]
	 */
	protected $changes = array();

	/**
	 * Constructor.
	 *
	 * @param string $version Version for the new entry.
	 * @param array  $data Data for other entry fields. Keys correspond to the setters, e.g. key 'link' calls `setLink()`.
	 * @throws InvalidArgumentException If an argument is invalid.
	 */
	public function __construct( $version, array $data = array() ) {
		$data = array( 'version' => $version ) + $data + array( 'timestamp' => 'now' );
		foreach ( $data as $k => $v ) {
			$func = array( $this, 'set' . ucfirst( $k ) );
			if ( is_callable( $func ) ) {
				$func( $v );
			} else {
				throw new InvalidArgumentException( __METHOD__ . ": Unrecognized data item \"$k\"." );
			}
		}
	}

	/**
	 * Get the version.
	 *
	 * @return string
	 */
	public function getVersion() {
		return $this->version;
	}

	/**
	 * Set the version.
	 *
	 * @param string $version Version to set.
	 * @returns $this
	 * @throws InvalidArgumentException If an argument is invalid.
	 */
	public function setVersion( $version ) {
		$version = (string) $version;
		if ( '' === $version ) {
			throw new InvalidArgumentException( __METHOD__ . ': Version may not be empty' );
		}
		$this->version = (string) $version;
		return $this;
	}

	/**
	 * Get the link.
	 *
	 * @return string|null
	 */
	public function getLink() {
		return $this->link;
	}

	/**
	 * Set the link.
	 *
	 * @param string|null $link Link to set.
	 * @returns $this
	 * @throws InvalidArgumentException If an argument is invalid.
	 */
	public function setLink( $link ) {
		if ( '' === $link ) {
			$link = null;
		} elseif ( null !== $link ) {
			$link = filter_var( $link, FILTER_VALIDATE_URL );
			if ( ! is_string( $link ) ) {
				throw new InvalidArgumentException( __METHOD__ . ': Invalid URL' );
			}
		}
		$this->link = $link;
		return $this;
	}

	/**
	 * Get the timestamp.
	 *
	 * The timestamp may be null, which should be interpreted as "unreleased".
	 *
	 * @return DateTime|null
	 */
	public function getTimestamp() {
		return $this->timestamp;
	}

	/**
	 * Set the timestamp.
	 *
	 * The timestamp may be null, which should be interpreted as "unreleased".
	 *
	 * @param DateTime|string|null $timestamp Timestamp to set.
	 * @returns $this
	 * @throws InvalidArgumentException If an argument is invalid.
	 */
	public function setTimestamp( $timestamp ) {
		if ( null !== $timestamp && ! $timestamp instanceof DateTime ) {
			try {
				$timestamp = new DateTime( $timestamp );
			} catch ( \Exception $ex ) {
				throw new InvalidArgumentException( __METHOD__ . ': Invalid timestamp', 0, $ex );
			}
		}
		$this->timestamp = $timestamp;
		return $this;
	}

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
	 * Get the list of changes.
	 *
	 * @return ChangeEntry[]
	 */
	public function getChanges() {
		return $this->changes;
	}

	/**
	 * Set the list of changes.
	 *
	 * This replaces all existing changes. The caller is responsible
	 * for making sure the changes are sorted properly.
	 *
	 * @param ChangeEntry[] $changes Changes.
	 * @return $this
	 * @throws InvalidArgumentException If an argument is invalid.
	 */
	public function setChanges( array $changes ) {
		foreach ( $changes as $i => $change ) {
			if ( ! $change instanceof ChangeEntry ) {
				$what = is_object( $change ) ? get_class( $change ) : gettype( $change );
				throw new InvalidArgumentException( __METHOD__ . ": Expected a ChangeEntry, got $what at index $i" );
			}
		}
		$this->changes = array_values( $changes );
		return $this;
	}

	/**
	 * Add a new change.
	 *
	 * The new change is inserted before the first existing change where
	 * `ChangeEntry::compare()` says the existing change should come after.
	 *
	 * @param ChangeEntry $change New change.
	 * @param array       $compareconfig Comparison config, see `ChangeEntry::compare()`.
	 * @return $this
	 */
	public function insertChange( ChangeEntry $change, $compareconfig = array() ) {
		foreach ( $this->changes as $i => $e ) {
			if ( ChangeEntry::compare( $change, $e, $compareconfig ) < 0 ) {
				array_splice( $this->changes, $i, 0, array( $change ) );
				return $this;
			}
		}
		$this->changes[] = $change;
		return $this;
	}

	/**
	 * Append a new change.
	 *
	 * @param ChangeEntry $change New change.
	 * @return $this
	 */
	public function appendChange( ChangeEntry $change ) {
		$this->changes[] = $change;
		return $this;
	}

	/**
	 * Get the changes grouped by subheading.
	 *
	 * @param string|null $subheading Subheading to retrieve.
	 * @return ChangeEntry[]|ChangeEntry[][] An array of changes with the
	 *   heading if `$subheading` was passed, or an array keyed by subheading of
	 *   arrays of changes if it was null.
	 */
	public function getChangesBySubheading( $subheading = null ) {
		$ret = array();
		foreach ( $this->changes as $entry ) {
			$ret[ $entry->getSubheading() ][] = $entry;
		}

		return null === $subheading
			? $ret
			: ( isset( $ret[ $subheading ] ) ? $ret[ $subheading ] : array() );
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
			'version'   => $this->version,
			'link'      => $this->link,
			'timestamp' => null === $this->timestamp ? null : $this->timestamp->format( DateTime::ISO8601 ),
			'prologue'  => $this->prologue,
			'epilogue'  => $this->epilogue,
			'changes'   => $this->changes,
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
		if ( ! isset( $data['__class__'] ) || ! isset( $data['version'] ) ) {
			throw new InvalidArgumentException( 'Invalid data' );
		}
		$class   = $data['__class__'];
		$version = $data['version'];
		unset( $data['__class__'], $data['version'] );
		if ( ! class_exists( $class ) || ! is_a( $class, static::class, true ) ) {
			throw new InvalidArgumentException( "Cannot instantiate $class via " . static::class . '::' . __FUNCTION__ );
		}
		if ( isset( $data['changes'] ) ) {
			$data['changes'] = array_map( array( ChangeEntry::class, 'jsonUnserialize' ), $data['changes'] );
		}
		return new $class( $version, $data );
	}

}
