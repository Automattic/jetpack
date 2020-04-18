<?php
/**
 * Jetpack's JITM Cache class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack\JITMS;

/**
 * Class JITM\Cache
 *
 * This is a simple cache overlay, per request. It's meant to save on multiple rules requesting the same data and
 * allow for easier injecting in tests
 */
class Cache {
	/**
	 * Jetpack's JITM Cache class
	 *
	 * @var array The in-memory cache
	 */
	protected $cache = array();

	/**
	 * $mobile_browser
	 *
	 * @var bool Indicates if JITMs will be displayed in a mobile browser
	 */
	protected $mobile_browser;

	/**
	 * Convert an object/array to a string
	 *
	 * @param mixed $key The key.
	 *
	 * @return string The stringified key
	 */
	protected function maybe_stringify_key( $key ) {
		if ( is_array( $key ) || is_object( $key ) ) {
			$key = wp_json_encode( $key );
		}

		return $key;
	}

	/**
	 * Get's an object from the cache
	 *
	 * @param string $partition The cache partition.
	 * @param mixed  $key The key in the partition.
	 *
	 * @return mixed The item in the cache
	 */
	public function get( $partition, $key ) {
		$key = $this->maybe_stringify_key( $key );

		if ( isset( $this->cache[ $partition ] ) && isset( $this->cache[ $partition ][ $key ] ) ) {
			return $this->cache[ $partition ][ $key ];
		}

		return null;
	}

	/**
	 * Sets a value in the cache and returns it
	 *
	 * @param string $partition The cache partition.
	 * @param mixed  $key The cache key.
	 * @param mixed  $value The value to set.
	 *
	 * @return mixed The original value passed in
	 */
	public function set( $partition, $key, $value ) {
		$key = $this->maybe_stringify_key( $key );

		if ( ! isset( $this->cache[ $partition ] ) ) {
			$this->cache[ $partition ] = array();
		}

		$this->cache[ $partition ][ $key ] = &$value;

		return $this->cache[ $partition ][ $key ];
	}

	/**
	 * Attempts to get from the cache, if it returns falsy, then call the callback and store it's result in the cache
	 *
	 * @param string   $partition The cache partition.
	 * @param mixed    $key The cache key.
	 * @param callable $callback The callback to call if the item is not in the cache.
	 *
	 * @return mixed The result from the cache or callback
	 */
	public function get_or_set( $partition, $key, callable $callback ) {
		$cached = $this->get( $partition, $key );

		if ( null === $cached ) {
			return $this->set( $partition, $key, $callback() );
		}

		return $cached;
	}

	/**
	 * Clears the cache of all data, useful for testing
	 */
	public function clear() {
		$this->cache = array();
	}

	/**
	 * Get the site's dismissals
	 *
	 * @return array The array of dismissed jitms
	 */
	public function get_dismissals() {
		return $this->get_or_set(
			'dismissals',
			'dismissals',
			static function () {
				return \Jetpack_Options::get_option( 'hide_jitm' ) ? \Jetpack_Options::get_option( 'hide_jitm' ) : array();
			}
		);
	}

	/**
	 * Get's the site's installed plugins
	 *
	 * @return array An array of installed plugins
	 */
	public function get_installed_plugins() {
		return $this->get_or_set(
			'plugins-callable',
			'installed_plugins',
			static function () {
				if ( ! function_exists( 'get_plugins' ) ) {
					require_once ABSPATH . 'wp-admin/includes/plugin.php';
				}
				/** This filter is documented in wp-admin/includes/class-wp-plugins-list-table.php */
				$all_plugins = apply_filters( 'all_plugins', get_plugins() );

				return $all_plugins;
			}
		);
	}

