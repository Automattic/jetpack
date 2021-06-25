<?php
/**
 * The Plugin class handles all the stuff that varies between different plugins.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

use InvalidArgumentException;

/**
 * The Plugin class handles all the stuff that varies between different plugins.
 */
class Plugin {

	/**
	 * Class instances.
	 *
	 * @var Plugin[]
	 */
	protected static $instances = null;

	/**
	 * WordPress plugin slug.
	 *
	 * @var string
	 */
	protected $slug;

	/**
	 * GitHub source repo slug.
	 *
	 * @var string
	 */
	protected $repo;

	/**
	 * GitHub mirror repo slug.
	 *
	 * @var string
	 */
	protected $mirror;

	/**
	 * Manifest URL.
	 *
	 * @var string
	 */
	protected $manifest_url;

	/**
	 * Manifest data.
	 *
	 * @var array|null
	 */
	protected $manifest_data = null;

	/**
	 * Get instances for all known plugins.
	 *
	 * @param bool $no_cache Set true to bypass the transients cache.
	 * @return Plugin[]|false
	 */
	public static function get_all_plugins( $no_cache = false ) {
		if ( null === self::$instances ) {
			$data = Utils::get_remote_data( JETPACK_BETA_PLUGINS_URL, 'plugins_json', $no_cache );
			if ( ! is_array( $data ) ) {
				return false;
			}

			$plugins = array();
			foreach ( $data as $slug => $info ) {
				try {
					$plugins[ $slug ] = new self( $slug, $info );
				} catch ( InvalidArgumentException $ex ) {
					// Log?
					return false;
				}
			}
			self::$instances = $plugins;
		}

		return self::$instances;
	}

	/**
	 * Get an instance by slug.
	 *
	 * @param string $slug WordPress plugin slug.
	 * @param bool   $no_cache Set true to bypass the transients cache.
	 * @return Plugin|false
	 */
	public static function get_plugin( $slug, $no_cache = false ) {
		$plugins = self::get_all_plugins( $no_cache );
		if ( is_array( $plugins ) && isset( $plugins[ $slug ] ) ) {
			return $plugins[ $slug ];
		}
		return false;
	}

	/**
	 * Constructor.
	 *
	 * @param string $slug WordPress plugin slug.
	 * @param array  $config Configuration data.
	 * @throws InvalidArgumentException If config is invalid.
	 */
	public function __construct( $slug, array $config ) {
		$this->slug = $slug;
		foreach ( array(
			'repo'         => array( $this, 'is_repo' ),
			'mirror'       => array( $this, 'is_repo' ),
			'manifest_url' => array( $this, 'is_valid_url' ),
		) as $k => $validator ) {
			if ( ! isset( $config[ $k ] ) ) {
				throw new InvalidArgumentException( "Missing configuration field $k" );
			}
			if ( ! $validator( $config[ $k ] ) ) {
				throw new InvalidArgumentException( "Configuration field $k is not valid" );
			}
			$this->{$k} = $config[ $k ];
		}
	}

	/**
	 * Validate as a GitHub repo slug.
	 *
	 * @param string $v Value.
	 * @return bool
	 */
	protected function is_repo( $v ) {
		return (bool) preg_match( '!^[a-zA-Z0-9][a-zA-Z0-9-]*/[a-zA-Z0-9.-]+$!', $v );
	}

	/**
	 * Validate as a valid URL.
	 *
	 * @param string $v Value.
	 * @return bool
	 */
	protected function is_valid_url( &$v ) {
		static $flags = null;

		if ( null === $flags ) {
			$flags = FILTER_FLAG_PATH_REQUIRED;
			if ( defined( 'FILTER_FLAG_SCHEME_REQUIRED' ) ) {
				// phpcs:ignore PHPCompatibility.Constants.RemovedConstants
				$flags |= FILTER_FLAG_SCHEME_REQUIRED | FILTER_FLAG_HOST_REQUIRED;
			}
		}

		$v = filter_var( $v, FILTER_VALIDATE_URL, $flags );
		return $v && substr( $v, 0, 8 ) === 'https://';
	}

	/**
	 * Get the manifest data (i.e. branches) for the plugin.
	 *
	 * @param bool $no_cache Set true to bypass the transients cache.
	 * @return array|false
	 */
	public function get_manifest( $no_cache = false ) {
		if ( null === $this->manifest_data ) {
			$this->manifest_data = Utils::get_remote_data( $this->manifest_url, "manifest_$this->slug", $no_cache );
		}
		return $this->manifest_data;
	}

}
