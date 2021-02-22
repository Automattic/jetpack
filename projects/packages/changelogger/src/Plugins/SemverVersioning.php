<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Semver versioning plugin.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Plugins;

use Automattic\Jetpack\Changelogger\PluginTrait;
use Automattic\Jetpack\Changelogger\VersioningPlugin;
use InvalidArgumentException;

/**
 * Semver versioning plugin.
 */
class SemverVersioning implements VersioningPlugin {
	use PluginTrait;

	/**
	 * Determine the next version given a current version and a set of changes.
	 *
	 * @param string        $version Current version.
	 * @param ChangeEntry[] $changes Changes.
	 * @return string
	 * @throws InvalidArgumentException If the version number is invalid.
	 */
	public function nextVersion( $version, array $changes ) {
		if ( ! preg_match( '/^(\d+)\.(\d+)\.(\d+)(?:\D|$)/', $version, $m ) ) {
			throw new InvalidArgumentException( "Invalid version number \"$version\"" );
		}

		$significances = array();
		foreach ( $changes as $change ) {
			$significances[ (string) $change->getSignificance() ] = true;
		}
		if ( isset( $significances['major'] ) ) {
			if ( 0 === (int) $m[1] ) {
				if ( is_callable( array( $this->output, 'getErrorOutput' ) ) ) {
					$out = $this->output->getErrorOutput();
					$out->writeln( '<warning>Semver does not automatically move version 0.y.z to 1.0.0.</>' );
					$out->writeln( '<warning>You will have to do that manually when you\'re ready for the first release.</>' );
				}
				return sprintf( '0.%d.0', $m[2] + 1 );
			}
			return sprintf( '%d.0.0', $m[1] + 1 );
		} elseif ( isset( $significances['minor'] ) ) {
			return sprintf( '%d.%d.0', $m[1], $m[2] + 1 );
		} else {
			return sprintf( '%d.%d.%d', $m[1], $m[2], $m[3] + 1 );
		}
	}

}
