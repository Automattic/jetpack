<?php
/**
 * Shapes threats for the `@automattic/jetpack-scan` threat list.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Converts Protect threat models into the camelCase shape the JS threat list reads.
 *
 * @since $$next-version$$
 */
class Dashboard_Threats {

	/**
	 * Shape one threat.
	 *
	 * @param object     $threat A Threat_Model, or a raw threat with the same properties.
	 * @param array|null $site   The site's plugins and updates, from get_site_extensions(); read now when null.
	 * @return array
	 */
	public static function format( $threat, $site = null ) {
		$site    ??= self::get_site_extensions();
		$extension = $threat->extension ?? null;
		// History names extension types in the singular; the threat list reads the plural.
		$type  = in_array( $extension->type ?? '', array( 'plugin', 'theme' ), true ) ? $extension->type . 's' : ( $extension->type ?? null );
		$slug  = $extension->slug ?? null;
		$file  = 'plugins' === $type && $slug ? ( $site['files'][ $slug ] ?? null ) : null;
		$theme = 'themes' === $type && $slug ? wp_get_theme( $slug ) : null;
		$theme = $theme && $theme->exists() ? $theme : null;

		return array(
			'id'              => $threat->id ?? null,
			'signature'       => $threat->signature ?? null,
			'title'           => $threat->title ?? null,
			'description'     => $threat->description ?? null,
			'status'          => $threat->status ?? null,
			'severity'        => $threat->severity ?? null,
			'firstDetected'   => $threat->first_detected ?? null,
			'fixedIn'         => $threat->fixed_in ?? null,
			'fixedOn'         => $threat->fixed_on ?? null,
			'fixable'         => empty( $threat->fixable ) ? false : $threat->fixable,
			'filename'        => $threat->filename ?? null,
			'source'          => $threat->source ?? null,
			'context'         => self::format_context( $threat->context ?? null ),
			'vulnerabilities' => self::format_vulnerabilities( $threat->vulnerabilities ?? null ),
			'extension'       => $extension ? array(
				'slug'    => $slug,
				// Scan reports may name a plugin by its slug; the installed copy has its real name.
				'name'    => ( $file ? $site['plugins'][ $file ]['Name'] : ( $theme ? $theme->get( 'Name' ) : null ) ) ?? $extension->name ?? null,
				'version' => $extension->version ?? null,
				'type'    => $type,
				'icon'    => 'plugins' === $type ? self::get_plugin_icon( $site, $slug ) : ( $theme && $theme->get_screenshot() ? $theme->get_screenshot() : null ),
				'state'   => self::get_state( $type, $file, $theme ),
				// A fixed threat no longer calls for deleting what it was in.
				'actions' => array_diff_key( self::get_actions( $site, $type, $slug, $file, $theme ), 'fixed' === ( $threat->status ?? null ) ? array( 'delete' => true ) : array() ),
			) : null,
		);
	}

	/**
	 * What threat shaping reads about installed plugins, read once per list.
	 *
	 * @return array Plugins and plugin updates by file, plugin files and WordPress.org entries by slug, and theme updates by slug.
	 */
	private static function get_site_extensions() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$plugins = get_plugins();
		$files   = self::get_plugin_files( $plugins );

		$plugin_updates = get_site_transient( 'update_plugins' );
		$theme_updates  = get_site_transient( 'update_themes' );
		$directory      = array();
		foreach ( array_merge( (array) ( $plugin_updates->no_update ?? array() ), (array) ( $plugin_updates->response ?? array() ) ) as $entry ) {
			$entry = (object) $entry;
			if ( ! empty( $entry->slug ) ) {
				$directory[ $entry->slug ] = $entry;
			}
		}

