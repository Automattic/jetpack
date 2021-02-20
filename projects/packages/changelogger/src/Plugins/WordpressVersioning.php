<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * WordPress versioning plugin.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Plugins;

use Automattic\Jetpack\Changelogger\PluginTrait;
use Automattic\Jetpack\Changelogger\VersioningPlugin;
use InvalidArgumentException;
use Symfony\Component\Console\Input\InputOption;

/**
 * WordPress versioning plugin.
 */
class WordpressVersioning implements VersioningPlugin {
	use PluginTrait;

	/**
	 * Define any command line options the versioning plugin wants to accept.
	 *
	 * @return InputOption[]
	 */
	public function getOptions() {
		return array(
			new InputOption( 'point-release', null, InputOption::VALUE_NONE, 'Do a point release' ),
		);
	}

	/**
	 * Determine the next version given a current version and a set of changes.
	 *
	 * @param string        $version Current version.
	 * @param ChangeEntry[] $changes Changes.
	 * @return string
	 * @throws InvalidArgumentException If the version number is invalid.
	 */
	public function nextVersion( $version, array $changes ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( $this->input->getOption( 'point-release' ) ) {
			if ( ! preg_match( '/^(\d+)\.(\d+)(?:\.(\d+)(?:\D|$)|[^\d.]|$)/', $version, $m ) ) {
				throw new InvalidArgumentException( "Invalid version number \"$version\"" );
			}
			return sprintf( '%d.%d.%d', $m[1], $m[2], isset( $m[3] ) ? $m[3] + 1 : 1 );
		}

		if ( ! preg_match( '/^(\d+)\.(\d+)(?:\D|$)/', $version, $m ) ) {
			throw new InvalidArgumentException( "Invalid version number \"$version\"" );
		}
		$m[2]++;
		if ( $m[2] > 9 ) {
			$m[1]++;
			$m[2] = 0;
		}
		return sprintf( '%d.%d', $m[1], $m[2] );
	}

}
