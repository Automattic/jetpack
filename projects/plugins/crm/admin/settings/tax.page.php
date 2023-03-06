<?php
/*
!
 * Admin Page: Settings: Tax settings
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $wpdb, $zbs;  // } Req

$confirmAct = false;
$taxTables  = zeroBSCRM_getTaxTableArr();

// } Act on any edits!
if ( isset( $_POST['editzbstax'] ) ) {

	// check nonce
	check_admin_referer( 'jpcrm-update-settings-tax' );

	// this stores a quick index; every ID not present will get culled after this.
	$new_tax_table_ids = array();

	if ( isset( $_POST['jpcrm-taxtable-line'] ) ) {

		// get unsanitised tax rate data
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- POST data is sanitized / defined when used below
		$raw_submitted_rates = wp_unslash( $_POST['jpcrm-taxtable-line'] );

		if ( empty( $raw_submitted_rates['ids'] ) || ! is_array( $raw_submitted_rates['ids'] ) ) {
			return;
		}

		// max out at 128 tax rates for now
		$max_tax_rates = min( count( $raw_submitted_rates['ids'] ), 128 );

		for ( $i = 0; $i < $max_tax_rates; $i++ ) {

			if (
				! isset( $raw_submitted_rates['ids'][ $i ] )
				|| ! isset( $raw_submitted_rates['names'][ $i ] )
				|| ! isset( $raw_submitted_rates['rates'][ $i ] )
			) {
				continue;
			}

			$potential_rate_id = (int) $raw_submitted_rates['ids'][ $i ];

			$new_tax_table_ids[] = $potential_rate_id;

			$added_rate_id = zeroBSCRM_taxRates_addUpdateTaxRate(
				array(

					'id'   => $potential_rate_id,
					'data' => array(
						'name' => sanitize_text_field( $raw_submitted_rates['names'][ $i ] ),
						'rate' => (float) $raw_submitted_rates['rates'][ $i ],
					),
				)
			);

			if ( $potential_rate_id === -1 && $added_rate_id > 0 ) {
				$new_tax_table_ids[] = $added_rate_id;
			}
		}
	}

	// cull all those IDs not found in post
	foreach ( $taxTables as $rate ) {
		if ( ! in_array( $rate['id'], $new_tax_table_ids ) ) {
			zeroBSCRM_taxRates_deleteTaxRate( array( 'id' => $rate['id'] ) );
		}
	}

	// Reload most recent tax rate table
	$taxTables = zeroBSCRM_getTaxTableArr();

	$sbupdated = true;

}

// Debug echo '<pre>'.print_r($taxTables,1).'</pre>';

?><p id="sbDesc"><?php esc_html_e( 'On this page you can set up different tax rates to use throughout your CRM (e.g. in invoices).', 'zero-bs-crm' ); ?></p>

<?php
if ( isset( $sbupdated ) ) {
	if ( $sbupdated ) {
		echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">';
		zeroBSCRM_html_msg( 0, __( 'Settings Updated', 'zero-bs-crm' ) );
		echo '</div><br>'; }
}
?>

<div id="sbA">

	<form method="post">
		<input type="hidden" name="editzbstax" id="editzbstax" value="1" />
		<?php
		// add nonce
		wp_nonce_field( 'jpcrm-update-settings-tax' );
		?>

		<table class="table table-bordered table-striped wtab" id="zbs-taxtable-table">

			<thead>

			<tr>
				<th colspan="3" class="wmid"><button type="button" class="ui icon button zbs-taxtable-add-rate right floated" title="<?php esc_html_e( 'Add Rate', 'zero-bs-crm' ); ?>"><i class="plus icon"></i></button><?php esc_html_e( 'Tax Rates', 'zero-bs-crm' ); ?>:</th>
			</tr>

			<tr>
				<th><?php esc_html_e( 'Name', 'zero-bs-crm' ); ?>:</th>
				<th><?php esc_html_e( 'Rate', 'zero-bs-crm' ); ?>:</th>
				<th></th>
			</tr>

			</thead>

			<tbody>

			<tr id="zbs-taxtable-loader">
				<td colspan="3" class="wmid"><div class="ui padded segment loading borderless" id="zbs-taxtables-loader">&nbsp;</div></td>
			</tr>

			</tbody>
		</table>
		<table class="table" id="zbsNoTaxRateResults"
		<?php
		if ( ! is_array( $taxTables ) || count( $taxTables ) == 0 ) {
			echo '';
		} else {
			echo ' style="display:none"';
		}
		?>
		>
			<tbody>
			<tr>
				<td class="wmid">
					<div class="ui info icon message">
						<div class="content">
							<div class="header"><?php esc_html_e( 'No Tax Rates', 'zero-bs-crm' ); ?></div>
							<p>
								<?php
									echo sprintf(
										wp_kses(
											/* Translators: placeholder is an anchor, which gets changed via Javascript elsewhere to create new tax rate entry fields. */
											__(
												'There are no tax rates defined yet. Do you want to <a href="%s" id="zbs-new-add-tax-rate">create one</a>?',
												'zero-bs-crm'
											),
											$zbs->acceptable_restricted_html
										),
										'#'
									);
									?>
							</p>
						</div>
					</div>
				</td>
			</tr>

			</tbody>
		</table>
		
		<table class="table table-bordered table-striped wtab">
			<tbody>

			<tr>
				<td class="wmid"><button type="submit" class="ui button primary"><?php esc_html_e( 'Save Settings', 'zero-bs-crm' ); ?></button></td>
			</tr>

			</tbody>
		</table>

	</form>


	<script type="text/javascript">

		var zeroBSCRMJS_taxTable = <?php echo json_encode( $taxTables ); ?>;
		var zeroBSCRMJS_taxTableLang = {

			defaultTaxName: '<?php echo esc_html( zeroBSCRM_slashOut( __( 'Tax Rate Name', 'zero-bs-crm' ) ) ); ?>',
			defaultTaxPerc: '<?php echo esc_html( zeroBSCRM_slashOut( __( 'Tax Rate %', 'zero-bs-crm' ) ) ); ?>',
			percSymbol: '<?php echo esc_html( zeroBSCRM_slashOut( __( '%', 'zero-bs-crm' ) ) ); ?>',

		};

		jQuery(function(){

			// anything to build?
			if (window.zeroBSCRMJS_taxTable.length > 0)
				jQuery.each(window.zeroBSCRMJS_taxTable,function(ind,ele){

					zeroBSCRMJS_taxTables_addLine(ele);

				});

			// remove loader
			jQuery('#zbs-taxtable-loader').remove();

			// bind what's here
			zeroBSCRMJS_bind_taxTables();

		});

		function zeroBSCRMJS_bind_taxTables(){

			jQuery('#zbs-new-add-tax-rate').off('click').on( 'click', function(){

				// add a line
				zeroBSCRMJS_taxTables_addLine();

				// hide msg
				jQuery('#zbsNoTaxRateResults').hide();

			});


			jQuery('.zbs-taxtable-add-rate').off('click').on( 'click', function(){

				// add a new line
				zeroBSCRMJS_taxTables_addLine();

			});

			jQuery('.zbs-taxtable-remove-rate').off('click').on( 'click', function(){

				var that = this;

				swal({
					title: '<?php echo esc_html( zeroBSCRM_slashOut( __( 'Are you sure?', 'zero-bs-crm' ) ) ); ?>',
					text: '<?php echo esc_html( zeroBSCRM_slashOut( __( 'Are you sure you want to delete this tax rate? This will remove it from your database and existing transactions with this tax rate will not show properly. You cannot undo this.', 'zero-bs-crm' ) ) ); ?>',
					type: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#3085d6',
					cancelButtonColor: '#d33',
					confirmButtonText: '<?php echo esc_html( zeroBSCRM_slashOut( __( 'Yes, remove the tax rate.', 'zero-bs-crm' ) ) ); ?>',
				})//.then((result) => {
					.then(function (result) {
						if (typeof result.value != "undefined" && result.value) {

							var thisThat = that;

							// brutal.
							jQuery(thisThat).closest('.zbs-taxtable-line').remove();

						}
					});

			});

			// numbersOnly etc.
			zbscrm_JS_bindFieldValidators();
		}

		function zeroBSCRMJS_taxTables_addLine(line){

			// gen the html
			var html = zeroBSCRMJS_taxTables_genLine(line);

			// append to table
			jQuery('#zbs-taxtable-table tbody').append(html);

			// rebind
			zeroBSCRMJS_bind_taxTables();

		}

		function zeroBSCRMJS_taxTables_genLine(line){

			var i = jQuery('.zbs-taxtable-line').length + 1;
			var namestr = '', rateval = '', thisID = -1;
			if (typeof line != "undefined" && typeof line.id != "undefined") thisID = line.id;
			if (typeof line != "undefined" && typeof line.name != "undefined") namestr = line.name;
			if (typeof line != "undefined" && typeof line.rate != "undefined") rateval = line.rate;
	
			var html = '';

			html += '<tr class="zbs-taxtable-line">';
			html += '<td>';
			html += '<input type="hidden" name="jpcrm-taxtable-line[ids][]" value="' + jpcrm.esc_attr( thisID ) + '" />';
			html += '<div class="ui fluid input"><input type="text" class="winput form-control" name="jpcrm-taxtable-line[names][]" value="' + jpcrm.esc_attr( namestr ) + '" placeholder="' + jpcrm.esc_attr( window.zeroBSCRMJS_taxTableLang.defaultTaxName ) + '" /></div>';
			html += '</td>';
			html += '<td>';
			html += '<div class="ui right labeled input">';
			html += '<input type="text" class="winput form-control numbersOnly zbs-dc" name="jpcrm-taxtable-line[rates][]" value="' + jpcrm.esc_attr( rateval ) + '" placeholder="' + jpcrm.esc_attr( window.zeroBSCRMJS_taxTableLang.defaultTaxPerc ) + '"  />';
			html += '<div class="ui basic label">' + jpcrm.esc_html( window.zeroBSCRMJS_taxTableLang.percSymbol ) + '</div></div>';
			html += '</td>';
			html += '<td class="wmid">';
			html += '<button type="button" class="ui icon button zbs-taxtable-remove-rate"><i class="close icon"></i></button>';
			html += '</td>';
			html += '</tr>';

			return html;
		}

	</script>

</div>
