<?php
/**
 * No-JS and unsupported WP versions view.
 *
 * Renders the module list table where you can use bulk action or row
 * actions to activate/deactivate and configure modules
 */

include_once( JETPACK__PLUGIN_DIR . 'class.jetpack-modules-list-table.php' );
$list_table = new Jetpack_Modules_List_Table;
?>
<?php /** This action is already documented in views/admin/admin-page.php */
do_action( 'jetpack_notices' ) ?>
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
			<div class="manage-right">
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

