<?php
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
	 *  - version: (string) Major combined with point.
	 *  - prerelease: (string|null) Pre-release string.
	 *  - buildinfo: (string|null) Build metadata string.
	 * @throws InvalidArgumentException If the version number is not in a recognized format.
	 */
	public function parseVersion( $version ) {
		if ( ! preg_match( '/^(?P<major>\d+\.\d)(?:\.(?P<point>\d+))?(?:-(?P<prerelease>dev|(?:alpha|beta|rc)\d*|a\.\d+))?(?:\+(?P<buildinfo>[0-9a-zA-Z.-]+))?$/', $version, $m ) ) {
			throw new InvalidArgumentException( "Version number \"$version\" is not in a recognized format." );
		}
		$ret            = array(
			'major'      => (float) $m['major'],
			'point'      => (int) ( isset( $m['point'] ) ? $m['point'] : null ),
			'prerelease' => isset( $m['prerelease'] ) && '' !== $m['prerelease'] ? $m['prerelease'] : null,
			'buildinfo'  => isset( $m['buildinfo'] ) && '' !== $m['buildinfo'] ? $m['buildinfo'] : null,
		);
		$ret['version'] = sprintf( '%.1f', (float) $m['major'] );
		if ( 0 !== $ret['point'] ) {
			$ret['version'] .= '.' . $ret['point'];
		}
		return $ret;
	}

	/**
	 * Check and normalize a version number.
	 *
	 * @param string $version Version string.
	 * @param array  $extra Extra components for the version, replacing any in `$version`.
	 * @return string Normalized version.
	 * @throws InvalidArgumentException If the version number is not in a recognized format or extra is invalid.
	 */
	public function normalizeVersion( $version, $extra = array() ) {
		// The ability to pass an array is an internal-only feature.
		if ( is_array( $version ) ) {
			$info = $version + array(
				'prerelease' => null,
				'buildinfo'  => null,
			);
			$test = $this->parseVersion( '0.0' );
			unset( $test['version'] );
			if ( array_intersect_key( $test, $info ) !== $test ) {
				throw new InvalidArgumentException( 'Version array is not in a recognized format.' );
			}
		} else {
			$info = $this->parseVersion( $version );
		}
		$info = array_merge( $info, $this->validateExtra( $extra, false ) );

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
	 * @param bool  $nulls Return nulls for unset fields.
	 * @return array
	 * @throws InvalidArgumentException If the `$extra` data is invalid.
	 */
	private function validateExtra( array $extra, $nulls = true ) {
		$info = array();

		if ( isset( $extra['prerelease'] ) ) {
			try {
				$info['prerelease'] = $this->parseVersion( '0.0-' . $extra['prerelease'] )['prerelease'];
			} catch ( InvalidArgumentException $ex ) {
				throw new InvalidArgumentException( 'Invalid prerelease data' );
			}
		} elseif ( $nulls || array_key_exists( 'prerelease', $extra ) ) {
			$info['prerelease'] = null;
		}
		if ( isset( $extra['buildinfo'] ) ) {
			try {
				$info['buildinfo'] = $this->parseVersion( '0.0+' . $extra['buildinfo'] )['buildinfo'];
			} catch ( InvalidArgumentException $ex ) {
				throw new InvalidArgumentException( 'Invalid buildinfo data' );
			}
		} elseif ( $nulls || array_key_exists( 'buildinfo', $extra ) ) {
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
	 * Extract the index and values from a prerelease string.
	 *
	 * @param string|null $s String.
	 * @return array First element being the index value of the pattern matched, subsequent elements being int values of the matched capture groups.
	 * @throws InvalidArgumentException If the string is invalid.
	 */
	private function parsePrerelease( $s ) {
		if ( null === $s ) {
			return array( 100, 0 );
		}

		foreach ( array( 'dev', 'alpha(\d*)', 'a\.(\d+)', 'beta(\d*)', 'rc(\d*)' ) as $i => $re ) {
			if ( preg_match( "/^{$re}\$/", $s, $m ) ) {
				$m[0] = $i;
				return array_map( 'intval', $m );
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

		$avalues = $this->parsePrerelease( $aa['prerelease'] );
		$bvalues = $this->parsePrerelease( $bb['prerelease'] );

		$l = min( count( $avalues ), count( $bvalues ) );
		for ( $i = 0; $i < $l; $i++ ) {
			if ( $avalues[ $i ] !== $bvalues[ $i ] ) {
				return $avalues[ $i ] - $bvalues[ $i ];
			}
		}

		return count( $avalues ) - count( $bvalues );
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
