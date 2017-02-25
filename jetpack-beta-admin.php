<?php

/**
 * Class Jetpack_Beta_Admin
 */
class Jetpack_Beta_Admin {

	function __construct() {
		add_action( 'admin_menu', array( $this, 'add_actions' ), 998 );
	}

	function add_actions() {
		$hook = $this->get_page_hook();
		// Attach hooks common to all Jetpack admin pages based on the created
		add_action( "load-$hook", array( $this, 'admin_page_load' ) );
		add_action( "admin_print_styles-$hook", array( $this, 'admin_styles' ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'admin_scripts' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( 'jetpack-beta/jetpack-beta.php' ), array( $this, 'admin_plugin_settings_link' ) );
	}

	function get_page_hook() {
		if ( class_exists( 'Jetpack' ) ) {
			return add_submenu_page(
				'jetpack',
				'Jetpack Beta',
				'Jetpack Beta',
				'update_plugins',
				'jetpack-beta',
				array( $this, 'render' )
			);
		}

		return add_menu_page(
			'Jetpack Beta',
			'Jetpack Beta',
			'update_plugins',
			'jetpack-beta',
			array( $this, 'render' )
		);
	}
	
	function settings_link() {
		return admin_url( 'admin.php?page=jetpack-beta' );
	}
	
	function admin_plugin_settings_link( $links ) {
		$settings_link = '<a href="'. esc_url( $this->settings_link() ) . '">' . __('Settings', 'jetpack-beta' ) . '</a>';
		array_unshift( $links, $settings_link );
		return $links;
	}

	function admin_page_load() {
		// Let set the defauls...

		if ( ! isset( $_GET['_nonce'] ) ) {
			return;
		}

		if ( wp_verify_nonce( $_GET['_nonce'], 'activate_branch' ) && isset( $_GET['activate-branch'] ) && isset( $_GET['section'] ) ) {
			$branch  = esc_html( $_GET['activate-branch'] );
			$section = esc_html( $_GET['section'] );

			if ( get_option( 'jetpack_dev_currently_installed' ) !== array( $branch, $section ) ) {
				Jetpack_Beta::proceed_to_install( $this->get_install_url( $branch, $section ), $this->get_folder( $section ), $section );
			}
			
			update_option( 'jetpack_dev_currently_installed', array( $branch, $section ) );
			wp_safe_redirect( admin_url( 'admin.php?page=jetpack-beta' ) );
		}
	}

	function get_folder( $section ) {
		if ( 'stable' === $section ) {
			return 'jetpack';
		}

		return 'jetpack-dev';
	}

	function get_jetpack_plugin_version() {
		$info = $this->get_jetpack_plugin_info();

		return $info['Version'];
	}

	function get_jetpack_plugin_info() {
		return get_plugin_data( WP_PLUGIN_DIR . '/' . Jetpack_Beta::get_plugin_file() );
	}

	function get_install_url( $branch_string, $section ) {

		if ( 'stable' === $section ) {
			$org_data = Jetpack_Beta::get_org_data();

			return $org_data->download_link;
		}

		$manifest = Jetpack_Beta::get_beta_manifest();

		if ( 'master' === $section && isset( $manifest->{$section}->download_url ) ) {
			return $manifest->{$section}->download_url;
		}


		if ( isset( $manifest->{$section}->{$branch_string}->download_url ) ) {
			return $manifest->{$section}->{$branch_string}->download_url;
		}

		return null;
	}

	function admin_styles() {
		wp_enqueue_style( 'jetpack-beta-admin', plugins_url( "admin/admin.css", JPBETA__PLUGIN_FILE ), array(), JPBETA_VERSION . '-' . time() );
	}

	function admin_scripts() {
		wp_enqueue_script( 'jetpack-admin-js', plugins_url( 'admin/admin.js', JPBETA__PLUGIN_FILE ), array( 'jquery' ), JPBETA_VERSION );
		wp_localize_script( 'jetpack-admin-js', 'JetpackBeta',
			array(
				'activating' => __( 'Activating...', 'jetpack-beta' ),
				'leaving'    => __( 'Don\'t Go Plugin is still installing!', 'jetpack-beta' ),
			)
		);
	}

	function to_test_content() {
		$currently_installed = get_option( 'jetpack_dev_currently_installed', false );
		if ( ! is_array( $currently_installed ) ) {
			return;
		}

		list( $branch, $section ) = $currently_installed;

		switch ( $section ) {
			case 'pr':
				return $this->to_test_pr_content( $branch );
				break;
			case 'master':
			case 'rc':
				return $this->to_test_file_content();
				break;
		}
	}

	function to_test_file_content() {
		$test_file = WP_PLUGIN_DIR . '/' . Jetpack_Beta::get_plugin_slug() . '/to-test.md';
		if ( ! file_exists( $test_file ) ) {
			return;
		}
		$content = file_get_contents( $test_file );
		return $this->render_markdown( $content );
	}

	function to_test_pr_content( $branch_key ) {
		$manifest = Jetpack_Beta::get_beta_manifest();
		$pr =  isset( $manifest->pr->{$branch_key}->pr ) ? $manifest->pr->{$branch_key}->pr : null;

		if ( ! $pr ) {
			return null;
		}
		$github_info = Jetpack_Beta::get_remote_data( JETPACK_GITHUB_API_URL . 'pulls/' . $pr, 'github_' . $pr );
		return $this->render_markdown( $github_info->body );
	}

	function render_markdown( $content ) {

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

		return apply_filters( 'jetpack_beta_test_content', $rendered_html );

	}

	function show_branch( $header, $branch_key, $branch = null, $section = null, $is_last = false ) {

		if ( ! is_object( $branch ) ) {
			$manifest = Jetpack_Beta::get_beta_manifest();
			$branch   = $manifest->{$section};
		}

		$is_compact = $is_last ? '' : 'is-compact';
		$more_info  = '';
		$pr         = '';
		if ( isset( $branch->pr ) && is_int( $branch->pr ) ) {
			$pr        = sprintf( 'data-pr="%s"', esc_attr( $branch->pr ) );
			$more_info = sprintf( __( '<a href="https://github.com/Automattic/jetpack/pull/%s">more info</a> - ' ), $branch->pr );
		}

		$update_time = ( isset( $branch->update_date )
			? sprintf( __( 'last updated %s ago' ), human_time_diff( strtotime( $branch->update_date ) ) )
			: ''
		);

		$branch_class    = 'branch-card';
		$current_version = get_option( 'jetpack_dev_currently_installed', array() );
		if ( isset( $current_version[0], $current_version[1] ) ) {
			list( $current_branch, $current_section ) = $current_version;
			if ( $current_branch === $branch_key && $current_section === $section ) {
				$action       = __( 'Active', 'jetpack-beta' );
				$branch_class = 'branch-card-active';
			} else {
				$action = $this->activate_button( $branch_key, $section );
			}
		} else {
			$action = $this->activate_button( $branch_key, $section );
		}
		$header = str_replace( '-', ' ', $header );
		$header = str_replace( '_', ' / ', $header );
		?>
		<div <?php echo $pr; ?> " class="dops-foldable-card <?php echo esc_attr( $branch_class ); ?> has-expanded-summary dops-card <?php echo $is_compact; ?>">
		<div class="dops-foldable-card__header has-border" data-reactid=".0.0.1.2.1.1:$module-card_markdown.1:0">
				<span class="dops-foldable-card__main" data-reactid=".0.0.1.2.1.1:$module-card_markdown.1:0.0">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text branch-card-header"><?php echo $header; ?></div>
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

	function activate_button( $branch, $section ) {
		if ( is_object( $section ) ) {
			$section = 'master';
		}
		$query = array(
			'page'            => 'jetpack-beta',
			'activate-branch' => $branch,
			'section'         => $section,
			'_nonce'          => wp_create_nonce( 'activate_branch' ),
		);
		$url   = admin_url( 'admin.php?' . build_query( $query ) );

		return '<a 
				href="' . esc_url( $url ) . '" 
				class="is-primary jp-form-button activate-branch dops-button is-compact" >' . __( 'Activate', 'jetpack-beta' ) . '</a>';
	}

	function header( $title ) {
		echo '<header><h2 class="jp-jetpack-connect__container-subtitle">' . $title . '</h2></header>';
	}

	function show_branches( $section, $title = null ) {

		if ( $title ) {
			$title .= ': ';
		}
		echo '<div id="section-' . esc_attr( $section ) . '">';

		$manifest = Jetpack_Beta::get_beta_manifest();
		$count    = 0;

		$branches  = (array) $manifest->{$section};
		$count_all = count( $branches );

		foreach ( $branches as $branch_name => $branch ) {
			$count ++;
			$is_last = $count_all === $count ? true : false;
			$this->show_branch( $title . $branch_name, $branch_name, $branch, $section, $is_last );
		}
		echo '</div>';
	}

	function stable_branch() {
		$org_data = Jetpack_Beta::get_org_data();

		$this->show_branch( __( 'Latest Stable' ), 'stable', (object) array( 'branch'      => 'stable',
		                                                           'update_date' => $org_data->last_updated
		), 'stable' );
	}

	function render() {
		require_once JPBETA__PLUGIN_DIR . 'admin/main.php';
	}

	function render_search() { ?>
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
