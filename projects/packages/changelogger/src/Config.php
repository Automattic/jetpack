<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Configuration loader for the changelogger tool.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.NamingConventions.ValidFunctionName, WordPress.NamingConventions.ValidVariableName, WordPress.WP.AlternativeFunctions

namespace Automattic\Jetpack\Changelogger;

use Symfony\Component\Console\Output\OutputInterface;

/**
 * Configuration loader for the changelogger tool.
 */
class Config {

	/**
	 * Default config settings.
	 *
	 * @var array
	 */
	private static $defaultConfig = array(
		'versioning' => 'semver',
		'types'      => array(
			'security'   => 'Security',
			'added'      => 'Added',
			'changed'    => 'Changed',
			'deprecated' => 'Deprecated',
			'removed'    => 'Removed',
			'fixed'      => 'Fixed',
		),
	);

	/**
	 * Active config settings.
	 *
	 * @var array
	 */
	private static $config = array();

	/**
	 * Cached config settings.
	 *
	 * @var array
	 */
	private static $cache = array();

	/**
	 * Whether `load()` was called already.
	 *
	 * @var bool
	 */
	private static $loaded = false;

	/**
	 * OutputInterface.
	 *
	 * @var OutputInterface|null
	 */
	private static $out;

	/**
	 * Set the OutputInterface.
	 *
	 * @param OutputInterface $out OutputInterface.
	 */
	public static function setOutput( OutputInterface $out ) {
		self::$out = $out;
	}

	/**
	 * Load the configuration.
	 *
	 * @throws \LogicException If called before `setOutput()`.
	 */
	private static function load() {
		if ( ! self::$out ) {
			throw new \LogicException( 'Must call Config::setOutput() before Config::load()' );
		}
		if ( self::$loaded ) {
			return;
		}
		self::$loaded = true;

		self::$config         = self::$defaultConfig;
		self::$config['base'] = getcwd();

		$composer = getenv( 'COMPOSER' );
		if ( $composer ) {
			$from = ' (as specified by the COMPOSER environment variable)'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		} else {
			$composer = 'composer.json';
			$from     = ''; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		}
		if ( ! file_exists( $composer ) ) {
			self::$out->writeln( "<error>File {$composer}{$from} is not found.</>" );
			return;
		}
		$data = json_decode( file_get_contents( $composer ), true );
		if ( ! is_array( $data ) ) {
			self::$out->writeln( "<error>File {$composer}{$from} could not be parsed.</>" );
			return;
		}

		self::$config['base'] = dirname( realpath( $composer ) );
		if ( isset( $data['extra']['changelogger'] ) ) {
			self::$config = array_merge( self::$config, $data['extra']['changelogger'] );
		}
	}

	/**
	 * Get the base directory.
	 *
	 * @return string
	 */
	public static function base() {
		self::load();
		return self::$config['base'];
	}

	/**
	 * Get verisoning method.
	 *
	 * @return Versioning
	 */
	public static function versioning() {
		self::load();
		if ( ! isset( self::$cache['versioning'] ) ) {
			$class = __NAMESPACE . '\\Versioning\\' . ucfirst( self::$config['versioning'] );
			if ( ! class_exists( $class ) ) {
				self::$out->writeln( '<warning>Unknown versioning method "' . self::$config['versioning'] . '". Using "semver".</>' );
				$class = __NAMESPACE . '\\Versioning\\Semver';
			}
			self::$cache['versioning'] = new $class( self::$out );
		}
		return self::$cache['versioning'];
	}

	/**
	 * Get change types.
	 *
	 * @return array
	 */
	public static function types() {
		self::load();
		if ( ! isset( self::$cache['types'] ) ) {
			self::$cache['types'] = array();
			foreach ( self::$config['types'] as $k => $v ) {
				self::$cache['types'][ strtolower( $k ) ] = $v;
			}
		}
		return self::$cache['types'];
	}

}
