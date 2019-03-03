<?php
include_once( 'class.jetpack-admin-page.php' );
include_once( JETPACK__PLUGIN_DIR . 'class.jetpack-modules-list-table.php' );

// Builds the settings page and its menu
class Jetpack_Settings_Page extends Jetpack_Admin_Page {

	// Show the settings page only when Jetpack is connected or in dev mode
	protected $dont_show_if_not_active = true;

	function add_page_actions( $hook ) {}

	// Adds the Settings sub menu
	function get_page_hook() {
		return add_submenu_page(
			null,
			__( 'Jetpack Settings', 'jetpack' ),
			__( 'Settings', 'jetpack' ),
			'jetpack_manage_modules',
			'jetpack_modules',
			array( $this, 'render' )
		);
	}

	// Renders the module list table where you can use bulk action or row
	// actions to activate/deactivate and configure modules
	function page_render() {
		$list_table = new Jetpack_Modules_List_Table;

		// We have static.html so let's continue trying to fetch the others
		$noscript_notice = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static-noscript-notice.html' );
		$version_notice = $rest_api_notice = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static-version-notice.html' );
		$ie_notice = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static-ie-notice.html' );

		$noscript_notice = str_replace(
			'#HEADER_TEXT#',
			esc_html__( 'You have JavaScript disabled', 'jetpack' ),
			$noscript_notice
		);
		$noscript_notice = str_replace(
			'#TEXT#',
			esc_html__( "Turn on JavaScript to unlock Jetpack's full potential!", 'jetpack' ),
			$noscript_notice
		);

		$version_notice = str_replace(
			'#HEADER_TEXT#',
			esc_html__( 'You are using an outdated version of WordPress', 'jetpack' ),
			$version_notice
		);
		$version_notice = str_replace(
			'#TEXT#',
			esc_html__( "Update WordPress to unlock Jetpack's full potential!", 'jetpack' ),
			$version_notice
		);

		$rest_api_notice = str_replace(
			'#HEADER_TEXT#',
			esc_html( __( 'WordPress REST API is disabled', 'jetpack' ) ),
			$rest_api_notice
		);
		$rest_api_notice = str_replace(
			'#TEXT#',
			esc_html( __( "Enable WordPress REST API to unlock Jetpack's full potential!", 'jetpack' ) ),
			$rest_api_notice
		);

		$ie_notice = str_replace(
			'#HEADER_TEXT#',
			esc_html__( 'You are using an unsupported browser version.', 'jetpack' ),
			$ie_notice
		);
		$ie_notice = str_replace(
			'#TEXT#',
			esc_html__( "Update your browser to unlock Jetpack's full potential!", 'jetpack' ),
			$ie_notice
		);

		if ( $this->is_wp_version_too_old() ) {
			echo $version_notice;
		}
		if ( ! $this->is_rest_api_enabled() ) {
			echo $rest_api_notice;
		}
		echo $noscript_notice;
		echo $ie_notice;
		?>

		<div class="page-content configure">
			<div class="frame top hide-if-no-js">
				<div class="wrap">
					<div class="manage-left">
						<table class="table table-bordered fixed-top">
							<thead>
								<tr>
									<th class="check-column"><input type="checkbox" class="checkall"></th>
									<th colspan="2">
										<?php $list_table->unprotected_display_tablenav( 'top' ); ?>
										<span class="filter-search">
											<button type="button" class="button">Filter</button>
										</span>
									</th>
								</tr>
							</thead>
						</table>
					</div>
				</div><!-- /.wrap -->
			</div><!-- /.frame -->
			<div class="frame bottom">
				<div class="wrap">
					<div class="manage-right" style="display: none;">
						<div class="bumper">
							<form class="navbar-form" role="search">
								<input type="hidden" name="page" value="jetpack_modules" />
								<?php $list_table->search_box( __( 'Search', 'jetpack' ), 'srch-term' ); ?>
								<p><?php esc_html_e( 'View:', 'jetpack' ); ?></p>
								<div class="button-group filter-active">
									<button type="button" class="button <?php if ( empty( $_GET['activated'] ) ) echo 'active'; ?>"><?php esc_html_e( 'All', 'jetpack' ); ?></button>
									<button type="button" class="button <?php if ( ! empty( $_GET['activated'] ) && 'true' == $_GET['activated'] ) echo 'active'; ?>" data-filter-by="activated" data-filter-value="true"><?php esc_html_e( 'Active', 'jetpack' ); ?></button>
									<button type="button" class="button <?php if ( ! empty( $_GET['activated'] ) && 'false' == $_GET['activated'] ) echo 'active'; ?>" data-filter-by="activated" data-filter-value="false"><?php esc_html_e( 'Inactive', 'jetpack' ); ?></button>
								</div>
								<p><?php esc_html_e( 'Sort by:', 'jetpack' ); ?></p>
								<div class="button-group sort">
									<button type="button" class="button <?php if ( empty( $_GET['sort_by'] ) ) echo 'active'; ?>" data-sort-by="name"><?php esc_html_e( 'Alphabetical', 'jetpack' ); ?></button>
									<button type="button" class="button <?php if ( ! empty( $_GET['sort_by'] ) && 'introduced' == $_GET['sort_by'] ) echo 'active'; ?>" data-sort-by="introduced" data-sort-order="reverse"><?php esc_html_e( 'Newest', 'jetpack' ); ?></button>
									<button type="button" class="button <?php if ( ! empty( $_GET['sort_by'] ) && 'sort' == $_GET['sort_by'] ) echo 'active'; ?>" data-sort-by="sort"><?php esc_html_e( 'Popular', 'jetpack' ); ?></button>
								</div>
								<p><?php esc_html_e( 'Show:', 'jetpack' ); ?></p>
								<?php $list_table->views(); ?>
							</form>
						</div>
					</div>
					<div class="manage-left" style="width: 100%;">
						<form class="jetpack-modules-list-table-form" onsubmit="return false;">
						<table class="<?php echo implode( ' ', $list_table->get_table_classes() ); ?>">
							<tbody id="the-list">
								<?php $list_table->display_rows_or_placeholder(); ?>
							</tbody>
						</table>
						</form>
					</div>
				</div><!-- /.wrap -->
			</div><!-- /.frame -->
		</div><!-- /.content -->
		<?php

		JetpackTracking::record_user_event( 'wpa_page_view', array( 'path' => 'old_settings' ) );
	}

	/**
	 * Load styles for static page.
	 *
	 * @since 4.3.0
	 */
	function additional_styles() {
		Jetpack_Admin_Page::load_wrapper_styles();
	}

	// Javascript logic specific to the list table
	function page_admin_scripts() {
		wp_enqueue_script(
			'jetpack-admin-js',
			Jetpack::get_file_url_for_environment( '_inc/build/jetpack-admin.min.js', '_inc/jetpack-admin.js' ),
			array( 'jquery' ),
			JETPACK__VERSION
		);
	}
}
