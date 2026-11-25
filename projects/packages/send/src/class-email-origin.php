<?php
/**
 * Works out what sent an email: a plugin, a theme or WordPress itself.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Origin keys for the log: `plugin:{folder}`, `theme:{slug}`, `core:{kind}` or `core`.
 */
class Email_Origin {

	/**
	 * The core function whose call to wp_mail() names the email, by origin key.
	 *
	 * @var array<string, string>
	 */
	const CORE_CALLERS = array(
		'retrieve_password'                       => 'core:password_reset',
		'wp_new_user_notification'                => 'core:new_user',
		'wp_notify_postauthor'                    => 'core:comment',
		'wp_notify_moderator'                     => 'core:comment',
		'update_option_new_admin_email'           => 'core:admin',
		'wp_site_admin_email_change_notification' => 'core:admin',
		'send_confirmation_on_profile_email'      => 'core:admin',
		'wp_password_change_notification'         => 'core:admin',
	);

	/**
	 * Hosts whose icon URLs are passed on: the ones WordPress.org's plugin directory serves icons from.
	 *
	 * @var string[]
	 */
	const ICON_HOSTS = array( 'ps.w.org', 's.w.org' );

	/**
	 * Labels already worked out in this request, by key.
	 *
	 * @var array<string, string>
	 */
	private static $labels = array();

	/**
	 * Icon URLs already worked out in this request, by key.
	 *
	 * @var array<string, string|null>
	 */
	private static $icons = array();

	/**
	 * The origin of the wp_mail() call in a backtrace.
	 *
	 * @param array      $frames Frames from debug_backtrace(), innermost first.
	 * @param array|null $dirs   `plugins` (string[]), `themes` (string) and `self` (string) directories; defaults to this site's.
	 * @return string The origin key.
	 */
	public static function detect( array $frames, $dirs = null ) {
		$dirs  = is_array( $dirs ) ? $dirs : self::site_dirs();
		$start = null;
		foreach ( $frames as $index => $frame ) {
			if ( 'wp_mail' === ( $frame['function'] ?? '' ) && empty( $frame['class'] ) ) {
				$start = $index;
				break;
			}
		}
		if ( null === $start ) {
			return 'core';
		}

		// Each frame's `file` is where its function was called from, so the wp_mail frame's file is the caller.
		$callers = array_slice( $frames, $start );
		foreach ( $callers as $frame ) {
			$file = isset( $frame['file'] ) ? self::normalize( (string) $frame['file'] ) : '';
			if ( '' === $file || ( '' !== $dirs['self'] && 0 === strpos( $file, self::normalize( $dirs['self'] ) . '/' ) ) ) {
				continue;
			}
			foreach ( (array) $dirs['plugins'] as $plugin_dir ) {
				$folder = self::first_segment( $file, (string) $plugin_dir );
				if ( '' !== $folder && 'jetpack-send' !== $folder ) {
					return 'plugin:' . self::slug( $folder );
				}
			}
			$theme = self::first_segment( $file, (string) $dirs['themes'] );
			if ( '' !== $theme ) {
				return 'theme:' . self::slug( $theme );
			}
		}
		foreach ( $callers as $frame ) {
			$function = (string) ( $frame['function'] ?? '' );
			if ( empty( $frame['class'] ) && isset( self::CORE_CALLERS[ $function ] ) ) {
				return self::CORE_CALLERS[ $function ];
			}
		}
		return 'core';
	}

	/**
	 * A plain name for an origin key.
	 *
	 * @param string $key Origin key.
	 * @return string
	 */
	public static function label( $key ) {
		$key = (string) $key;
		if ( ! isset( self::$labels[ $key ] ) ) {
			self::$labels[ $key ] = self::find_label( $key );
		}
		return self::$labels[ $key ];
	}

	/**
	 * Work out a label.
	 *
	 * @param string $key Origin key.
	 * @return string
	 */
	private static function find_label( $key ) {
		$core = array(
			'core:password_reset' => __( 'Password resets', 'jetpack-send-pkg' ),
			'core:new_user'       => __( 'New accounts', 'jetpack-send-pkg' ),
			'core:comment'        => __( 'Comment notices', 'jetpack-send-pkg' ),
			'core:admin'          => __( 'Site notices', 'jetpack-send-pkg' ),
			'core'                => __( 'WordPress', 'jetpack-send-pkg' ),
		);
		if ( isset( $core[ $key ] ) ) {
			return $core[ $key ];
		}

		if ( 0 === strpos( $key, 'plugin:' ) ) {
			$folder = substr( $key, 7 );
			$file   = self::plugin_file( $folder );
			$data   = '' === $file ? array() : self::installed_plugins()[ $file ];
			return empty( $data['Name'] ) ? $folder : (string) $data['Name'];
		}

		if ( 0 === strpos( $key, 'theme:' ) ) {
			$slug  = substr( $key, 6 );
			$theme = wp_get_theme( $slug );
			return $theme->exists() ? (string) $theme->get( 'Name' ) : $slug;
		}

		return $key;
	}

