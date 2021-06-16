<?php
/**
 * Handles the Jetpack Admin functions.
 *
 * @package automattic/jetpack-beta
 */

/** Class Jetpack_Beta_Admin */
class Jetpack_Beta_Admin {

	/** Initialize admin hooks. */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_actions' ), 998 );
		add_action( 'network_admin_menu', array( __CLASS__, 'add_actions' ), 998 );
		add_action( 'admin_notices', array( __CLASS__, 'render_banner' ) );
	}

	/** Attach hooks common to all Jetpack admin pages. */
	public static function add_actions() {
		$hook = self::get_page_hook();
		add_action( "load-$hook", array( __CLASS__, 'admin_page_load' ) );
		add_action( "admin_print_styles-$hook", array( __CLASS__, 'admin_styles' ) );
		add_action( "admin_print_scripts-$hook", array( __CLASS__, 'admin_scripts' ) );
		add_filter( 'plugin_action_links_' . JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php', array( __CLASS__, 'admin_plugin_settings_link' ) );
	}

	/** Get page hook */
	public static function get_page_hook() {
		if ( Jetpack_Beta::is_network_active() && ! is_network_admin() ) {
			return;
		}
		if ( class_exists( 'Jetpack' ) ) {
			return add_submenu_page(
				'jetpack',
				'Jetpack Beta',
				'Jetpack Beta',
				'update_plugins',
				'jetpack-beta',
				array( __CLASS__, 'render' )
			);
		}

		return add_menu_page(
			'Jetpack Beta',
			'Jetpack Beta',
			'update_plugins',
			'jetpack-beta',
			array( __CLASS__, 'render' )
		);
	}

	/** Always grab and render the latest version. */
	public static function render() {
		Jetpack_Beta::get_beta_manifest( true );
		require_once JPBETA__PLUGIN_DIR . 'admin/main.php';
	}

	/** Return the beta plugin's settings link. */
	public static function settings_link() {
		return admin_url( 'admin.php?page=jetpack-beta' );
	}

	/**
	 * Create the beta plugin's settings link.
	 *
	 * @param array $links the link being clicked.
	 */
	public static function admin_plugin_settings_link( $links ) {
		$settings_link = '<a href="' . esc_url( self::settings_link() ) . '">' . __( 'Settings', 'jetpack-beta' ) . '</a>';
		array_unshift( $links, $settings_link );
		return $links;
	}

	/** Handles Beta plugin admin page. */
	public static function admin_page_load() {
		if ( ! isset( $_GET['_nonce'] ) ) {
			return;
		}
		// Install and activate Jetpack Version.
		if ( wp_verify_nonce( $_GET['_nonce'], 'activate_branch' ) && isset( $_GET['activate-branch'] ) && isset( $_GET['section'] ) ) {
			$branch  = esc_html( $_GET['activate-branch'] );
			$section = esc_html( $_GET['section'] );

			Jetpack_Beta::install_and_activate( $branch, $section );
		}

		// Update to the latest version.
		if ( wp_verify_nonce( $_GET['_nonce'], 'update_branch' ) && isset( $_GET['update-branch'] ) && isset( $_GET['section'] ) ) {
			$branch  = esc_html( $_GET['update-branch'] );
			$section = esc_html( $_GET['section'] );

			Jetpack_Beta::update_plugin( $branch, $section );
		}

		// Toggle autoupdates.
		if ( self::is_toggle_action( 'autoupdates' ) ) {
			$autoupdate = (bool) Jetpack_Beta::is_set_to_autoupdate();
			update_option( 'jp_beta_autoupdate', (int) ! $autoupdate );

			if ( Jetpack_Beta::is_set_to_autoupdate() ) {
				Jetpack_Beta::maybe_schedule_autoupdate();
			}
		}

		// Toggle email notifications.
		if ( self::is_toggle_action( 'email_notifications' ) ) {
			$enable_email_notifications = (bool) Jetpack_Beta::is_set_to_email_notifications();
			update_option( 'jp_beta_email_notifications', (int) ! $enable_email_notifications );
		}
		wp_safe_redirect( Jetpack_Beta::admin_url() );

		exit();
	}

	/**
	 * Checks if autoupdates and email notifications are toggled.
	 *
	 * @param string $option - Which option is being toggled.
	 */
	public static function is_toggle_action( $option ) {
		return (
			isset( $_GET['_nonce'] ) &&
			wp_verify_nonce( $_GET['_nonce'], 'enable_' . $option ) &&
			isset( $_GET['_action'] ) &&
			'toggle_enable_' . $option === $_GET['_action']
		);
	}

	/** Render beta plugin banner */
	public static function render_banner() {
		global $current_screen;

		if ( 'plugins' !== $current_screen->base ) {
			return;
		}

		if ( Jetpack_Beta::get_option() ) {
			return;
		}

		self::start_notice();
	}

	/** Enqueue admin styling from admin.css */
	public static function admin_styles() {
		wp_enqueue_style( 'jetpack-beta-admin', plugins_url( 'admin/admin.css', JPBETA__PLUGIN_FILE ), array(), JPBETA_VERSION );
	}

	/** Enqueue scripts from admin.js */
	public static function admin_scripts() {
		wp_enqueue_script( 'jetpack-admin-js', plugins_url( 'admin/admin.js', JPBETA__PLUGIN_FILE ), array(), JPBETA_VERSION, true );
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

	/** Determine what we're going to test (pr, master, rc) */
	public static function to_test_content() {
		list( $branch, $section ) = Jetpack_Beta::get_branch_and_section();
		switch ( $section ) {
			case 'pr':
				return self::to_test_pr_content( $branch );
			case 'rc':
				return self::to_test_file_content();
			default: // Master "bleeding edge" or latest stable.
				return self::to_test_general_rules_content();

		}
	}

	/**
	 * General rules and recommendations for new Beta Testers.
	 * Displayed when no specific branch is picked.
	 *
	 * @since 2.5.0
	 */
	public static function to_test_general_rules_content() {
		$test_rules = JPBETA__PLUGIN_DIR . '/docs/testing/testing-tips.md';
		if ( ! file_exists( $test_rules ) ) {
			return;
		}
		WP_Filesystem();
		global $wp_filesystem;
		$content = $wp_filesystem->get_contents( $test_rules );
		return self::render_markdown( $content );
	}

	/** Return testing instructions for release candidate branch */
	public static function to_test_file_content() {
		$test_file = WP_PLUGIN_DIR . '/' . Jetpack_Beta::get_plugin_slug() . '/to-test.md';
		if ( ! file_exists( $test_file ) ) {
			return;
		}
		WP_Filesystem();
		global $wp_filesystem;
		$content = $wp_filesystem->get_contents( $test_file );
		return self::render_markdown( $content );
	}

	/**
	 * Get PR information for what we want to test
	 *
	 * @param string $branch_key The branch we're switching to.
	 * */
	public static function to_test_pr_content( $branch_key ) {
		$manifest = Jetpack_Beta::get_beta_manifest();
		$pr       = isset( $manifest->pr->{$branch_key}->pr ) ? $manifest->pr->{$branch_key}->pr : null;

		if ( ! $pr ) {
			return null;
		}
		$github_info = Jetpack_Beta::get_remote_data( JETPACK_GITHUB_API_URL . 'pulls/' . $pr, 'github_' . $pr );

		return self::render_markdown( $github_info->body );
	}

	/**
	 * Rendering markdown for testing instructions
	 *
	 * @param string $content - Content from testing instructions for the branch we're testing.
	 */
	public static function render_markdown( $content ) {

		add_filter( 'jetpack_beta_test_content', 'wptexturize' );
		add_filter( 'jetpack_beta_test_content', 'convert_smilies' );
		add_filter( 'jetpack_beta_test_content', 'convert_chars' );
		add_filter( 'jetpack_beta_test_content', 'wpautop' );
		add_filter( 'jetpack_beta_test_content', 'shortcode_unautop' );
		add_filter( 'jetpack_beta_test_content', 'prepend_attachment' );

		if ( ! function_exists( 'jetpack_require_lib' ) ) {
			return apply_filters( 'jetpack_beta_test_content', $content );
		}

		jetpack_require_lib( 'markdown' );
		if ( ! class_exists( 'WPCom_Markdown' ) ) {
			if ( ! include_once WP_PLUGIN_DIR . '/' . Jetpack_Beta::get_plugin_slug() . '/modules/markdown/easy-markdown.php' ) {
				include_once WP_PLUGIN_DIR . '/jetpack/modules/markdown/easy-markdown.php';
			};
		}

		if ( ! class_exists( 'WPCom_Markdown' ) ) {
			return apply_filters( 'jetpack_beta_test_content', $content );
		}
		$rendered_html = WPCom_Markdown::get_instance()->transform(
			$content,
			array(
				'id'      => false,
				'unslash' => false,
			)
		);

		// Lets convert #hash numbers into links to issues.
		$rendered_html = preg_replace( '/\#([0-9]+)/', '<a href="https://github.com/Automattic/jetpack/issues/$1">#$1</a>', $rendered_html );

		$rendered_html = apply_filters( 'jetpack_beta_test_content', $rendered_html );

		return $rendered_html;
	}

	/** Display the body of the start notice on the Jetpack Beta admin page */
	public static function start_notice() {
		global $current_screen;

		$is_notice = ( 'plugins' === $current_screen->base ? true : false );
		?>
		<style type="text/css">
			#jetpack-beta-tester__start {
				background: #FFF;
				padding: 20px;
				margin-top:20px;
				box-shadow: 0 0 0 1px rgba(200, 215, 225, 0.5), 0 1px 2px #e9eff3;
				position: relative;
			}
			#jetpack-beta-tester__start.updated {
				border-left: 3px solid #8CC258;
			}
			#jetpack-beta-tester__start h1 {
				font-weight: 400;
				margin: 0;
				font-size: 20px;
			}
			#jetpack-beta-tester__start p {
				margin-bottom:1em;
			}
		</style>
		<div id="jetpack-beta-tester__start" class="dops-card <?php echo ( $is_notice ? 'updated' : '' ); ?> ">
			<h1><?php esc_html_e( 'Welcome to Jetpack Beta Tester', 'jetpack-beta' ); ?></h1>
			<p><?php esc_html_e( 'Thank you for helping to test Jetpack!  We appreciate your time and effort.', 'jetpack-beta' ); ?></p>
			<p>
			<?php
			echo wp_kses_post(
				__(
					'When you select a Jetpack branch to test, Jetpack Beta Tester will install and activate it on your behalf and keep it up to date.
					When you are finished testing, you can switch back to the current version of Jetpack by selecting <em>Latest Stable</em>.',
					'jetpack-beta'
				)
			);
			?>
				</p>
			<p>
			<?php
			echo wp_kses_post(
				sprintf(
					// Translators: link to Jetack master testing doc in Github.
					__( 'Not sure where to start?  If you select <em>Bleeding Edge</em>, you\'ll get <a href="%1$s">all the cool new features</a> we\'re planning to ship in our next release.', 'jetpack-beta' ),
					esc_url( 'https://github.com/Automattic/jetpack/blob/master/to-test.md' )
				)
			);
			?>
			</p>
			<?php if ( $is_notice ) { ?>
			<a href="<?php echo esc_url( Jetpack_Beta::admin_url() ); ?>"><?php esc_html_e( 'Let\'s get testing!', 'jetpack-beta' ); ?></a>
			<?php } ?>

		</div>
		<?php
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
			$manifest = Jetpack_Beta::get_beta_manifest();
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
			$more_info = sprintf( __( '<a target="_blank" rel="external noopener noreferrer" href="%1$s">more info #%2$s</a> - ', 'jetpack-beta' ), Jetpack_Beta::get_url( $branch_key, $section ), $branch->pr );
		}

		$update_time = ( isset( $branch->update_date )
			// translators: %s is how long ago the branch was updated.
			? sprintf( __( 'last updated %s ago', 'jetpack-beta' ), human_time_diff( strtotime( $branch->update_date ) ) )
			: ''
		);

		$branch_class                             = 'branch-card';
		list( $current_branch, $current_section ) = Jetpack_Beta::get_branch_and_section();
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
		list( $current_branch, $current_section ) = Jetpack_Beta::get_branch_and_section();
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
			'page'            => 'jetpack-beta',
			'activate-branch' => $branch,
			'section'         => $section,
			'_nonce'          => wp_create_nonce( 'activate_branch' ),
		);
		$url   = Jetpack_Beta::admin_url( '?' . build_query( $query ) );

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

		$manifest = Jetpack_Beta::get_beta_manifest();
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

		$manifest = Jetpack_Beta::get_org_data();
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
		$org_data = Jetpack_Beta::get_org_data();

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
		$manifest = Jetpack_Beta::get_beta_manifest();
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
		$org_data = Jetpack_Beta::get_org_data();
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
		$autoupdate = (bool) Jetpack_Beta::is_set_to_autoupdate();
		self::show_toggle( __( 'Autoupdates', 'jetpack-beta' ), 'autoupdates', $autoupdate );
	}

	/** Display email notification toggle */
	public static function show_toggle_emails() {
		if ( ! Jetpack_Beta::is_set_to_autoupdate() || defined( 'JETPACK_BETA_SKIP_EMAIL' ) ) {
			return;
		}
		$email_notification = (bool) Jetpack_Beta::is_set_to_email_notifications();
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
			'page'    => 'jetpack-beta',
			'_action' => 'toggle_enable_' . $option,
			'_nonce'  => wp_create_nonce( 'enable_' . $option ),
		);

		?>
		<a
			href="<?php echo esc_url( Jetpack_Beta::admin_url( '?' . build_query( $query ) ) ); ?>"
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

	/** Check if Jetpack and branch versions are up to date */
	public static function show_needed_updates() {
		$should_update_stable_version = Jetpack_Beta::should_update_stable_version();
		$should_update_dev_version    = Jetpack_Beta::should_update_dev_version();
		$should_update_dev_to_master  = Jetpack_Beta::should_update_dev_to_master();

		// Return if there are no updates available.
		if ( ! $should_update_stable_version
			&& ! $should_update_dev_version
			&& ! $should_update_dev_to_master ) {
			return;
		}

		?>
		<div class="jetpack-beta__wrap jetpack-beta__update-needed">
			<h2><?php esc_html_e( 'Some updates are required', 'jetpack-beta' ); ?></h2>
		<?php

		// Stable up to date?
		if ( $should_update_stable_version ) {
			self::update_card(
				__( 'Latest Stable', 'jetpack-beta' ),
				__( 'Needs an update', 'jetpack-beta' ),
				self::update_action_url( 'stable', 'stable' )
			);
		}
		// Jetpack Dev Folder not up to date?
		if ( $should_update_dev_version ) {
			list( $dev_branch, $dev_section ) = Jetpack_Beta::get_branch_and_section_dev();
			self::update_card(
				Jetpack_Beta::get_jetpack_plugin_pretty_version( true ),
				__( 'Is not running the latest version', 'jetpack-beta' ),
				self::update_action_url( $dev_branch, $dev_section )
			);
		}

		if ( $should_update_dev_to_master ) {
			self::update_card(
				__( 'Feature Branch was merged', 'jetpack-beta' ),
				__( 'Go back to Jetpack\'s Bleeding Edge version.', 'jetpack-beta' ),
				self::update_action_url( 'master', 'master' )
			);
		}
		?>
		</div>
		<?php
	}

	/**
	 * Handles card that notifies when there's an update available on a branch.
	 *
	 * @param string $header - Title of the branch that's ready for update.
	 * @param string $sub_header - Detailed information about the update.
	 * @param string $url - URL where branch can be updated.
	 */
	public static function update_card( $header, $sub_header, $url ) {
		?>
		<div class="dops-foldable-card has-expanded-summary dops-card is-compact">
			<div class="dops-foldable-card__header has-border" >
				<span class="dops-foldable-card__main">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text branch-card-header"><?php echo esc_html( $header ); ?></div>
						<div class="dops-foldable-card__subheader"><?php echo esc_html( $sub_header ); ?></div>
					</div>
				</span>
				<span class="dops-foldable-card__secondary">
					<span class="dops-foldable-card__summary">
						<a
							href="<?php echo esc_url( $url ); ?>"
							class="is-primary jp-form-button activate-branch dops-button is-compact"><?php esc_html_e( 'Update', 'jetpack-beta' ); ?></a>
					</span>
				</span>
			</div>
		</div>
		<?php
	}

	/**
	 * Handles update button for branches
	 *
	 * @param string $branch - Branch that's ready for update.
	 * @param string $section - What kind of branch we're updated (master, rc, pr).
	 */
	public static function update_action_url( $branch, $section ) {
		$query = array(
			'page'          => 'jetpack-beta',
			'update-branch' => $branch,
			'section'       => $section,
			'_nonce'        => wp_create_nonce( 'update_branch' ),
		);

		return Jetpack_Beta::admin_url( '?' . build_query( $query ) );
	}
}
