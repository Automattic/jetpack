<?php
/**
 * No-JS and unsupported WP versions view.
 *
 * Renders the module list table where you can use bulk action or row
 * actions to activate/deactivate and configure modules
 */

/** This action is already documented in views/admin/admin-page.php */
do_action( 'jetpack_notices' );

include_once( JETPACK__PLUGIN_DIR . 'class.jetpack-modules-list-table.php' );
$list_table = new Jetpack_Modules_List_Table;

if ( wp_version_too_old() ) {
	echo 'Update WordPress to unlock Jetpack\'s full potential!';
}

if ( maybe_load_old_jetpack_config_page() ) {
	return;
}
?>
	<noscript>
		<div id="message" class="jetpack-message jetpack-err">
			<div class="squeezer">
				<h2><?php esc_html_e( 'You have JavaScript disabled', 'jetpack' ); ?></h2>
				<p><?php esc_html_e( "Turn on JavaScript to unlock Jetpack's full potential!", 'jetpack' ); ?></p>
			</div>
		</div>
	</noscript>
	<div class="page-content configure">
		<div class="frame bottom">
			<div class="wrap">
				<div class="manage-left">
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

function maybe_load_old_jetpack_config_page() {
	$configure = empty( $_GET['configure'] ) ? 'all' : $_GET['configure'];
	$module_name = preg_replace( '/[^\da-z\-]+/', '', $configure );
	if ( Jetpack::is_module( $module_name ) && current_user_can( 'jetpack_configure_modules' ) ) {
		Jetpack::admin_screen_configure_module( $module_name );
		return true;
	}

	return false;
}
