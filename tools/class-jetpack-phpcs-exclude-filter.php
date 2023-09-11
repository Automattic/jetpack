<?php
/**
 * Filter for PHPCS to exclude files in bin/phpcs-excludelist.json.
 *
 * @package automattic/jetpack
 */

use PHP_CodeSniffer\Files\LocalFile;
use PHP_CodeSniffer\Util;

/**
 * Filter for PHPCS to exclude files in bin/phpcs-excludelist.json.
 */
class Jetpack_Phpcs_Exclude_Filter extends Automattic\Jetpack\PhpcsFilter {
	/**
	 * Files to exclude.
	 *
	 * @var string[]|null
	 */
	private $exclude;

	/**
	 * Load exclusion list, if necessary.
	 */
	private function load_exclude() {
		if ( null !== $this->exclude ) {
			return;
		}

		$lines = json_decode( file_get_contents( __DIR__ . '/phpcs-excludelist.json' ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$lines = array_map(
			function ( $line ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				return $this->filterBaseDir . '/' . $line;
			},
			$lines
		);

		$this->exclude = array_flip( $lines );
	}

	/**
	 * Check whether the current element of the iterator is acceptable.
	 *
	 * @return bool
	 */
	public function accept() {
		if ( ! parent::accept() ) {
			return false;
		}

		$this->load_exclude();
		$current = $this->current();
		$file    = Util\Common::realpath( $current instanceof LocalFile ? $current->getFilename() : $current );
		return ! isset( $this->exclude[ $file ] );
	}

	/**
	 * Returns an iterator for the current entry.
	 *
	 * @return \RecursiveIterator
	 */
	public function getChildren() {
		$ret          = parent::getChildren();
		$ret->exclude = $this->exclude;
		return $ret;
	}

}
