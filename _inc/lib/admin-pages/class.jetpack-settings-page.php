<?php
include_once( 'class.jetpack-admin-page.php' );
include_once( JETPACK__PLUGIN_DIR . 'class.jetpack-modules-list-table.php' );

// Builds the settings page and its menu
class Jetpack_Settings_Page extends Jetpack_Admin_Page {

	// Show the settings page only when Jetpack is connected or in dev mode
	protected $dont_show_if_not_active = true;

	function add_page_actions( $hook ) {} // There are no page specific actions to attach to the menu

	// Adds the Settings sub menu
	function get_page_hook() {
		return add_submenu_page( null, __( 'Jetpack Settings', 'jetpack' ), __( 'Settings', 'jetpack' ), 'jetpack_manage_modules', 'jetpack_modules', array( $this, 'render' ) );
	}

	// Renders the module list table where you can use bulk action or row
	// actions to activate/deactivate and configure modules
	function page_render() {
		$list_table = new Jetpack_Modules_List_Table;

		$static_html = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static.html' );

		// If static.html isn't there, there's nothing else we can do.
		if ( false === $static_html ) {
			esc_html_e( 'Error fetching static.html.', 'jetpack' );
			return;
		}

		// We have static.html so let's continue trying to fetch the others
		$noscript_notice = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static-noscript-notice.html' );
		$version_notice = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static-version-notice.html' );
		$ie_notice = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static-ie-notice.html' );

		$noscript_notice = str_replace(
			'#HEADER_TEXT#',
			esc_html( __( 'You have JavaScript disabled', 'jetpack' ) ),
			$noscript_notice
		);
		$noscript_notice = str_replace(
			'#TEXT#',
			esc_html( __( "Turn on JavaScript to unlock Jetpack's full potential!", 'jetpack' ) ),
			$noscript_notice
		);

		$version_notice = str_replace(
			'#HEADER_TEXT#',
			esc_html( __( 'You are using an outdated version of WordPress', 'jetpack' ) ),
			$version_notice
		);
		$version_notice = str_replace(
			'#TEXT#',
			esc_html( __( "Update WordPress to unlock Jetpack's full potential!", 'jetpack' ) ),
			$version_notice
		);

		$ie_notice = str_replace(
			'#HEADER_TEXT#',
			esc_html( __( 'You are using an unsupported browser version.', 'jetpack' ) ),
			$ie_notice
		);
		$ie_notice = str_replace(
			'#TEXT#',
			esc_html( __( "Update your browser to unlock Jetpack's full potential!", 'jetpack' ) ),
			$ie_notice
		);

		ob_start();

		$this->admin_page_top();

		if ( $this->is_wp_version_too_old() ) {
			echo $version_notice;
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

		$this->admin_page_bottom();

		$page_content = ob_get_contents();
		ob_end_clean();

		echo str_replace(
			'<div class="jp-loading-placeholder"><span class="dashicons dashicons-wordpress-alt"></span></div>',
			$page_content,
			$static_html
		);

		JetpackTracking::record_user_event( 'page_view', array( 'path' => 'wpa_old_settings' ) );
	}

	/**
	 * Load styles for static page.
	 *
	 * @since 4.3.0
	 */
	function additional_styles() {
		$rtl = is_rtl() ? '.rtl' : '';
		wp_enqueue_style( 'dops-css', plugins_url( "_inc/build/admin.dops-style$rtl.css", JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );
		wp_enqueue_style( 'components-css', plugins_url( "_inc/build/style.min$rtl.css", JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );
	}

	// Javascript logic specific to the list table
	function page_admin_scripts() {
		wp_enqueue_script( 'jetpack-admin-js', plugins_url( '_inc/jetpack-admin.js', JETPACK__PLUGIN_FILE ), array( 'jquery' ), JETPACK__VERSION );
	}
}
