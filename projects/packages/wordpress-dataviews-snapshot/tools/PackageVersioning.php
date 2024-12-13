<?php
/**
 * Changelogger versioning plugin for "package" versioning.
 *
 * @package automattic/jetpack-wordpress-dataviews-snapshot
 */

namespace Automattic\Jetpack\WordPressDataViews;

use Automattic\Jetpack\Changelog\ChangeEntry;
use Automattic\Jetpack\Changelogger\PluginTrait;
use Automattic\Jetpack\Changelogger\VersioningPlugin;
use InvalidArgumentException;
use UnexpectedValueException;

/**
 * Package versioning plugin.
 *
 * - The main part of the version uses the version of `@wordpress/dataviews` from package.json.
 * - Point releases add another number after a dot.
 * - Prerelease versions add a suffix: "-dev", "-alpha", "-beta", or "-rc",
 *   with an optional number after all except "-dev".
 * - Buildinfo adds any other `[a-zA-Z0-9.-]` after a '+' suffix.
 */
class PackageVersioning implements VersioningPlugin {
	use PluginTrait;

	/**
	 * JSON file to read source package version from.
	 *
	 * @var string
	 */
	protected static $file = __DIR__ . '/../package.json';

	/**
	 * Path within the JSON file to find the version number.
	 *
	 * @var string[]
	 */
	protected static $path = array( 'dependencies', '@wordpress/dataviews' );

	/**
	 * Parse a version.
	 *
	 * @param string $version Version.
	 * @return array With components:
	 *  - package: (string) Source package version.
	 *  - point: (int) Point version.
	 *  - version: (string) Version number, without any prerelease or buildinfo.
	 *  - prerelease: (string|null) Pre-release string.
	 *  - buildinfo: (string|null) Build metadata string.
	 * @throws InvalidArgumentException If the version number is not in a recognized format.
	 * @phan-return array{package:string,point:int,version:string,prerelease:?string,buildinfo:?string}
	 */
	public function parseVersion( $version ) {
		if ( ! preg_match( '/^(?P<package>\d+\.\d+\.\d+)\.(?P<point>\d+)(?:-(?P<prerelease>dev|(?:alpha|beta|rc)\d*|a\.\d+))?(?:\+(?P<buildinfo>[0-9a-zA-Z.-]+))?$/', $version, $m ) ) {
			throw new InvalidArgumentException( "Version number \"$version\" is not in a recognized format." );
		}
		return array(
			'package'    => $m['package'],
			'point'      => (int) $m['point'],
			'version'    => $m['package'] . '.' . $m['point'],
			'prerelease' => isset( $m['prerelease'] ) && '' !== $m['prerelease'] ? $m['prerelease'] : null,
			'buildinfo'  => isset( $m['buildinfo'] ) && '' !== $m['buildinfo'] ? $m['buildinfo'] : null,
		);
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
		return $this->normalizeVersionInternal( $this->parseVersion( $version ), $extra );
	}

