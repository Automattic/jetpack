<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Tracking;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/class.jetpack-admin-page.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-modules-list-table.php';

/**
 * Builds the settings page and its menu
 */
class Jetpack_Settings_Page extends Jetpack_Admin_Page {

	/**
	 * Show the settings page only when Jetpack is connected or in dev mode.
	 *
	 * @var boolean
	 */
	protected $dont_show_if_not_active = true;

	/**
	 * Add page action.
	 *
	 * @param string $hook Hook of current page.
	 * @return void
	 */
	public function add_page_actions( $hook ) {} //phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

	/**
	 * Adds the Settings sub menu.
	 */
	public function get_page_hook() {
		return add_submenu_page(
			'',
			__( 'Jetpack Settings', 'jetpack' ),
			__( 'Settings', 'jetpack' ),
			'jetpack_manage_modules',
			'jetpack_modules',
			array( $this, 'render' )
		);
	}

	/**
	 * Renders the module list table where you can use bulk action or row
	 * actions to activate/deactivate and configure modules
	 */
	public function page_render() {
		$list_table = new Jetpack_Modules_List_Table();

		// We have static.html so let's continue trying to fetch the others.
		$noscript_notice = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static-noscript-notice.html' ); //phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, Not fetching a remote file.
		$rest_api_notice = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static-version-notice.html' ); //phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, Not fetching a remote file.

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

		if ( ! $this->is_rest_api_enabled() ) {
			echo $rest_api_notice; //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
		echo $noscript_notice; //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		?>

		<div class="jetpack-module-list">
			<div class="wrap">
				<div class="manage-left jp-static-block">
					<table class="table table-bordered fixed-top jetpack-modules">
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
					<form class="jetpack-modules-list-table-form" onsubmit="return false;">
						<table class="<?php echo esc_attr( implode( ' ', $list_table->get_table_classes() ) ); ?>">
							<tbody id="the-list">
							<?php $list_table->display_rows_or_placeholder(); ?>
							</tbody>
						</table>
					</form>
				</div>
				<div class="manage-right">
					<div class="bumper">
						<form class="navbar-form" role="search">
							<input type="hidden" name="page" value="jetpack_modules" />
							<?php $list_table->search_box( __( 'Search', 'jetpack' ), 'srch-term' ); ?>
							<p><?php esc_html_e( 'View', 'jetpack' ); ?></p>
							<span class="dops-button-group button-group filter-active">
								<button type="button" class="dops-button is-compact button
								<?php // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is view logic.
								if ( empty( $_GET['activated'] ) ) {
									echo 'active';
								}
								?>
									">
								<?php esc_html_e( 'All', 'jetpack' ); ?></button>
								<button type="button" class="dops-button button
								<?php // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is view logic.
								if ( ! empty( $_GET['activated'] ) && 'true' === $_GET['activated'] ) {
									echo 'active';
								}
								?>
								" data-filter-by="activated" data-filter-value="true"><?php esc_html_e( 'Active', 'jetpack' ); ?></button>
								<button type="button" class="dops-button button
								<?php // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is view logic.
								if ( ! empty( $_GET['activated'] ) && 'false' === $_GET['activated'] ) {
									echo 'active';
								}
								?>
								" data-filter-by="activated" data-filter-value="false"><?php esc_html_e( 'Inactive', 'jetpack' ); ?></button>
							</span>
							<p><?php esc_html_e( 'Sort by', 'jetpack' ); ?></p>
							<span class="dops-button-group button-group sort">
								<button type="button" class="dops-button button
								<?php // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is view logic.
								if ( empty( $_GET['sort_by'] ) ) {
									echo 'active';
								}
								?>
								" data-sort-by="name"><?php esc_html_e( 'Alphabetical', 'jetpack' ); ?></button>
								<button type="button" class="dops-button button
								<?php // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is view logic.
								if ( ! empty( $_GET['sort_by'] ) && 'introduced' === $_GET['sort_by'] ) {
									echo 'active';
								}
								?>
								" data-sort-by="introduced" data-sort-order="reverse"><?php esc_html_e( 'Newest', 'jetpack' ); ?></button>
								<button type="button" class="dops-button button
								<?php // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is view logic.
								if ( ! empty( $_GET['sort_by'] ) && 'sort' === $_GET['sort_by'] ) {
									echo 'active';
								}
								?>
								" data-sort-by="sort"><?php esc_html_e( 'Popular', 'jetpack' ); ?></button>
							</span>
							<p><?php esc_html_e( 'Show', 'jetpack' ); ?></p>
							<?php $list_table->views(); ?>
						</form>
					</div>
				</div>
			</div>
		</div><!-- /.content -->
		<?php

		$tracking = new Tracking();
		$tracking->record_user_event( 'wpa_page_view', array( 'path' => 'old_settings' ) );
	}

	/**
	 * Load styles for static page.
	 *
	 * @since 4.3.0
	 */
	public function additional_styles() {
		Jetpack_Admin_Page::load_wrapper_styles();
	}

	/**
	 * Javascript logic specific to the list table
	 */
	public function page_admin_scripts() {
		wp_enqueue_script(
			'jetpack-admin-js',
			Assets::get_file_url_for_environment( '_inc/build/jetpack-admin.min.js', '_inc/jetpack-admin.js' ),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);
	}
}
