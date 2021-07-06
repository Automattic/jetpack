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
		ob_start();
		try {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$plugin_name = isset( $_GET['plugin'] ) ? $_GET['plugin'] : null;

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
		$plugin_name = isset( $_GET['plugin'] ) ? $_GET['plugin'] : null;
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
		if ( wp_verify_nonce( $_GET['_wpnonce'], 'activate_branch' ) && isset( $_GET['activate-branch'] ) && $plugin ) {
			list( $source, $id ) = explode( ':', $_GET['activate-branch'], 2 );
			$res                 = $plugin->installer()->install_and_activate( $source, $id );
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
			wp_verify_nonce( $_GET['_wpnonce'], "enable_$option" ) &&
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
				'updating'   => __( 'Updating...', 'jetpack-beta' ),
				'leaving'    => __( 'Don\'t go Plugin is still installing!', 'jetpack-beta' ),
			)
		);
	}

	/**
	 * Determine what we're going to test (pr, master, rc).
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
			$info = $plugin->installer()->dev_info();
		} else {
			return array( null, null );
		}

		if ( 'pr' === $info->source ) {
			$github_info = Utils::get_remote_data( sprintf( 'https://api.github.com/repos/%s/pulls/%d', $plugin->repo(), $info->pr ), "github/pulls/$info->pr" );
			if ( ! isset( $github_info->body ) ) {
				return array( 'GitHub commit info is unavailable.', null );
			}
			$html        = Utils::render_markdown( $plugin, $github_info->body );
			$github_info = Utils::get_remote_data( sprintf( 'https://api.github.com/repos/%s/pulls/%d/files', $plugin->repo(), $info->pr ), "github/pulls/$info->pr/files" );
			$diff        = null;
			if ( is_array( $github_info ) ) {
				// translators: %d: number of files changed.
				$diff  = '<div>' . sprintf( _n( '%d file changed ', '%d files changed', count( $github_info ), 'jetpack-beta' ), count( $github_info ) ) . "<br />\n";
				$diff .= "<ul class=\"ul-square jpbeta-file-list\">\n";
				foreach ( $github_info as $file ) {
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

	/**
	 * Handles branch selection on beta plugin's admin page
	 *
	 * @param string $header Title of the branch.
	 * @param string $branch_key Specifies which branch.
	 * @param object $branch Contains branch data (title, update date, download link, commit, etc).
	 * @param string $section The kind of branch we're switching to (stable, rc, master, pr).
	 * @param bool   $is_last Last branch in the list.
	 */
	public static function show_branch( $header, $branch_key, $branch = null, $section = null, $is_last = false ) {
		if ( ! is_object( $branch ) ) {
			$manifest = Utils::get_beta_manifest();
			if ( empty( $manifest->{$section} ) ) {
				return;
			}
			$branch = $manifest->{$section};
		}

		$is_compact = $is_last ? '' : 'is-compact';
		$more_info  = '';
		$pr         = '';
		if ( isset( $branch->pr ) && is_int( $branch->pr ) ) {
			$pr = sprintf( 'data-pr="%s"', esc_attr( $branch->pr ) );
			// translators: Translates the `More info` link.
			$more_info = sprintf( __( '<a target="_blank" rel="external noopener noreferrer" href="%1$s">more info #%2$s</a> - ', 'jetpack-beta' ), Utils::get_url( $branch_key, $section ), $branch->pr );
		}

		$update_time = ( isset( $branch->update_date )
			// translators: %s is how long ago the branch was updated.
			? sprintf( __( 'last updated %s ago', 'jetpack-beta' ), human_time_diff( strtotime( $branch->update_date ) ) )
			: ''
		);

		$branch_class                             = 'branch-card';
		list( $current_branch, $current_section ) = Utils::get_branch_and_section();
		if ( $current_branch === $branch_key && $current_section === $section ) {
			$action       = __( 'Active', 'jetpack-beta' );
			$branch_class = 'branch-card-active';
		} else {
			$action = self::activate_button( $branch_key, $section );
		}
		$header = str_replace( '-', ' ', $header );
		$header = str_replace( '_', ' / ', $header );
		?>
		<div <?php echo esc_attr( $pr ); ?> " class="dops-foldable-card <?php echo esc_attr( $branch_class ); ?> has-expanded-summary dops-card <?php echo esc_attr( $is_compact ); ?>">
			<div class="dops-foldable-card__header has-border" >
				<span class="dops-foldable-card__main">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text branch-card-header"><?php echo esc_html( $header ); ?></div>
						<div class="dops-foldable-card__subheader">
						<?php
							echo wp_kses_post( $more_info );
							echo wp_kses_post( $update_time );
						?>
						</div>
					</div>
				</span>
				<span class="dops-foldable-card__secondary">
					<span class="dops-foldable-card__summary">
						<?php echo wp_kses_post( $action ); ?>
					</span>
				</span>
			</div>
		</div>
		<?php
	}

	/**
	 * Handles list of available Jetpack tags to select specific Jetpack version number.
	 *
	 * @param string $header Title of tag.
	 * @param string $tag Jetpack tag (for selecting a specific version of Jetpack).
	 * @param string $url Download link for Jetpack version.
	 * @param string $section The kind of version we're switching to (in this case 'tags').
	 * @param bool   $is_last last version in the list.
	 */
	public static function show_tag( $header, $tag, $url = null, $section = null, $is_last = false ) {
		$is_compact = $is_last ? '' : 'is-compact';
		if ( isset( $url ) ) {
			$data_tag = sprintf( 'data-tag="%s"', $tag );
		}

		$class_name                               = 'tag-card';
		list( $current_branch, $current_section ) = Utils::get_branch_and_section();
		if ( $current_branch === $tag && $current_section === $section ) {
			$action     = __( 'Active', 'jetpack-beta' );
			$class_name = 'tag-card-active';
		} else {
			$action = self::activate_button( $tag, $section );
		}

		$header = str_replace( '-', ' ', $header );
		$header = str_replace( '_', ' / ', $header );
		?>
		<div <?php echo wp_kses_post( $data_tag ); ?> " class="dops-foldable-card <?php echo esc_attr( $class_name ); ?> has-expanded-summary dops-card <?php echo esc_attr( $is_compact ); ?>">
			<div class="dops-foldable-card__header has-border">
				<span class="dops-foldable-card__main">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text tag-card-header">Jetpack <?php echo esc_html( $header ); ?></div>
						<div class="dops-foldable-card__subheader">
						<?php
						sprintf(
							// Translators: Which release is being selected.
							__( 'Public release (%1$s) <a href="https://plugins.trac.wordpress.org/browser/jetpack/tags/%2$s" target="_blank" rel="">available on WordPress.org</a>', 'jetpack-beta' ),
							esc_html( $tag ),
							esc_attr( $tag )
						);
						?>
						</div>
					</div>
				</span>
				<span class="dops-foldable-card__secondary">
					<span class="dops-foldable-card__summary">
						<?php echo wp_kses_post( $action ); ?>
					</span>
				</span>
			</div>
		</div>
		<?php
	}

	/**
	 * Handles the activation buttons.
	 *
	 * @param object $branch specifies which branch.
	 * @param string $section The kind of branch we're switching to (stable, rc, master, pr).
	 */
	public static function activate_button( $branch, $section ) {
		if ( is_object( $section ) && 'master' === $branch ) {
			$section = 'master';
		}

		if ( is_object( $section ) && 'rc' === $branch ) {
			$section = 'rc';
		}
		$query = array(
			'activate-branch' => $branch,
			'section'         => $section,
		);
		$url   = wp_nonce_url( Utils::admin_url( $query ), 'activate_branch' );

		return sprintf(
			'<a href="%1$s" class="is-primary jp-form-button activate-branch dops-button is-compact jptracks" data-jptracks-name="%2$s" data-jptracks-prop="%3$s">%4$s</a>',
			esc_url( $url ),
			'jetpack_beta_activate_branch',
			esc_attr( $branch ),
			esc_html__( 'Activate', 'jetpack-beta' )
		);
	}

	/**
	 * Display the branch header
	 *
	 * @param string $title - The title of the branch.
	 */
	public static function header( $title ) {
		echo '<header><h2 class="jp-jetpack-connect__container-subtitle">' . esc_html( $title ) . '</h2></header>';
	}

	/**
	 * Display the branch list
	 *
	 * @param string $section - The kind of branch we're switching to (stable, rc, master, pr).
	 * @param string $title - The title of the branch.
	 */
	public static function show_branches( $section, $title = null ) {
		if ( $title ) {
			$title .= ': ';
		}
		echo '<div id="section-' . esc_attr( $section ) . '">';

		$manifest = Utils::get_beta_manifest();
		$count    = 0;
		if ( empty( $manifest->{$section} ) ) {
			return;
		}
		$branches  = (array) $manifest->{$section};
		$count_all = count( $branches );

		foreach ( $branches as $branch_name => $branch ) {
			$count ++;
			$is_last = $count_all === $count ? true : false;
			self::show_branch( $title . $branch_name, $branch_name, $branch, $section, $is_last );
		}
		echo '</div>';
	}

	/**
	 * Show list of available Jetpack tags to select specific Jetpack version number.
	 *
	 * @param string $section - The kind of version we're switching to (in this case 'tags').
	 * @param string $title - The name of the Jetpack tag.
	 */
	public static function show_tags( $section, $title = null ) {
		if ( $title ) {
			$title .= ': ';
		}
		echo '<div id="section-' . esc_attr( $section ) . '">';

		$manifest = Utils::get_org_data();
		$count    = 0;
		if ( empty( $manifest->versions ) ) {
			return;
		}
		$tags      = array_reverse( (array) $manifest->versions );
		$count_all = count( $tags );

		foreach ( $tags as $tag => $url ) {
			$count ++;
			$is_last = $count_all === $count ? true : false;
			self::show_tag( $title . $tag, $tag, $url, $section, $is_last );
		}
		echo '</div>';
	}

	/** Display the stable branch */
	public static function show_stable_branch() {
		$org_data = Utils::get_org_data();

		self::show_branch(
			__( 'Latest Stable', 'jetpack-beta' ),
			'stable',
			(object) array(
				'branch'      => 'stable',
				'update_date' => $org_data->last_updated,
			),
			'stable'
		);
	}

	/** Show search bar for PRs */
	public static function show_search_prs() {
		$manifest = Utils::get_beta_manifest();
		if ( empty( $manifest->pr ) ) {
			return;
		}
		?>
		<div class="dops-navigation">
			<div class="dops-section-nav has-pinned-items">
				<div class="dops-section-nav__panel">
					<div class="is-pinned is-open dops-search" role="search">
						<div aria-controls="search-component" aria-label="<?php esc_attr_e( 'Open Search', 'jetpack-beta' ); ?>" tabindex="-1">
							<svg class="gridicon gridicons-search dops-search-open__icon" height="24"
								viewbox="0 0 24 24" width="24">
								<g>
									<path d="M21 19l-5.154-5.154C16.574 12.742 17 11.42 17 10c0-3.866-3.134-7-7-7s-7 3.134-7 7 3.134 7 7 7c1.42 0 2.742-.426 3.846-1.154L19 21l2-2zM5 10c0-2.757 2.243-5 5-5s5 2.243 5 5-2.243 5-5 5-5-2.243-5-5z"></path>
								</g>
							</svg>
						</div>
						<input aria-hidden="false" class="dops-search__input" id="search-component-prs"
							placeholder="<?php esc_attr_e( 'Search for a Jetpack Feature Branch', 'jetpack-beta' ); ?>" role="search" type="search" value="">
						<span aria-controls="search-component" id="search-component-prs-close" aria-label="<?php esc_attr_e( 'Close Search', 'jetpack-beta' ); ?>"
							tabindex="0">
							<svg class="gridicon gridicons-cross dops-search-close__icon" height="24"
								viewbox="0 0 24 24" width="24">
								<g>
									<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path>
								</g>
							</svg>
						</span>
					</div>
				</div>
			</div>
		</div>
		<?php
	}

	/** Show search bar for tags */
	public static function show_search_org_tags() {
		$org_data = Utils::get_org_data();
		if ( empty( $org_data->versions ) ) {
			return;
		}
		?>
		<div class="dops-navigation">
			<div class="dops-section-nav has-pinned-items">
				<div class="dops-section-nav__panel">
					<div class="is-pinned is-open dops-search" role="search">
						<div aria-controls="search-component" aria-label="<?php esc_attr_e( 'Open Search', 'jetpack-beta' ); ?>" tabindex="-1">
							<svg class="gridicon gridicons-search dops-search-open__icon" height="24"
								viewbox="0 0 24 24" width="24">
								<g>
									<path d="M21 19l-5.154-5.154C16.574 12.742 17 11.42 17 10c0-3.866-3.134-7-7-7s-7 3.134-7 7 3.134 7 7 7c1.42 0 2.742-.426 3.846-1.154L19 21l2-2zM5 10c0-2.757 2.243-5 5-5s5 2.243 5 5-2.243 5-5 5-5-2.243-5-5z"></path>
								</g>
							</svg>
						</div>
						<input aria-hidden="false" class="dops-search__input" id="search-component-tags"
							placeholder="<?php esc_attr_e( 'Search for a Jetpack tag', 'jetpack-beta' ); ?>" role="search" type="search" value="">
						<span aria-controls="search-component" id="search-component-tags-close" aria-label="<?php esc_attr_e( 'Close Search', 'jetpack-beta' ); ?>"
							tabindex="0">
							<svg class="gridicon gridicons-cross dops-search-close__icon" height="24"
								viewbox="0 0 24 24" width="24">
								<g>
									<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path>
								</g>
							</svg>
						</span>
					</div>
				</div>
			</div>
		</div>
		<?php
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
			$query['plugin'] = $_GET['plugin'];
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
