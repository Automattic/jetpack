<?php
/**
 * Handles the Jetpack Admin functions.
 *
 * @package automattic/jetpack-beta
 */

namespace Automattic\JetpackBeta;

use Jetpack;

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
		if ( class_exists( Jetpack::class ) ) {
			self::$hookname = add_submenu_page(
				'jetpack',
				'Jetpack Beta',
				'Jetpack Beta',
				'update_plugins',
				'jetpack-beta',
				array( self::class, 'render' )
			);
		} else {
			self::$hookname = add_menu_page(
				'Jetpack Beta',
				'Jetpack Beta',
				'update_plugins',
				'jetpack-beta',
				array( self::class, 'render' )
			);
		}

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
			exit;
		}

		ob_start();
		try {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$plugin_name = isset( $_GET['plugin'] ) ? filter_var( wp_unslash( $_GET['plugin'] ) ) : null;

			if ( null === $plugin_name ) {
				require_once __DIR__ . '/admin/plugin-select.template.php';
				return;
			}

			$plugin = Plugin::get_plugin( $plugin_name, true );
			if ( ! $plugin ) {
				throw new PluginDataException(
					// translators: %s: Requested plugin slug.
					sprintf( __( 'Plugin %s is not known.', 'jetpack-beta' ), $plugin_name )
				);
			}

			require_once __DIR__ . '/admin/plugin-manage.template.php';
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
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$plugin_name = isset( $_GET['plugin'] ) ? filter_var( wp_unslash( $_GET['plugin'] ) ) : null;
		$plugin      = null;

		// If a plugin is specified, check that it's valid.
		// This comes before the nonce check for the access control.
		if ( null !== $plugin_name ) {
			$plugin = Plugin::get_plugin( $plugin_name );

			// Access control: If the plugin being managed is network-activated, redirect to Network Admin if `! is_network_admin()`.
			if ( $plugin && is_multisite() && ! is_network_admin() &&
				( is_plugin_active_for_network( $plugin->plugin_file() ) || is_plugin_active_for_network( $plugin->dev_plugin_file() ) )
			) {
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended
				wp_safe_redirect( Utils::admin_url( $_GET ) );
				exit();
			}
		}

		// No nonce? Nothing else to do.
		if ( ! isset( $_GET['_wpnonce'] ) ) {
			return;
		}

		// Install and activate Jetpack Version.
		if (
			wp_verify_nonce( $_GET['_wpnonce'], 'activate_branch' ) && // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- WP core doesn't pre-sanitize nonces either.
			isset( $_GET['activate-branch'] ) && $plugin
		) {
			list( $source, $id ) = explode( ':', filter_var( wp_unslash( $_GET['activate-branch'] ) ), 2 );
			$res                 = $plugin->install_and_activate( $source, $id );
			if ( is_wp_error( $res ) ) {
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				wp_die( $res );
			}
		}

		// Toggle autoupdates.
		if ( self::is_toggle_action( 'autoupdates' ) ) {
			$autoupdate = (bool) Utils::is_set_to_autoupdate();
			update_option( 'jp_beta_autoupdate', (int) ! $autoupdate );

			if ( Utils::is_set_to_autoupdate() ) {
				Hooks::maybe_schedule_autoupdate();
			}
		}

		// Toggle email notifications.
		if ( self::is_toggle_action( 'email_notifications' ) ) {
			$enable_email_notifications = (bool) Utils::is_set_to_email_notifications();
			update_option( 'jp_beta_email_notifications', (int) ! $enable_email_notifications );
		}

		wp_safe_redirect( Utils::admin_url( $plugin ? array( 'plugin' => $plugin_name ) : array() ) );
		exit();
	}

	/**
	 * Checks if autoupdates and email notifications are toggled.
	 *
	 * @param string $option - Which option is being toggled.
	 */
	private static function is_toggle_action( $option ) {
		return (
			isset( $_GET['_wpnonce'] ) &&
			wp_verify_nonce( $_GET['_wpnonce'], "enable_$option" ) && // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- WP core doesn't pre-sanitize nonces either.
			isset( $_GET['_action'] ) &&
			"toggle_enable_$option" === $_GET['_action']
		);
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

		wp_enqueue_style( 'jetpack-beta-admin', plugins_url( 'admin/admin.css', __FILE__ ), array(), JPBETA_VERSION );
		wp_enqueue_script( 'jetpack-admin-js', plugins_url( 'admin/admin.js', __FILE__ ), array(), JPBETA_VERSION, true );
		wp_localize_script(
			'jetpack-admin-js',
			'JetpackBeta',
			array(
				'activate'   => __( 'Activate', 'jetpack-beta' ),
				'activating' => __( 'Activating...', 'jetpack-beta' ),
				'update'     => __( 'Update', 'jetpack-beta' ),
				'updating'   => __( 'Updating...', 'jetpack-beta' ),
				'failed'     => __( 'Failed', 'jetpack-beta' ),
				// translators: %s: Error message.
				'failedmsg'  => __( 'Update failed: %s', 'jetpack-beta' ),
			)
		);
	}

	/**
	 * Determine content for "To test" and "What changed" boxes.
	 *
	 * @param Plugin $plugin Plugin being processed.
	 * @return (string|null)[] HTML and diff summary.
	 */
	public static function to_test_content( Plugin $plugin ) {
		if ( is_plugin_active( $plugin->plugin_file() ) ) {
			$path = WP_PLUGIN_DIR . '/' . $plugin->plugin_slug();
			$info = (object) array(
				'source' => 'stable',
			);
		} elseif ( is_plugin_active( $plugin->dev_plugin_file() ) ) {
			$path = WP_PLUGIN_DIR . '/' . $plugin->dev_plugin_slug();
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

	/** Display autoupdate toggle */
	public static function show_toggle_autoupdates() {
		$autoupdate = (bool) Utils::is_set_to_autoupdate();
		self::show_toggle( __( 'Autoupdates', 'jetpack-beta' ), 'autoupdates', $autoupdate );
	}

	/** Display email notification toggle */
	public static function show_toggle_emails() {
		if ( ! Utils::is_set_to_autoupdate() || defined( 'JETPACK_BETA_SKIP_EMAIL' ) ) {
			return;
		}
		$email_notification = (bool) Utils::is_set_to_email_notifications();
		self::show_toggle( __( 'Email Notifications', 'jetpack-beta' ), 'email_notifications', $email_notification );
	}

	/**
	 * Display autoupdate and email notification toggles
	 *
	 * @param string $name name of toggle.
	 * @param string $option Which toggle (autoupdates, email_notification).
	 * @param bool   $value If toggle is active or not.
	 */
	public static function show_toggle( $name, $option, $value ) {
		$query = array(
			'_action' => "toggle_enable_$option",
		);
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['plugin'] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$query['plugin'] = filter_var( wp_unslash( $_GET['plugin'] ) );
		}

		?>
		<a
			href="<?php echo esc_url( wp_nonce_url( Utils::admin_url( $query ), "enable_$option" ) ); ?>"
			class="form-toggle__label <?php echo ( $value ? 'is-active' : '' ); ?>"
			data-jptracks-name="jetpack_beta_toggle_<?php echo esc_attr( $option ); ?>"
			data-jptracks-prop="<?php echo absint( ! $value ); ?>"
		>
			<span class="form-toggle-explanation" ><?php echo esc_html( $name ); ?></span>
			<span class="form-toggle__switch" tabindex="0" ></span>
			<span class="form-toggle__label-content" ></span>
		</a>
		<?php
	}

}
