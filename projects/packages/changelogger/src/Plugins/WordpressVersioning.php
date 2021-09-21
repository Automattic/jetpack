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
 *
 * - Major versions are in the form of a decimal number with tenths, e.g "9.4".
 * - Point releases add another number after a dot.
 * - Prerelease versions add a suffix: "-dev", "-alpha", "-beta", or "-rc",
 *   with an optional number after all except "-dev".
 * - Buildinfo adds any other `[a-zA-Z0-9.-]` after a '+' suffix.
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
	 * Parse a WordPress-style version.
	 *
	 * @param string $version Version.
	 * @return array With components:
	 *  - major: (float) Major version.
	 *  - point: (int) Point version.
	 *  - prerelease: (string|null) Pre-release string.
	 *  - buildinfo: (string|null) Build metadata string.
	 * @throws InvalidArgumentException If the version number is not in a recognized format.
	 */
	private function parseVersion( $version ) {
		if ( ! preg_match( '/^(?P<major>\d+\.\d)(?:\.(?P<point>\d+))?(?:-(?P<prerelease>dev|(?:alpha|beta|rc)\d*|\d\d(?:0[1-9]|1[0-2])\.\d+))?(?:\+(?P<buildinfo>[0-9a-zA-Z.-]+))?$/', $version, $m ) ) {
			throw new InvalidArgumentException( "Version number \"$version\" is not in a recognized format." );
		}
		return array(
			'major'      => (float) $m['major'],
			'point'      => (int) ( isset( $m['point'] ) ? $m['point'] : null ),
			'prerelease' => isset( $m['prerelease'] ) && '' !== $m['prerelease'] ? $m['prerelease'] : null,
			'buildinfo'  => isset( $m['buildinfo'] ) && '' !== $m['buildinfo'] ? $m['buildinfo'] : null,
		);
	}

	/**
	 * Check and normalize a version number.
	 *
	 * @param string $version Version string.
	 * @return string Normalized version.
	 * @throws InvalidArgumentException If the version number is not in a recognized format.
	 */
	public function normalizeVersion( $version ) {
		// The ability to pass an array is an internal-only feature.
		if ( is_array( $version ) ) {
			$info = $version + array(
				'prerelease' => null,
				'buildinfo'  => null,
			);
			$test = $this->parseVersion( '0.0' );
			if ( array_intersect_key( $test, $info ) !== $test ) {
				throw new InvalidArgumentException( 'Version array is not in a recognized format.' );
			}
		} else {
			$info = $this->parseVersion( $version );
		}

		$ret = sprintf( '%.1f', $info['major'] );
		if ( 0 !== $info['point'] ) {
			$ret .= '.' . $info['point'];
		}
		if ( null !== $info['prerelease'] ) {
			$ret .= '-' . $info['prerelease'];
		}
		if ( null !== $info['buildinfo'] ) {
			$ret .= '+' . $info['buildinfo'];
		}
		return $ret;
	}

	/**
	 * Validate an `$extra` array.
	 *
	 * @param array $extra Extra components for the version. See `nextVersion()`.
	 * @return array
	 * @throws InvalidArgumentException If the `$extra` data is invalid.
	 */
	private function validateExtra( array $extra ) {
		$info = array();

		if ( isset( $extra['prerelease'] ) ) {
			try {
				$info['prerelease'] = $this->parseVersion( '0.0-' . $extra['prerelease'] )['prerelease'];
			} catch ( InvalidArgumentException $ex ) {
				throw new InvalidArgumentException( 'Invalid prerelease data' );
			}
		} else {
			$info['prerelease'] = null;
		}
		if ( isset( $extra['buildinfo'] ) ) {
			try {
				$info['buildinfo'] = $this->parseVersion( '0.0+' . $extra['buildinfo'] )['buildinfo'];
			} catch ( InvalidArgumentException $ex ) {
				throw new InvalidArgumentException( 'Invalid buildinfo data' );
			}
		} else {
			$info['buildinfo'] = null;
		}

		return $info;
	}

	/**
	 * Determine the next version given a current version and a set of changes.
	 *
	 * @param string        $version Current version.
	 * @param ChangeEntry[] $changes Changes.
	 * @param array         $extra Extra components for the version.
	 * @return string
	 * @throws InvalidArgumentException If the version number is not in a recognized format, or other arguments are invalid.
	 */
	public function nextVersion( $version, array $changes, array $extra = array() ) {
		$info = array_merge(
			$this->parseVersion( $version ),
			$this->validateExtra( $extra )
		);

		if ( $this->input->getOption( 'point-release' ) ) {
			$info['point']++;
		} else {
			$info['point']  = 0;
			$info['major'] += 0.1;
		}

		return $this->normalizeVersion( $info );
	}

	/**
	 * Extract the index and count from a prerelease string.
	 *
	 * @param string|null $s String.
	 * @return array Two elements: index and count.
	 * @throws InvalidArgumentException If the string is invalid.
	 */
	private function parsePrerelease( $s ) {
		if ( null === $s ) {
			return array( 100, 0 );
		}
		foreach ( array( 'dev', 'alpha(\d*)', '\d\d(?:0[1-9]|1[0-2])\.(\d+)', 'beta(\d*)', 'rc(\d*)' ) as $i => $re ) {
			if ( preg_match( "/^{$re}\$/", $s, $m ) ) {
				return array( $i, isset( $m[1] ) ? (int) $m[1] : 0 );
			}
		}
		throw new InvalidArgumentException( "Invalid prerelease string \"$s\"" ); // @codeCoverageIgnore
	}

	/**
	 * Compare two version numbers.
	 *
	 * @param string $a First version.
	 * @param string $b Second version.
	 * @return int Less than, equal to, or greater than 0 depending on whether `$a` is less than, equal to, or greater than `$b`.
	 * @throws InvalidArgumentException If the version numbers are not in a recognized format.
	 */
	public function compareVersions( $a, $b ) {
		$aa = $this->parseVersion( $a );
		$bb = $this->parseVersion( $b );
		if ( $aa['major'] !== $bb['major'] ) {
			return $aa['major'] < $bb['major'] ? -1 : 1;

		}
		if ( $aa['point'] !== $bb['point'] ) {
			return $aa['point'] - $bb['point'];
		}

		list( $aindex, $acount ) = $this->parsePrerelease( $aa['prerelease'] );
		list( $bindex, $bcount ) = $this->parsePrerelease( $bb['prerelease'] );
		if ( $aindex !== $bindex ) {
			return $aindex - $bindex;
		}
		return $acount - $bcount;
	}

	/**
	 * Return a valid "first" version number.
	 *
	 * @param array $extra Extra components for the version, as for `nextVersion()`.
	 * @return string
	 */
	public function firstVersion( array $extra = array() ) {
		return $this->normalizeVersion(
			array(
				'major' => 0.0,
				'point' => 0,
			) + $this->validateExtra( $extra )
		);
	}

}
