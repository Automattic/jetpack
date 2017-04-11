<?php

/**
 * Class Jetpack_Beta_Admin
 */
class Jetpack_Beta_Admin {

	static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_actions' ), 998 );
		add_action( 'network_admin_menu', array( __CLASS__, 'add_actions' ), 998 );
		add_action( 'admin_notices', array( __CLASS__, 'render_banner' ) );
	}

	static function add_actions() {
		$hook = self::get_page_hook();
		// Attach hooks common to all Jetpack admin pages based on the created
		add_action( "load-$hook", array( __CLASS__, 'admin_page_load' ) );
		add_action( "admin_print_styles-$hook", array( __CLASS__, 'admin_styles' ) );
		add_action( "admin_print_scripts-$hook", array( __CLASS__, 'admin_scripts' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( 'jetpack-beta/jetpack-beta.php' ), array( __CLASS__, 'admin_plugin_settings_link' ) );
	}

	static function get_page_hook() {
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
	
	static function settings_link() {
		return admin_url( 'admin.php?page=jetpack-beta' );
	}
	
	static function admin_plugin_settings_link( $links ) {
		$settings_link = '<a href="'. esc_url( self::settings_link() ) . '">' . __( 'Settings', 'jetpack-beta' ) . '</a>';
		array_unshift( $links, $settings_link );
		return $links;
	}

	static function admin_page_load() {
		if ( ! isset( $_GET['_nonce'] ) ) {
			return;
		}

		if ( wp_verify_nonce( $_GET['_nonce'], 'activate_branch' ) && isset( $_GET['activate-branch'] ) && isset( $_GET['section'] ) ) {
			$branch  = esc_html( $_GET['activate-branch'] );
			$section = esc_html( $_GET['section'] );

			if ( Jetpack_Beta::get_branch_and_section() !== array( $branch, $section ) ) {
				Jetpack_Beta::proceed_to_install( Jetpack_Beta::get_install_url( $branch, $section ), Jetpack_Beta::get_plugin_slug( $section ), $section );
			}
			
			update_option( Jetpack_Beta::$option, array( $branch, $section ) );
			wp_safe_redirect( Jetpack_Beta::admin_url() );
		}
	}

	static function render_banner() {
		global $current_screen;

		if ( 'plugins' !== $current_screen->base ) {
			return;
		}

		if ( Jetpack_Beta::get_option() ) {
			return;
		}

		self::start_notice();
	}
	
	static function admin_styles() {
		wp_enqueue_style( 'jetpack-beta-admin', plugins_url( "admin/admin.css", JPBETA__PLUGIN_FILE ), array(), JPBETA_VERSION . '-' . time() );
	}

	static function admin_scripts() {
		wp_enqueue_script( 'jetpack-admin-js', plugins_url( 'admin/admin.js', JPBETA__PLUGIN_FILE ), array( ), JPBETA_VERSION, true );
		wp_localize_script( 'jetpack-admin-js', 'JetpackBeta',
			array(
				'activating' => __( 'Activating...', 'jetpack-beta' ),
				'leaving'    => __( 'Don\'t Go Plugin is still installing!', 'jetpack-beta' ),
			)
		);
	}

	static function to_test_content() {
		list( $branch, $section ) = Jetpack_Beta::get_branch_and_section();
		switch ( $section ) {
			case 'pr':
				return self::to_test_pr_content( $branch );
				break;
			case 'master':
			case 'rc':
				return self::to_test_file_content();
				break;
		}
		return null;
	}

	static function to_test_file_content() {
		$test_file = WP_PLUGIN_DIR . '/' . Jetpack_Beta::get_plugin_slug() . '/to-test.md';
		if ( ! file_exists( $test_file ) ) {
			return;
		}
		$content = file_get_contents( $test_file );
		return self::render_markdown( $content );
	}

	static function to_test_pr_content( $branch_key ) {
		$manifest = Jetpack_Beta::get_beta_manifest();
		$pr =  isset( $manifest->pr->{$branch_key}->pr ) ? $manifest->pr->{$branch_key}->pr : null;

		if ( ! $pr ) {
			return null;
		}
		$github_info = Jetpack_Beta::get_remote_data( JETPACK_GITHUB_API_URL . 'pulls/' . $pr, 'github_' . $pr );

		return self::render_markdown( $github_info->body );
	}

	static function render_markdown( $content ) {

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
			require_once( WP_PLUGIN_DIR . '/' . Jetpack_Beta::get_plugin_slug() . '/modules/markdown/easy-markdown.php' );
		}
		$rendered_html = WPCom_Markdown::get_instance()->transform( $content, array(
			'id'      => false,
			'unslash' => false
		) );

		$rendered_html = apply_filters( 'jetpack_beta_test_content', $rendered_html );

		// Lets convert #hash numbers into links to issues.
		$rendered_html = preg_replace('/\#([0-9]+)/', '<a href="https://github.com/Automattic/jetpack/issues/$1">#$1</a>', $rendered_html );

		return $rendered_html;
	}

	static function start_notice() {
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
			<h1>Welcome to Jetpack Beta Tester</h1>
			<p>It works a bit differently. Jetpack Beta Tester helps you run 2 different version of Jetpack on your site.
				A <em>stable</em> and a <em>development</em> version (a version that still needs more testing)</p>
			<p>When you activate a version, Jetpack Beta Tester will install and activate it on your behalf and keep it up to date.
			When you are done testing it will should be easy to switch back to the stable version. Just deactivate the Jetpack beta plugin or select the <em>Latest Stable</em>.</p>

			<?php if ( $is_notice ) { ?>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack-beta' ) ); ?>">Lets get started and choose a version to test!</a>
			<?php } ?>

		</div>
		<?php
	}

	static function show_branch( $header, $branch_key, $branch = null, $section = null, $is_last = false ) {
		if ( ! is_object( $branch ) ) {
			$manifest = Jetpack_Beta::get_beta_manifest();
			if ( empty( $manifest->{$section} ) ) {
				return;
			}
			$branch   = $manifest->{$section};
		}

		$is_compact = $is_last ? '' : 'is-compact';
		$more_info  = '';
		$pr         = '';
		if ( isset( $branch->pr ) && is_int( $branch->pr ) ) {
			$pr        = sprintf( 'data-pr="%s"', esc_attr( $branch->pr ) );
			$more_info = sprintf( __( '<a href="%s">more info</a> - ' ), Jetpack_Beta::get_url( $branch_key, $section ) );
		}

		$update_time = ( isset( $branch->update_date )
			? sprintf( __( 'last updated %s ago' ), human_time_diff( strtotime( $branch->update_date ) ) )
			: ''
		);

		$branch_class    = 'branch-card';
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
		<div <?php echo $pr; ?> " class="dops-foldable-card <?php echo esc_attr( $branch_class ); ?> has-expanded-summary dops-card <?php echo $is_compact; ?>">
			<div class="dops-foldable-card__header has-border" data-reactid=".0.0.1.2.1.1:$module-card_markdown.1:0">
				<span class="dops-foldable-card__main" data-reactid=".0.0.1.2.1.1:$module-card_markdown.1:0.0">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text branch-card-header"><?php echo esc_html( $header ); ?></div>
						<div class="dops-foldable-card__subheader"><?php echo $more_info;
							echo $update_time; ?></div>
					</div>
				</span>
				<span class="dops-foldable-card__secondary">
					<span class="dops-foldable-card__summary">
						<?php echo $action; ?>
					</span>
				</span>
			</div>
		</div>
		<?php
	}

	static function activate_button( $branch, $section ) {
		if ( is_object( $section ) ) {
			$section = 'master';
		}
		$query = array(
			'page'            => 'jetpack-beta',
			'activate-branch' => $branch,
			'section'         => $section,
			'_nonce'          => wp_create_nonce( 'activate_branch' ),
		);
		$url   = Jetpack_Beta::admin_url( '?' . build_query( $query ) );

		return '<a 
				href="' . esc_url( $url ) . '" 
				class="is-primary jp-form-button activate-branch dops-button is-compact" >' . __( 'Activate', 'jetpack-beta' ) . '</a>';
	}

	static function header( $title ) {
		echo '<header><h2 class="jp-jetpack-connect__container-subtitle">' . $title . '</h2></header>';
	}

	static function show_branches( $section, $title = null ) {
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

	static function show_stable_branch() {
		$org_data = Jetpack_Beta::get_org_data();

		self::show_branch(
			__( 'Latest Stable' ),
			'stable',
			(object) array(
				'branch' => 'stable',
		        'update_date' => $org_data->last_updated
			),
			'stable'
		);
	}

	static function render() {
		require_once JPBETA__PLUGIN_DIR . 'admin/main.php';
	}

	static function show_search_prs() {
		$manifest = Jetpack_Beta::get_beta_manifest();
		if ( empty( $manifest->pr ) ) {
			return;
		}
		?>
		<div class="dops-navigation">
			<div class="dops-section-nav has-pinned-items">
				<div class="dops-section-nav__panel">

					<div class="is-pinned is-open dops-search" role="search">
						<div aria-controls="search-component" aria-label="Open Search" tabindex="-1">
							<svg class="gridicon gridicons-search dops-search-open__icon" height="24"
							     viewbox="0 0 24 24" width="24">
								<g>
									<path
										d="M21 19l-5.154-5.154C16.574 12.742 17 11.42 17 10c0-3.866-3.134-7-7-7s-7 3.134-7 7 3.134 7 7 7c1.42 0 2.742-.426 3.846-1.154L19 21l2-2zM5 10c0-2.757 2.243-5 5-5s5 2.243 5 5-2.243 5-5 5-5-2.243-5-5z"></path>
								</g>
							</svg>
						</div>
						<input aria-hidden="false" class="dops-search__input" id="search-component"
						       placeholder="Search for a Jetpack Feature Branches" role="search" type="search" value="">
						<span aria-controls="search-component" id="search-component-close" aria-label="Close Search"
						      tabindex="0">
							<svg class="gridicon gridicons-cross dops-search-close__icon" height="24"
							     viewbox="0 0 24 24" width="24">
								<g>
									<path
										d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path>
								</g>
							</svg>
						</span>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
}
