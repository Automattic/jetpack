<?php
/**
 * No-JS and unsupported WP versions view.
 *
 * Renders the module list table where you can use bulk action or row
 * actions to activate/deactivate and configure modules
 */
include_once( JETPACK__PLUGIN_DIR . '_inc/header.php' ); ?>
<noscript>
	<?php /** This action is already documented in views/admin/admin-page.php */
		do_action( 'jetpack_notices' );
		include_once( JETPACK__PLUGIN_DIR . 'class.jetpack-modules-list-table.php' );
		$list_table = new Jetpack_Modules_List_Table;
	?>
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
</noscript>
<?php include_once( JETPACK__PLUGIN_DIR . '_inc/footer.php' ); ?>

