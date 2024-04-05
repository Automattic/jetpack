<?php
/**
 * Base class for a changelog parser.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelog;

/**
 * Base class for a changelog parser.
 */
abstract class Parser {

	/**
	 * Parse changelog data into a Changelog object.
	 *
	 * @param string $changelog Changelog contents.
	 * @return Changelog
	 */
	abstract public function parse( $changelog ); // @codeCoverageIgnore

	/**
	 * Parse changelog data from a file or stream into a Changelog object.
	 *
	 * @param string|resource $file Filename or stream resource.
	 * @return Changelog
	 */
	public function parseFromFile( $file ) {
		return $this->parse( is_string( $file ) ? file_get_contents( $file ) : stream_get_contents( $file ) );
	}

	/**
	 * Write a Changelog object to a string.
	 *
	 * Note that, while an implementation should try to handle any Changelog
	 * object appropriately, data loss may occur if the Changelog was not
	 * generated by an instance of the same Parser with the same configuration.
	 *
	 * @param Changelog $changelog Changelog object.
	 * @return string
	 */
	abstract public function format( Changelog $changelog ); // @codeCoverageIgnore

	/**
	 * Write a Changelog object to a file or stream.
	 *
	 * @param string|resource $file Filename or stream resource.
	 * @param Changelog       $changelog Changelog object.
	 * @return bool Whether the write succeeded.
	 */
	public function formatToFile( $file, Changelog $changelog ) {
		$contents = $this->format( $changelog );

		if ( is_string( $file ) ) {
			return file_put_contents( $file, $contents ) === strlen( $contents );
		} else {
			while ( '' !== $contents ) {
				$l = fwrite( $file, $contents );
				if ( ! $l ) { // Contrary to the docs, it sometimes returns 0 on error too.
					return false;
				}
				$contents = (string) substr( $contents, $l );
			}
			return true;
		}
	}

	/**
	 * Create a new ChangelogEntry.
	 *
	 * @param string $version See `ChangelogEntry::__construct()`.
	 * @param array  $data See `ChangelogEntry::__construct()`.
	 * @return ChangelogEntry
	 */
	public function newChangelogEntry( $version, $data = array() ) {
		return new ChangelogEntry( $version, $data );
	}

	/**
	 * Create a new ChangeEntry.
	 *
	 * @param array $data See `ChangeEntry::__construct()`.
	 * @return ChangeEntry
	 */
	public function newChangeEntry( $data = array() ) {
		return new ChangeEntry( $data );
	}
}