	/**
	 * The plugin's icon from the WordPress.org directory, as WordPress's own update check stored it.
	 * Nothing is fetched: plugins that aren't in the directory, themes and WordPress itself get null.
	 *
	 * @param string $key Origin key.
	 * @return string|null An https URL on a WordPress.org icon host, or null.
	 */
	public static function icon_url( $key ) {
		$key = (string) $key;
		if ( ! array_key_exists( $key, self::$icons ) ) {
			self::$icons[ $key ] = self::find_icon_url( $key );
		}
		return self::$icons[ $key ];
	}

	/**
	 * Forget this request's labels and icons, e.g. once the list of plugins changed.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function forget() {
		self::$labels = array();
		self::$icons  = array();
	}

	/**
	 * Work out an icon URL.
	 *
	 * @param string $key Origin key.
	 * @return string|null
	 */
	private static function find_icon_url( $key ) {
		if ( 0 !== strpos( $key, 'plugin:' ) ) {
			return null;
		}
		$file = self::plugin_file( substr( $key, 7 ) );
		if ( '' === $file ) {
			return null;
		}

		$updates = get_site_transient( 'update_plugins' );
		if ( ! is_object( $updates ) ) {
			return null;
		}
		foreach ( array( 'response', 'no_update' ) as $list ) {
			$entries = isset( $updates->{$list} ) ? (array) $updates->{$list} : array();
			$entry   = isset( $entries[ $file ] ) ? (array) $entries[ $file ] : array();
			$icons   = isset( $entry['icons'] ) ? (array) $entry['icons'] : array();
			// The order WordPress's Updates screen prefers.
			foreach ( array( 'svg', '2x', '1x', 'default' ) as $size ) {
				$url = isset( $icons[ $size ] ) && is_string( $icons[ $size ] ) ? $icons[ $size ] : '';
				if ( self::is_icon_url( $url ) ) {
					return esc_url_raw( $url );
				}
			}
		}
		return null;
	}

	/**
	 * Whether a URL is an https address on a WordPress.org icon host.
	 *
	 * @param string $url URL.
	 * @return bool
	 */
	private static function is_icon_url( $url ) {
		if ( '' === $url ) {
			return false;
		}
		$parts = wp_parse_url( $url );
		return is_array( $parts )
			&& 'https' === strtolower( $parts['scheme'] ?? '' )
			&& in_array( strtolower( $parts['host'] ?? '' ), self::ICON_HOSTS, true );
	}

	/**
	 * The installed plugin file for an origin's folder, like `woocommerce/woocommerce.php`; '' when none.
	 *
	 * @param string $folder Plugin folder, or a single-file plugin's name without `.php`.
	 * @return string
	 */
	private static function plugin_file( $folder ) {
		$folder = (string) $folder;
		if ( '' === $folder ) {
			return '';
		}
		foreach ( self::installed_plugins() as $file => $data ) {
			if ( 0 === strpos( (string) $file, $folder . '/' ) || $folder . '.php' === $file ) {
				return (string) $file;
			}
		}
		return '';
	}

	/**
	 * Installed plugins by file, from WordPress's own cached list.
	 *
	 * @return array<string, array>
	 */
	private static function installed_plugins() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		return (array) get_plugins();
	}

	/**
	 * This site's plugin, theme and Send directories.
	 *
	 * @return array{plugins: string[], themes: string, self: string}
	 */
	private static function site_dirs() {
		return array(
			'plugins' => array_filter( array( defined( 'WP_PLUGIN_DIR' ) ? WP_PLUGIN_DIR : '', defined( 'WPMU_PLUGIN_DIR' ) ? WPMU_PLUGIN_DIR : '' ) ),
			'themes'  => (string) get_theme_root(),
			'self'    => dirname( __DIR__ ),
		);
	}

	/**
	 * The first path segment of a file under a directory, without `.php`; '' when it isn't under it.
	 *
	 * @param string $file File path, normalized.
	 * @param string $dir  Directory.
	 * @return string
	 */
	private static function first_segment( $file, $dir ) {
		if ( '' === $dir ) {
			return '';
		}
		$dir = rtrim( self::normalize( $dir ), '/' ) . '/';
		if ( 0 !== strpos( $file, $dir ) ) {
			return '';
		}
		$segment = explode( '/', substr( $file, strlen( $dir ) ) )[0];
		return (string) preg_replace( '/\.php$/', '', $segment );
	}

	/**
	 * Keep a folder name safe and within the column.
	 *
	 * @param string $folder Folder or file name.
	 * @return string
	 */
	private static function slug( $folder ) {
		return substr( (string) preg_replace( '/[^A-Za-z0-9._-]/', '', $folder ), 0, 90 );
	}

	/**
	 * Forward slashes, so Windows paths compare too.
	 *
	 * @param string $path Path.
	 * @return string
	 */
	private static function normalize( $path ) {
		return str_replace( '\\', '/', $path );
	}
}