	/**
	 * Get's the site's active plugins
	 *
	 * @return array An array of active plugins
	 */
	public function get_active_plugins() {
		return $this->get_or_set(
			'plugins-callable',
			'active_plugins',
			static function () {
				include_once ABSPATH . 'wp-admin/includes/plugin.php';
				$active_plugins = \Jetpack::get_active_plugins();
				if ( ! is_array( $active_plugins ) ) { // can be an empty string.
					$active_plugins = array();
				}

				return $active_plugins;
			}
		);
	}

	/**
	 * Get the list of available modules on the site.
	 *
	 * @return array $modules Array of available modules.
	 */
	public function get_available_modules() {
		return $this->get_or_set(
			'available-modules',
			'available_modules',
			static function () {
				$modules           = array();
				$available_modules = \Jetpack_Options::get_option( 'available_modules' );

				foreach ( $available_modules as $module_list ) {
					foreach ( $module_list as $module ) {
						$modules[] = $module;
					}
				}

				// Clean duplicates.
				return (array) array_unique( $modules );
			}
		);
	}

	/**
	 * Get the user's country
	 *
	 * The returned country code would be one of the supported countries listed in
	 * https://opengrok.a8c.com/source/xref/trunk/wp-content/lib/communication/phone-utils.php
	 *
	 * @param int $user_id The user ID.
	 *
	 * @return string
	 */
	public function get_user_country( $user_id ) {
		return $this->get_or_set(
			'user_country',
			$user_id,
			static function () use ( $user_id ) {
				$country = get_user_attribute( $user_id, 'geo_country_signup' ) !== null ?
					get_user_attribute( $user_id, 'geo_country_signup' ) :
					get_user_attribute( $user_id, 'twostep-phone-country' );
				return isset( $country ) ? $country : '';
			}
		);
	}

	/**
	 * Get the list of widgets
	 *
	 * @return array
	 */
	public function get_widget_list() {
		return $this->get_or_set(
			'active_widgets',
			'list',
			static function () {
				$list           = array();
				$active_widgets = get_option( 'sidebars_widgets' );
				foreach ( $active_widgets as $widgets ) {
					if ( is_iterable( $widgets ) ) {
						foreach ( $widgets as $widget ) {
							$list[] = implode( '-', array_slice( explode( '-', $widget ), 0, - 1 ) );
						}
					} else {
						$list[] = implode( '-', array_slice( explode( '-', $widgets ), 0, - 1 ) );
					}
				}

				return $list;
			}
		);
	}

	/**
	 * Will JITMs be displayed in a mobile browser?
	 *
	 * @return bool Whether a mobile browser is used
	 */
	public function is_mobile_browser() {
		return $this->mobile_browser;
	}

	/**
	 * Will JITMs be displayed in a mobile browser?
	 *
	 * @param bool $is_mobile Whether a mobile browser is used.
	 */
	public function set_mobile_browser( $is_mobile ) {
		$this->mobile_browser = $is_mobile;
	}

	/**
	 * Does this user have the WordPress mobile app?
	 *
	 * @param int $id The external user id.
	 *
	 * @return bool Whether the user has the mobile app
	 */
	public function has_mobile_app( $id ) {
		return $this->get_or_set(
			'mobile_app',
			$id,
			function () use ( $id ) {
				$user = $id;
				if ( 0 === $user ) {
					return false;
				}
				$mobile_last_seen = get_user_attribute( $user, 'mobile_app_last_seen' );
				return ! empty( $mobile_last_seen );
			}
		);
	}

	/**
	 * Get the slug of current site
	 *
	 * @return string The site slug
	 */
	public function get_site_slug() {
		return $this->get_or_set(
			'site',
			'site_slug',
			static function () {
				return \Jetpack::build_raw_urls( home_url() );
			}
		);
	}

	/**
	 * Get the site options from get_options( 'options' )
	 *
	 * @return array Site options
	 */
	public function get_site_options() {
		return $this->get_or_set(
			'site',
			'options',
			static function () {
				$options = get_option( 'options', array() );
				return is_array( $options ) ? $options : array();
			}
		);
	}

}
