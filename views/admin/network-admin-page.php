<?php
$list_table = new Jetpack_Network_Sites_List_Table();
$list_table->prepare_items();
?>
		<div class="clouds-sm"></div>

		<?php Jetpack::init()->load_view( 'admin/network-activated-notice.php' ); ?>

		<?php do_action( 'jetpack_notices' ); ?>

		<div class="page-content configure">
			<div class="frame top hide-if-no-js">
				<div class="wrap">
					<table class="table table-bordered fixed-top">
						<thead>
							<tr>
								<th class="check-column"><input type="checkbox" class="checkall"></th>
								<th colspan="2">
									<?php $list_table->display_tablenav( 'top' ); ?>
									<span class="filter-search">
										<button type="button" class="button">Filter</button>
									</span>
								</th>
							</tr>
						</thead>
					</table>
				</div><!-- /.wrap -->
			</div><!-- /.frame -->
			<div class="frame bottom">
				<div class="wrap">
					<form class="jetpack-modules-list-table-form" onsubmit="return false;">
						<table class="<?php echo implode( ' ', $list_table->get_table_classes() ); ?>">
							<thead>
								<tr>
									<?php $list_table->print_column_headers(); ?>
								</tr>
							</thead>

							<tbody id="the-list">
								<?php $list_table->display_rows_or_placeholder(); ?>
							</tbody>

							<tfoot>
								<tr>
									<?php $list_table->print_column_headers( false ); ?>
								</tr>
							</tfoot>
						</table>
					</form>
				</div><!-- /.wrap -->
			</div><!-- /.frame -->
		</div><!-- /.content -->
