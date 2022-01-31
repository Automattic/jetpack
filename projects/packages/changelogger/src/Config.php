<?php
/**
 * Configuration loader for the changelogger tool.
 *
 * @package automattic/jetpack-changelogger
 */

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
		'changelog'     => 'CHANGELOG.md',
		'changes-dir'   => 'changelog',
		'link-template' => null,
		'ordering'      => array( 'subheading', 'content' ),
		'formatter'     => 'keepachangelog',
		'types'         => array(
			'security'   => 'Security',
			'added'      => 'Added',
			'changed'    => 'Changed',
			'deprecated' => 'Deprecated',
			'removed'    => 'Removed',
			'fixed'      => 'Fixed',
		),
		'versioning'    => 'semver',
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
	 * Location of composer.json, overriding any COMPOSER environment variable.
	 *
	 * @var string|null
	 */
	private static $composerJsonPath;

	/**
	 * Set the location of composer.json, overriding auto-detection.
	 *
	 * @since 1.2.0
	 * @param string|null $path Path to composer.json, or null to re-enable auto-detection.
	 */
	public static function setComposerJsonPath( $path ) {
		self::$composerJsonPath = $path;
	}

	/**
	 * Former method used to set an OutputInterface. No longer used.
	 *
	 * @deprecated since 1.2.0, no longer needed.
	 * @param OutputInterface $out Ignored.
	 */
	public static function setOutput( OutputInterface $out ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	}

	/**
	 * Load the configuration.
	 *
	 * @throws \DomainException If the path to composer.json exists but can't be `realpath`-ed.
	 * @throws ConfigException If composer.json is not found or is invalid (since 1.2.0).
	 */
	private static function load() {
		if ( self::$loaded ) {
			return;
		}
		self::$loaded = true;

		self::$config         = self::$defaultConfig;
		self::$config['base'] = getcwd();

		$from = '';
		if ( null !== self::$composerJsonPath ) {
			$composer = self::$composerJsonPath;
		} else {
			$composer = getenv( 'COMPOSER' );
			if ( $composer ) {
				$from = ' (as specified by the COMPOSER environment variable)';
			} else {
				$composer = getcwd() . DIRECTORY_SEPARATOR . 'composer.json';
			}
		}
		if ( ! file_exists( $composer ) ) {
			throw new ConfigException( "File {$composer}{$from} is not found." );
		}
		$data = json_decode( file_get_contents( $composer ), true );
		if ( ! is_array( $data ) ) {
			throw new ConfigException( "File {$composer}{$from} could not be parsed." );
		}

		$dir = realpath( $composer );
		if ( false === $dir ) {
			throw new \DomainException( "Path $composer is not valid" ); // @codeCoverageIgnore
		}
		self::$config['base'] = dirname( $dir );
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
	 * Add the base directory to a path, if necessary.
	 *
	 * @param string $path Path.
	 * @return string
	 */
	private static function addBase( $path ) {
		// Stupid Windows requires a regex.
		if ( ! preg_match( '#^(?:/|' . preg_quote( DIRECTORY_SEPARATOR, '#' ) . '|[a-zA-Z]:\\\\)#', $path ) ) {
			$path = self::base() . DIRECTORY_SEPARATOR . $path;
		}
		return $path;
	}

	/**
	 * Get the changelog filename.
	 *
	 * @return string
	 */
	public static function changelogFile() {
		self::load();
		if ( ! isset( self::$cache['changelog'] ) ) {
			self::$cache['changelog'] = self::addBase( self::$config['changelog'] );
		}
		return self::$cache['changelog'];
	}

	/**
	 * Get the changes directory.
	 *
	 * @return string
	 */
	public static function changesDir() {
		self::load();
		if ( ! isset( self::$cache['changes-dir'] ) ) {
			self::$cache['changes-dir'] = self::addBase( self::$config['changes-dir'] );
		}
		return self::$cache['changes-dir'];
	}

	/**
	 * Get the link.
	 *
	 * @param string $old Old version number.
	 * @param string $new New version number.
	 * @return string|null
	 */
	public static function link( $old, $new ) {
		self::load();
		if ( null !== self::$config['link-template'] ) {
			return strtr(
				self::$config['link-template'],
				array(
					'${old}' => rawurlencode( $old ),
					'${new}' => rawurlencode( $new ),
				)
			);
		}
		return null;
	}

	/**
	 * Get change entry ordering.
	 *
	 * @return string[]
	 */
	public static function ordering() {
		self::load();
		if ( ! isset( self::$cache['ordering'] ) ) {
			self::$cache['ordering'] = array_map( 'strval', (array) self::$config['ordering'] );
		}
		return self::$cache['ordering'];
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

	/**
	 * Get a plugin.
	 *
	 * @param string|array $config Plugin name or configuration array.
	 * @param string       $suffix Plugin class suffix.
	 * @param string       $interface Expected interface name.
	 * @return object|null Object, or null if the plugin was not found.
	 */
	private static function getPlugin( $config, $suffix, $interface ) {
		if ( is_string( $config ) ) {
			$config = array( 'name' => $config );
		}

		if ( isset( $config['name'] ) ) {
			$class = __NAMESPACE__ . '\\Plugins\\' . ucfirst( $config['name'] ) . $suffix;
		} elseif ( isset( $config['class'] ) ) {
			$class = $config['class'];
		} elseif ( isset( $config['filename'] ) ) {
			$classes = get_declared_classes();
			require $config['filename'];
			$classes = array_filter(
				array_diff( get_declared_classes(), $classes ),
				function ( $class ) use ( $interface ) {
					return is_a( $class, $interface, true );
				}
			);
			if ( count( $classes ) !== 1 ) {
				return null;
			}
			$class = array_pop( $classes );
		} else {
			return null;
		}
		if ( ! class_exists( $class ) || ! is_a( $class, $interface, true ) ) {
			return null;
		}
		return $class::instantiate( $config );
	}

	/**
	 * Get formatting plugin.
	 *
	 * @return Formatter
	 * @throws \RuntimeException If the configured formatter is unknown.
	 */
	public static function formatterPlugin() {
		self::load();
		if ( ! isset( self::$cache['formatter'] ) ) {
			$obj = self::getPlugin( self::$config['formatter'], 'Formatter', FormatterPlugin::class );
			if ( ! $obj instanceof FormatterPlugin ) {
				$info = json_encode( self::$config['formatter'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
				throw new \RuntimeException( "Unknown formatter plugin $info" );
			}
			self::$cache['formatter'] = $obj;
		}
		return self::$cache['formatter'];
	}

	/**
	 * Get verisoning plugin.
	 *
	 * @return Versioning
	 * @throws \RuntimeException If the configured versioning plugin is unknown.
	 */
	public static function versioningPlugin() {
		self::load();
		if ( ! isset( self::$cache['versioning'] ) ) {
			$obj = self::getPlugin( self::$config['versioning'], 'Versioning', VersioningPlugin::class );
			if ( ! $obj instanceof VersioningPlugin ) {
				$info = json_encode( self::$config['versioning'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
				throw new \RuntimeException( "Unknown versioning plugin $info" );
			}
			self::$cache['versioning'] = $obj;
		}
		return self::$cache['versioning'];
	}

}
