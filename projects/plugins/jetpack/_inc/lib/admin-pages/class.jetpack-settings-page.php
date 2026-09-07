<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
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
		/*
		 * In Offline Mode the cloud dashboard and My Jetpack don't initialize, so
		 * surface the Modules page as a visible, first-position item under the
		 * Jetpack top-level menu. This makes the top-level "Jetpack" menu land on
		 * Modules (instead of the first cloud page, e.g. AI) while leaving the
		 * "Settings" item free to point at the real settings dashboard.
		 */
		if ( ( new Status() )->is_offline_mode() ) {
			return Admin_Menu::add_menu(
				__( 'Jetpack Settings', 'jetpack' ),
				__( 'Modules', 'jetpack' ),
				'jetpack_manage_modules',
				'jetpack_modules',
				array( $this, 'render' ),
				1
			);
		}

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

		// Currently selected product group filter (used to highlight the active View button).
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is view logic.
		$current_group = isset( $_GET['product_group'] ) ? sanitize_text_field( wp_unslash( $_GET['product_group'] ) ) : '';

		$is_offline_mode = ( new Status() )->is_offline_mode();
		// Currently selected offline-availability filter (only meaningful in Offline Mode).
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is view logic.
		$current_availability = isset( $_GET['offline_available'] ) ? sanitize_text_field( wp_unslash( $_GET['offline_available'] ) ) : '';

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
			<?php if ( $is_offline_mode ) : ?>
				<div class="wrap">
					<div class="jetpack-offline-notice">
						<p class="jetpack-offline-notice__title"><?php esc_html_e( "You're working in Offline Mode", 'jetpack' ); ?></p>
						<p class="jetpack-offline-notice__text">
							<?php esc_html_e( 'Jetpack is running in Offline Mode, so features that need a connection to WordPress.com are paused for now — this is completely normal for local and development sites. Go ahead and activate or configure any of the modules below that work offline.', 'jetpack' ); ?>
							<a href="<?php echo esc_url( Redirect::get_url( 'jetpack-support-development-mode' ) ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Learn more about Offline Mode.', 'jetpack' ); ?></a>
						</p>
					</div>
				</div>
			<?php endif; ?>
			<div class="wrap">
				<div class="manage-left">
					<div class="jetpack-modules-card">
						<div class="jetpack-modules-card__bulk">
							<label class="jetpack-modules-card__checkall">
								<input type="checkbox" class="checkall" />
								<span><?php esc_html_e( 'Select all', 'jetpack' ); ?></span>
							</label>
							<?php $list_table->unprotected_display_tablenav( 'top' ); ?>
							<span class="filter-search">
								<button type="button" class="button"><?php esc_html_e( 'Filter', 'jetpack' ); ?></button>
							</span>
						</div>
						<form class="jetpack-modules-list-table-form" onsubmit="return false;">
							<table class="<?php echo esc_attr( implode( ' ', $list_table->get_table_classes() ) ); ?> jetpack-modules">
								<tbody id="the-list">
								<?php $list_table->display_rows_or_placeholder(); ?>
								</tbody>
							</table>
						</form>
					</div>
				</div>
				<div class="manage-right">
					<div class="bumper">
						<form class="navbar-form" role="search">
							<input type="hidden" name="page" value="jetpack_modules" />
							<?php $list_table->search_box( __( 'Search modules…', 'jetpack' ), 'srch-term' ); ?>
							<?php if ( $is_offline_mode ) : ?>
								<p><?php esc_html_e( 'Available in offline mode', 'jetpack' ); ?></p>
								<span class="dops-button-group button-group availability-filter">
									<button type="button" class="dops-button is-compact button
									<?php echo 'all' === $current_availability ? 'active' : ''; ?>
										" data-availability="all"><?php esc_html_e( 'All', 'jetpack' ); ?></button>
									<button type="button" class="dops-button button
									<?php echo 'all' === $current_availability ? '' : 'active'; ?>
									" data-availability="hide-unavailable"><?php esc_html_e( 'Hide unavailable', 'jetpack' ); ?></button>
								</span>
							<?php endif; ?>
							<p><?php esc_html_e( 'State', 'jetpack' ); ?></p>
							<span class="dops-button-group button-group module-filter filter-state">
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
							<p><?php esc_html_e( 'Purpose', 'jetpack' ); ?></p>
							<ul class="purpose-filter">
								<li class="all<?php echo '' === $current_group ? ' current' : ''; ?>"><a href="#" data-group=""><?php esc_html_e( 'All', 'jetpack' ); ?></a> <span class="count"></span></li>
								<?php
								foreach ( Jetpack_Modules_List_Table::PRODUCT_GROUP_ORDER as $group_slug ) {
									printf(
										'<li class="%1$s%2$s"><a href="#" data-group="%1$s">%3$s</a> <span class="count"></span></li>',
										esc_attr( $group_slug ),
										$group_slug === $current_group ? ' current' : '',
										esc_html( Jetpack_Modules_List_Table::get_product_group_name( $group_slug ) )
									);
								}
								?>
							</ul>
							<p><?php esc_html_e( 'Tags', 'jetpack' ); ?></p>
							<?php $list_table->views(); ?>
						</form>
					</div>
				</div>
			</div>
		</div><!-- /.jetpack-module-list -->
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
