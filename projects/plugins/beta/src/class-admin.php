<?php
/**
 * Handles the Jetpack Admin functions.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;

/**
 * Handles the Jetpack Beta plugin Admin functions.
 */
class Admin {

	/**
	 * Admin page hook name.
	 *
	 * @var string|false
	 */
	private static $hookname = false;

	/**
	 * Initialize admin hooks.
	 */
	public static function init() {
		add_action( 'admin_menu', array( self::class, 'add_actions' ), 998 );
		add_action( 'network_admin_menu', array( self::class, 'add_actions' ), 998 );
		add_action( 'admin_notices', array( self::class, 'render_banner' ) );
	}

	/**
	 * Action: Attach hooks common to all Jetpack admin pages.
	 *
	 * Action for `admin_menu` and `network_admin_menu`.
	 */
	public static function add_actions() {
		self::$hookname = Admin_Menu::add_menu(
			'Beta Tester',
			'Beta Tester',
			'update_plugins',
			'jetpack-beta',
			array( self::class, 'render' ),
			998
		);

		if ( false !== self::$hookname ) {
			add_action( 'load-' . self::$hookname, array( self::class, 'admin_page_load' ) );
		}

		add_action( 'admin_enqueue_scripts', array( self::class, 'admin_enqueue_scripts' ) );
		add_filter( 'plugin_action_links_' . JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php', array( self::class, 'plugin_action_links' ) );
	}

	/**
	 * Filter: Create the action links for the plugin's row on the plugins page.
	 *
	 * Filter for `plugin_action_links_{$slug}`.
	 *
	 * @param array $actions An array of plugin action links.
	 * @return array $actions
	 */
	public static function plugin_action_links( $actions ) {
		$settings_link = '<a href="' . esc_url( Utils::admin_url() ) . '">' . __( 'Settings', 'jetpack-beta' ) . '</a>';
		array_unshift( $actions, $settings_link );
		return $actions;
	}

	/**
	 * Admin page 'view' entry point.
	 *
	 * This will write the page content to standard output.
	 *
	 * @throws PluginDataException It doesn't really, but phpcs is dumb.
	 */
	public static function render() {
		if ( is_network_admin() && ! is_plugin_active_for_network( JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php' ) ) {
			$exception = new \RuntimeException( __( 'Jetpack Beta Tester must be activated for the network to be used from Network Admin.', 'jetpack-beta' ) );
			require_once __DIR__ . '/admin/exception.template.php';
			exit( 0 );
		}

		ob_start();
		try {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$plugin_name = isset( $_GET['plugin'] ) ? filter_var( wp_unslash( $_GET['plugin'] ) ) : null;

			if ( null !== $plugin_name ) {
				$plugin = Plugin::get_plugin( $plugin_name, true );
				if ( ! $plugin ) {
					throw new PluginDataException(
						// translators: %s: Requested plugin slug.
						sprintf( __( 'Plugin %s is not known.', 'jetpack-beta' ), $plugin_name )
					);
				}
			}

			echo '<div id="jetpack-beta-root"></div>';
		} catch ( PluginDataException $exception ) {
			ob_clean();
			require_once __DIR__ . '/admin/exception.template.php';
		} finally {
			ob_end_flush();
		}
	}

	/**
	 * Action: Handles Beta plugin admin page load.
	 *
	 * Action for `load-{$hook}`.
	 */
	public static function admin_page_load() {
		$plugin_name = isset( $_GET['plugin'] ) ? filter_var( wp_unslash( $_GET['plugin'] ) ) : null;

		// If a plugin is specified, check that it's valid.
		// This comes before any redirect for the access control.
		if ( null !== $plugin_name ) {
			$plugin = Plugin::get_plugin( $plugin_name );

			// Access control: If the plugin being managed is network-activated, redirect to Network Admin if `! is_network_admin()`.
			if ( $plugin && is_multisite() && ! is_network_admin() &&
				( is_plugin_active_for_network( $plugin->plugin_file() ) || is_plugin_active_for_network( $plugin->dev_plugin_file() ) )
			) {
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended
				wp_safe_redirect( Utils::admin_url( $_GET ) );
				exit( 0 );
			}
		}
	}

	/**
	 * Action: Render beta plugin banner.
	 *
	 * Shows a banner on the plugins page if no dev versions have been downloaded yet.
	 *
	 * Action for `admin_notices`.
	 */
	public static function render_banner() {
		global $current_screen;

		if ( 'plugins' !== $current_screen->base || Utils::has_been_used() ) {
			return;
		}

		require __DIR__ . '/admin/notice.template.php';
	}

	/**
	 * Action: Enqueue styles and scripts for admin page.
	 *
	 * Action for `admin_enqueue_scripts`.
	 *
	 * @param string $hookname Admin page being loaded.
	 */
	public static function admin_enqueue_scripts( $hookname ) {
		if ( $hookname !== self::$hookname ) {
			return;
		}

		Assets::register_script(
			'jetpack-beta-app',
			'build/index.js',
			JPBETA__PLUGIN_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-beta',
			)
		);
		Assets::enqueue_script( 'jetpack-beta-app' );

		// Stable body class so the React layout styles (jetpack-admin-page-layout)
		// can pin the header/footer and scroll the middle, independent of the
		// hook-derived `{parent}_page_jetpack-beta` class.
		add_filter(
			'admin_body_class',
			static function ( $classes ) {
				return trim( $classes . ' jetpack-beta-page' );
			}
		);

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$plugin_slug = isset( $_GET['plugin'] ) ? sanitize_text_field( wp_unslash( $_GET['plugin'] ) ) : null;

		// Resolve the human-readable plugin name up front (from cached data) so the
		// React header/breadcrumb can render immediately, without waiting for the
		// get-plugin ability to resolve.
		$plugin_display_name = null;
		if ( null !== $plugin_slug ) {
			try {
				$beta_plugin = Plugin::get_plugin( $plugin_slug );
				if ( $beta_plugin ) {
					$plugin_display_name = $beta_plugin->get_name();
				}
			} catch ( PluginDataException $e ) {
				$plugin_display_name = null;
			}
		}

		// Preload the plugins list on the overview screen (cached data) so it
		// renders instantly without waiting for the list-plugins ability.
		$plugin_list = null;
		if ( null === $plugin_slug ) {
			try {
				$payload     = Abilities\Beta_Abilities::build_plugin_list();
				$plugin_list = $payload['plugins'];
			} catch ( PluginDataException $e ) {
				$plugin_list = null;
			}
		}

		wp_add_inline_script(
			'jetpack-beta-app',
			'window.JetpackBeta = ' . wp_json_encode(
				array(
					'apiRoot'    => esc_url_raw( rest_url() ),
					'apiNonce'   => wp_create_nonce( 'wp_rest' ),
					'plugin'     => $plugin_slug,
					'pluginName' => $plugin_display_name,
					'plugins'    => $plugin_list,
					'adminUrl'   => Utils::admin_url(),
					'canManage'  => current_user_can( 'update_plugins' ),
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);
	}

	/**
	 * Determine content for "To test" and "What changed" boxes.
	 *
	 * @param Plugin $plugin Plugin being processed.
	 * @return (string|null)[] HTML and diff summary.
	 */
	public static function to_test_content( Plugin $plugin ) {
		if ( $plugin->is_active( 'stable' ) ) {
			$path = dirname( $plugin->plugin_path() );
			$info = (object) array(
				'source' => 'stable',
			);
		} elseif ( $plugin->is_active( 'dev' ) ) {
			$path = dirname( $plugin->dev_plugin_path() );
			$info = $plugin->dev_info();
			if ( ! $info ) {
				return array(
					sprintf(
						// translators: %s: Plugin name.
						__( 'This development instance of %s seems to be from an old verison of Jetpack Beta Tester, or has otherwise lost essential metadata. You should use Jetpack Beta Tester to reinstall the desired PR, Release Candidate, or Bleeding Edge version.', 'jetpack-beta' ),
						$plugin->get_name()
					),
					null,
				);
			}
		} else {
			return array( null, null );
		}

		if ( 'pr' === $info->source ) {
			$res = Utils::get_remote_data( sprintf( 'https://api.github.com/repos/%s/pulls/%d', $plugin->repo(), $info->pr ), "github/pulls/$info->pr" );
			if ( ! isset( $res->body ) ) {
				return array( 'GitHub commit info is unavailable.', null );
			}
			$html = Utils::render_markdown( $plugin, $res->body );

			$res  = Utils::get_remote_data( sprintf( 'https://api.github.com/repos/%s/pulls/%d/files', $plugin->repo(), $info->pr ), "github/pulls/$info->pr/files" );
			$diff = null;
			if ( is_array( $res ) ) {
				// translators: %d: number of files changed.
				$diff  = '<div>' . sprintf( _n( '%d file changed ', '%d files changed', count( $res ), 'jetpack-beta' ), count( $res ) ) . "<br />\n";
				$diff .= "<ul class=\"ul-square jpbeta-file-list\">\n";
				foreach ( $res as $file ) {
					$added_deleted_changed = array();
					if ( $file->additions ) {
						$added_deleted_changed[] = '+' . $file->additions;
					}
					if ( $file->deletions ) {
						$added_deleted_changed[] = '-' . $file->deletions;
					}
					$diff .= sprintf( '<li><span class="container"><span class="filename">%s</span><span class="status">&nbsp;(%s %s)</span></span></li>', esc_html( $file->filename ), esc_html( $file->status ), implode( ' ', $added_deleted_changed ) ) . "\n";
				}
				$diff .= "</ul></div>\n\n";
			}

			return array( $html, $diff );
		}

		WP_Filesystem();
		global $wp_filesystem;

		$file = $path . '/to-test.md';
		if ( ! file_exists( $file ) ) {
			$file = __DIR__ . '/../docs/testing/testing-tips.md';
		}
		return array( Utils::render_markdown( $plugin, $wp_filesystem->get_contents( $file ) ), null );
	}
}