	/**
	 * Check and normalize a version number.
	 *
	 * @param array{package:string,point:int,prerelease?:?string,buildinfo?:?string} $version Version info.
	 * @param array                                                                  $extra Extra components for the version, replacing any in `$version`.
	 * @return string Normalized version.
	 * @throws InvalidArgumentException If the version number is not in a recognized format or extra is invalid.
	 */
	private function normalizeVersionInternal( $version, $extra = array() ) {
		$info = $version + array(
			'prerelease' => null,
			'buildinfo'  => null,
		);
		$info = array_merge( $info, $this->validateExtra( $extra, false ) );
		'@phan-var array{package:string,point:int,prerelease:?string,buildinfo:?string} $info'; // The array_merge confuses Phan.

		$ret = $info['package'] . '.' . $info['point'];
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
	 * @return array{prerelease?:?string,buildinfo?:?string}
	 * @throws InvalidArgumentException If the `$extra` data is invalid.
	 */
	private function validateExtra( array $extra, $nulls = true ) {
		$info = array();

		if ( isset( $extra['prerelease'] ) ) {
			try {
				$info['prerelease'] = $this->parseVersion( '0.0.0.0-' . $extra['prerelease'] )['prerelease'];
			} catch ( InvalidArgumentException $ex ) {
				throw new InvalidArgumentException( 'Invalid prerelease data' );
			}
		} elseif ( $nulls || array_key_exists( 'prerelease', $extra ) ) {
			$info['prerelease'] = null;
		}
		if ( isset( $extra['buildinfo'] ) ) {
			try {
				$info['buildinfo'] = $this->parseVersion( '0.0.0.0+' . $extra['buildinfo'] )['buildinfo'];
			} catch ( InvalidArgumentException $ex ) {
				throw new InvalidArgumentException( 'Invalid buildinfo data' );
			}
		} elseif ( $nulls || array_key_exists( 'buildinfo', $extra ) ) {
			$info['buildinfo'] = null;
		}

		return $info;
	}

	/**
	 * Read the source package version number.
	 *
	 * @return string
	 * @throws UnexpectedValueException If the source package version number cannot be read.
	 */
	private function readSourceVersion() {
		error_clear_last();
		$file = static::$file;
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- We're handling errors manually just below.
		$data = @file_get_contents( $file );
		if ( ! $data ) {
			$err = error_get_last();
			throw new UnexpectedValueException( "Failed to read $file: " . ( $err['message'] ?? 'Unknown error' ) );
		}
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- We're handling errors manually just below.
		$json = @json_decode( $data, true );
		if ( ! is_array( $json ) ) {
			throw new UnexpectedValueException( "Failed to parse $file: " . ( json_last_error() === JSON_ERROR_NONE ? 'Not a JSON object or array' : json_last_error_msg() ) );
		}

		$value = $json;
		$path  = static::$path;
		$sofar = '';
		while ( $path ) {
			if ( ! is_array( $value ) ) {
				throw new UnexpectedValueException( "Failed to parse $file: $sofar is not an object or array" );
			}

			$k      = array_shift( $path );
			$sofar .= ".$k";
			if ( ! isset( $value[ $k ] ) ) {
				throw new UnexpectedValueException( "Failed to parse $file: $sofar is not set" );
			}
			$value = $value[ $k ];
		}
		if ( is_string( $value ) && preg_match( '/^\d+\.\d+\.\d+$/', $value ) ) {
			return $value;
		}
		throw new UnexpectedValueException( "Failed to parse $file: $sofar is not a version string" );
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
		'@phan-var array{package:string,point:int,prerelease:?string,buildinfo:?string} $info'; // The array_merge confuses Phan.

		$ver = $this->readSourceVersion();
		if ( version_compare( $info['package'], $ver, '<' ) ) {
			$info['package'] = $ver;
			$info['point']   = 0;
		} elseif ( version_compare( $info['package'], $ver, '=' ) ) {
			$info['package'] = $ver;
			++$info['point'];
		} else {
			throw new InvalidArgumentException( "Input version {$info['package']}.x > package version $ver" );
		}

		return $this->normalizeVersionInternal( $info );
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

		$ret = version_compare( $aa['package'], $bb['package'] );
		if ( ! $ret ) {
			$ret = $aa['point'] <=> $bb['point'];
		}
		if ( $ret ) {
			return $ret;
		}

		$avalues = $this->parsePrerelease( $aa['prerelease'] );
		$bvalues = $this->parsePrerelease( $bb['prerelease'] );

		$l = min( count( $avalues ), count( $bvalues ) );
		for ( $i = 0; $i < $l; $i++ ) {
			if ( $avalues[ $i ] !== $bvalues[ $i ] ) {
				return $avalues[ $i ] <=> $bvalues[ $i ];
			}
		}

		return count( $avalues ) <=> count( $bvalues );
	}

	/**
	 * Return a valid "first" version number.
	 *
	 * @param array $extra Extra components for the version, as for `nextVersion()`.
	 * @return string
	 */
	public function firstVersion( array $extra = array() ) {
		return $this->normalizeVersionInternal(
			array(
				'package' => $this->readSourceVersion(),
				'point'   => 0,
			) + $this->validateExtra( $extra )
		);
	}
}