		return array(
			'plugins'        => $plugins,
			'files'          => $files,
			'plugin_updates' => (array) ( $plugin_updates->response ?? array() ),
			'directory'      => $directory,
			'theme_updates'  => (array) ( $theme_updates->response ?? array() ),
		);
	}

	/**
	 * The lines of code around a file threat, as line number and code pairs.
	 *
	 * @param mixed $context Scan's context: code keyed by line number, plus a `marks` entry.
	 * @return array
	 */
	private static function format_context( $context ) {
		if ( ! is_array( $context ) && ! is_object( $context ) ) {
			return array();
		}

		$lines = array();
		foreach ( (array) $context as $line => $code ) {
			if ( is_numeric( $line ) && is_string( $code ) ) {
				$lines[] = array(
					'line' => (int) $line,
					'code' => $code,
				);
			}
		}
		return $lines;
	}

	/**
	 * Shape the vulnerabilities behind a vulnerable-extension threat.
	 *
	 * @param mixed $vulnerabilities Vulnerability_Model objects, or raw objects with the same properties.
	 * @return array
	 */
	private static function format_vulnerabilities( $vulnerabilities ) {
		if ( ! is_array( $vulnerabilities ) ) {
			return array();
		}

		$formatted = array();
		foreach ( $vulnerabilities as $vulnerability ) {
			$formatted[] = array(
				'id'     => $vulnerability->id ?? null,
				'title'  => $vulnerability->title ?? null,
				'source' => method_exists( $vulnerability, 'get_source' ) ? $vulnerability->get_source() : ( $vulnerability->source ?? null ),
			);
		}
		return $formatted;
	}

	/**
	 * Whether the affected plugin or theme is in use.
	 *
	 * @param string|null    $type  The plural extension type.
	 * @param string|null    $file  The installed plugin's file, for a plugin.
	 * @param \WP_Theme|null $theme The installed theme, for a theme.
	 * @return string|null `active`, `inactive`, or `parent` for the active theme's parent; null when it isn't installed.
	 */
	private static function get_state( $type, $file, $theme ) {
		if ( 'plugins' === $type && $file ) {
			return self::has_active_plugin( $file ) ? 'active' : 'inactive';
		}
		if ( 'themes' === $type && $theme ) {
			if ( get_stylesheet() === $theme->get_stylesheet() ) {
				return 'active';
			}
			return get_template() === $theme->get_stylesheet() ? 'parent' : 'inactive';
		}
		return null;
	}

	/**
	 * Whether the plugin, or another plugin in its folder, is active, since deleting it removes the whole folder.
	 *
	 * @param string $file The plugin's file.
	 * @return bool
	 */
	private static function has_active_plugin( $file ) {
		$folder = dirname( $file );
		$files  = '.' === $folder ? array( $file ) : array_keys( get_plugins( '/' . $folder ) );
		foreach ( $files as $name ) {
			if ( is_plugin_active( '.' === $folder ? $name : $folder . '/' . $name ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Admin links that act on the affected plugin, theme or core, for the current user.
	 *
	 * @param array          $site The site's plugins and updates.
	 * @param string|null    $type The plural extension type.
	 * @param string|null    $slug The extension slug.
	 * @param string|null    $file The installed plugin's file, for a plugin.
	 * @param \WP_Theme|null $theme The installed theme, for a theme.
	 * @return array Links keyed `update`, `deactivate` and `details`, plus `delete` => true, each only when it applies.
	 */
	private static function get_actions( $site, $type, $slug, $file, $theme = null ) {
		$actions = array();

		if ( 'core' === $type ) {
			if ( current_user_can( 'update_core' ) ) {
				$actions['update'] = self_admin_url( 'update-core.php' );
			}
			return $actions;
		}

		if ( 'themes' === $type && $slug ) {
			if ( current_user_can( 'update_themes' ) && isset( $site['theme_updates'][ $slug ] ) ) {
				$actions['update'] = add_query_arg(
					'_wpnonce',
					wp_create_nonce( 'upgrade-theme_' . $slug ),
					self_admin_url( 'update.php?action=upgrade-theme&theme=' . rawurlencode( $slug ) )
				);
			}
			if ( current_user_can( 'switch_themes' ) && get_stylesheet() === $slug ) {
				$actions['deactivate'] = self_admin_url( 'themes.php' );
			}
			if ( self::can_delete( $type, null, $theme ) ) {
				$actions['delete'] = true;
			}
			return $actions;
		}

		if ( ! $file ) {
			return $actions;
		}

		if ( current_user_can( 'update_plugins' ) && isset( $site['plugin_updates'][ $file ] ) ) {
			$actions['update'] = add_query_arg(
				'_wpnonce',
				wp_create_nonce( 'upgrade-plugin_' . $file ),
				self_admin_url( 'update.php?action=upgrade-plugin&plugin=' . rawurlencode( $file ) )
			);
		}
		if ( current_user_can( 'activate_plugins' ) && is_plugin_active( $file ) ) {
			$actions['deactivate'] = add_query_arg(
				'_wpnonce',
				wp_create_nonce( 'deactivate-plugin_' . $file ),
				self_admin_url( 'plugins.php?action=deactivate&plugin=' . rawurlencode( $file ) )
			);
		}
		if ( self::can_delete( $type, $file ) ) {
			$actions['delete'] = true;
		}
		if ( isset( $site['directory'][ $slug ] ) ) {
			$actions['details'] = 'https://wordpress.org/plugins/' . rawurlencode( $slug ) . '/';
		}
		return $actions;
	}

	/**
	 * Installed plugin files by slug: the plugin's directory, or a single-file plugin's name.
	 *
	 * @param array $plugins Plugins keyed by file, from get_plugins().
	 * @return array
	 */
	public static function get_plugin_files( $plugins ) {
		$files = array();
		foreach ( array_keys( $plugins ) as $file ) {
			$files[ '.' === dirname( $file ) ? basename( $file, '.php' ) : dirname( $file ) ] = $file;
		}
		return $files;
	}

	/**
	 * Whether the current user can delete the affected software from the dashboard: an inactive plugin, or a theme the site doesn't use.
	 *
	 * Multisite is left to Network Admin, where another site may still use it.
	 *
	 * @param string|null    $type  The plural extension type.
	 * @param string|null    $file  The installed plugin's file, for a plugin.
	 * @param \WP_Theme|null $theme The installed theme, for a theme.
	 * @return bool
	 */
	public static function can_delete( $type, $file, $theme = null ) {
		return ! is_multisite()
			&& 'inactive' === self::get_state( $type, $file, $theme )
			&& current_user_can( 'themes' === $type ? 'delete_themes' : 'delete_plugins' );
	}

	/**
	 * The plugin's WordPress.org directory icon, from the update check.
	 *
	 * @param array       $site The site's plugins and updates.
	 * @param string|null $slug The plugin slug.
	 * @return string|null
	 */
	private static function get_plugin_icon( $site, $slug ) {
		if ( ! $slug ) {
			return null;
		}
		$icons = (array) ( $site['directory'][ $slug ]->icons ?? array() );
		foreach ( array( 'svg', '2x', '1x', 'default' ) as $size ) {
			if ( ! empty( $icons[ $size ] ) ) {
				return $icons[ $size ];
			}
		}
		return null;
	}

	/**
	 * Shape a list of threats.
	 *
	 * @param iterable $threats Threats, as an array or a Traversable.
	 * @return array
	 */
	public static function format_all( $threats ) {
		$formatted = array();
		if ( ! is_iterable( $threats ) ) {
			return $formatted;
		}
		$site = self::get_site_extensions();
		foreach ( $threats as $threat ) {
			$formatted[] = self::format( $threat, $site );
		}
		return $formatted;
	}
}
