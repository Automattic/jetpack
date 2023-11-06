<?php
/*
!
 * Admin Page: Settings: Transaction settings
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $wpdb, $zbs;  // } Req

$confirmAct = false;
$settings   = $zbs->settings->getAll();

// } Act on any edits!
if ( isset( $_POST['editwplf'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

	// check nonce
	check_admin_referer( 'zbs-update-settings-transactions' );

	// include these statuses in total value
	$zbsStatusSetting          = 'all';
	$zbsStatusSettingPotential = array();
	$zbsStatusStr              = zeroBSCRM_getTransactionsStatuses();
	$zbsStatuses               = explode( ',', $zbsStatusStr );

	if ( is_array( $zbsStatuses ) ) {
		foreach ( $zbsStatuses as $statusStr ) {

			// permify
			$statusKey = strtolower( str_replace( ' ', '_', str_replace( ':', '_', $statusStr ) ) );

			// check post
			if ( isset( $_POST[ 'wpzbscrm_transstatus_group_' . $statusKey ] ) ) {
				$zbsStatusSettingPotential[] = $statusStr;
			}
		}
	}

	if ( count( $zbsStatusSettingPotential ) > 0 ) {

		// set that
		$zbsStatusSetting = $zbsStatusSettingPotential;

	}

	// update
	$zbs->settings->update( 'transinclude_status', $zbsStatusSetting );

	// get setting - statuses
	$customisedFields = $zbs->settings->get( 'customisedfields' );

	$transactionStatusStr = '';
	if ( isset( $_POST['jpcrm-status-transactions'] ) && ! empty( $_POST['jpcrm-status-transactions'] ) ) {
		$transactionStatusStr = sanitize_text_field( $_POST['jpcrm-status-transactions'] );
	}

	if ( str_contains( $transactionStatusStr, ',' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		// } Trim them...
		$statusArr        = array();
		$statusUncleanArr = explode( ',', $transactionStatusStr );
		foreach ( $statusUncleanArr as $x ) {
			$z = trim( $x );
			if ( ! empty( $z ) ) {
				$statusArr[] = $z;
			}
		}

		$customisedFields['transactions']['status'][1] = implode( ',', $statusArr );

	} else {

		// } only 1? or empty?
		if ( ! empty( $transactionStatusStr ) ) {
			$customisedFields['transactions']['status'][1] = $transactionStatusStr;
		}
	}

	// update
	$zbs->settings->update( 'customisedfields', $customisedFields );

	// shipping + paid dates
	$shippingForTransactions = -1;
	if ( isset( $_POST['wpzbscrm_shippingfortransactions'] ) && ! empty( $_POST['wpzbscrm_shippingfortransactions'] ) && $_POST['wpzbscrm_shippingfortransactions'] == '1' ) {
		$shippingForTransactions = 1;
	}
	$paidDatesTransactions = -1;
	if ( isset( $_POST['wpzbscrm_paiddatestransaction'] ) && ! empty( $_POST['wpzbscrm_paiddatestransaction'] ) && $_POST['wpzbscrm_paiddatestransaction'] == '1' ) {
		$paidDatesTransactions = 1;
	}

	// update
	$zbs->settings->update( 'shippingfortransactions', $shippingForTransactions );
	$zbs->settings->update( 'paiddatestransaction', $paidDatesTransactions );

	// Additional settings on transactions
	$additional_settings = array(
		'transaction_fee',
		'transaction_tax',
		'transaction_discount',
		'transaction_net',
	);

	foreach ( $additional_settings as $setting ) {
		if ( isset( $_POST[ 'wpzbscrm_' . $setting ] ) ) {
			$zbs->settings->update( $setting, 1 );
		} else {
			$zbs->settings->update( $setting, -1 );
		}
	}

	// reload
	$settings = $zbs->settings->getAll();

}

?>
<?php
if ( isset( $sbupdated ) ) {
	if ( $sbupdated ) {
		echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">';
		zeroBSCRM_html_msg( 0, __( 'Settings Updated', 'zero-bs-crm' ) );
		echo '</div>'; }
}
?>

<div id="sbA">

	<form method="post" action="?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=transactions">
		<input type="hidden" name="editwplf" id="editwplf" value="1" />
		<?php
		// add nonce
		wp_nonce_field( 'zbs-update-settings-transactions' );
		?>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'General Transaction Settings', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody id="jpcrm-companies-custom-fields">

			<tr>
				<td width="94">
					<label for="wpzbscrm_shippingfortransactions"><?php esc_html_e( 'Use Shipping', 'zero-bs-crm' ); ?></label>
				</td>
				<td>
					<input type="checkbox" name="wpzbscrm_shippingfortransactions" id="wpzbscrm_shippingfortransactions" value="1" 
					<?php
					if ( isset( $settings['shippingfortransactions'] ) && $settings['shippingfortransactions'] == '1' ) {
						echo ' checked="checked"';}
					?>
					class="form-control" />
					<p style="margin-top:4px"><?php esc_html_e( 'Should we show shipping fields when editing transactions?', 'zero-bs-crm' ); ?></p>
				</td>
			</tr>

			<tr>
				<td width="94">
					<label for="wpzbscrm_paiddatestransaction"><?php esc_html_e( 'Use Paid/Completed Dates', 'zero-bs-crm' ); ?></label>
				</td>
				<td>
					<input type="checkbox" name="wpzbscrm_paiddatestransaction" id="wpzbscrm_paiddatestransaction" value="1" 
					<?php
					if ( isset( $settings['paiddatestransaction'] ) && $settings['paiddatestransaction'] == '1' ) {
						echo ' checked="checked"';}
					?>
					class="form-control" />
					<p style="margin-top:4px"><?php esc_html_e( 'Should we show `date paid` and `date completed` when editing transactions?', 'zero-bs-crm' ); ?></p>
				</td>
			</tr>

			<tr>
				<td class="wfieldname"><label><?php esc_html_e( 'Include these statuses in total value', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Tick which statuses to include when calculating total transaction value and total overall value of contacts.', 'zero-bs-crm' ); ?>
					<br /><br /></td>
				<td style="width:540px" id="jpcrm-transaction-include-status">
					<?php

					$selectedStatuses = 'all';
					if ( isset( $settings['transinclude_status'] ) ) {
						$selectedStatuses = $settings['transinclude_status'];
					}

					// retrieve trans statuses
					$zbsStatusStr = zeroBSCRM_getTransactionsStatuses();

					$zbsStatuses = explode( ',', $zbsStatusStr );
					if ( is_array( $zbsStatuses ) ) {

						// each status
						foreach ( $zbsStatuses as $statusStr ) {

							// permify
							$statusKey = strtolower( str_replace( ' ', '_', str_replace( ':', '_', $statusStr ) ) );

							// checked?
							$checked = false;
							if (
								( ! is_array( $selectedStatuses ) && $selectedStatuses == 'all' )
								||
								( is_array( $selectedStatuses ) && in_array( $statusStr, $selectedStatuses ) )
							) {
								$checked = true;
							}

							?>
							<div class="zbs-status">
							<input type="checkbox" value="1" name="wpzbscrm_transstatus_group_<?php echo esc_attr( $statusKey ); ?>" id="wpzbscrm_transstatus_group_<?php echo esc_attr( $statusKey ); ?>"
																										<?php
																										if ( $checked ) {
																											echo ' checked="checked"';}
																										?>
							/>
							<label for="wpzbscrm_transstatus_group_<?php echo esc_attr( $statusKey ); ?>"><?php echo esc_html( $statusStr ); ?></label>
							</div>
							<?php

						}
					} else {
						esc_html_e( 'No Statuses Found', 'zero-bs-crm' );
					}

					?>
				</td>
			</tr>

			</tbody>

		</table>


		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th class="wmid"><?php esc_html_e( 'Transaction Field Options', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td style="padding:2%;">

					<table class="table table-bordered table-striped wtab">
						<tbody id="jpcrm-statusprefix-custom-fields">

						<tr>
							<td width="94">
								<label for="jpcrm-status-transactions"><?php esc_html_e( 'Transaction Status', 'zero-bs-crm' ); ?></label>
							</td>
							<td>
								<?php

								// } retrieve value as simple CSV for now - simplistic at best.
								$jpcrmTranStatusStr = '';
								// } stored here: $settings['customisedfields']
								if ( isset( $settings['customisedfields']['transactions']['status'] ) && is_array( $settings['customisedfields']['transactions']['status'] ) ) {
									$jpcrmTranStatusStr = $settings['customisedfields']['transactions']['status'][1];
								}
								if ( empty( $jpcrmTranStatusStr ) ) {
									// } Defaults:
									global $zbsTransactionFields;
									if ( is_array( $zbsTransactionFields ) ) {
										$jpcrmTranStatusStr = implode( ',', $zbsTransactionFields['status'][3] );
									}
								}

								?>
								<input type="text" name="jpcrm-status-transactions" id="jpcrm-status-transactions" value="<?php echo esc_attr( $jpcrmTranStatusStr ); ?>" class="form-control" />
								<p style="margin-top:4px"><?php esc_html_e( 'Default is', 'zero-bs-crm' ); ?>:<br /><span style="background:#ceeaea;padding:0 4px">Succeeded,Completed,Failed,Refunded,Processing,Pending,Hold,Cancelled,Deleted,Draft</span></p>
							</td>
						</tr>

						</tbody>
					</table>


				</td>
			</tr>

			</tbody>

		</table>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th colspan="2" class="wmid"><?php esc_html_e( 'Additional settings on transactions', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>
			<tr>
				<td class="wfieldname"><label for="wpzbscrm_transaction_fee"><?php echo esc_html__( 'Show fee', 'zero-bs-crm' ); ?>:</label><br /><?php echo esc_html__( 'Tick if you need to use fees', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_transaction_fee" id="wpzbscrm_transaction_fee" value="1"
				<?php
				if ( isset( $settings['transaction_fee'] ) && $settings['transaction_fee'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>
			<tr>
				<td class="wfieldname"><label for="wpzbscrm_transaction_tax"><?php echo esc_html__( 'Show tax', 'zero-bs-crm' ); ?>:</label><br /><?php echo esc_html__( 'Tick if you need to use taxes', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_transaction_tax" id="wpzbscrm_transaction_tax" value="1"
				<?php
				if ( isset( $settings['transaction_tax'] ) && $settings['transaction_tax'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>
			<tr>
				<td class="wfieldname"><label for="wpzbscrm_transaction_discount"><?php echo esc_html__( 'Show discount', 'zero-bs-crm' ); ?>:</label><br /><?php echo esc_html__( 'Tick if you need to use discounts', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_transaction_discount" id="wpzbscrm_transaction_discount" value="1"
				<?php
				if ( isset( $settings['transaction_discount'] ) && $settings['transaction_discount'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
			</tr>
			<tr>
				<td class="wfieldname"><label for="wpzbscrm_transaction_net"><?php echo esc_html__( 'Show net amount', 'zero-bs-crm' ); ?>:</label><br /><?php echo esc_html__( 'Tick if you need to use net amount', 'zero-bs-crm' ); ?></td>
				<td style="width:540px"><input type="checkbox" class="winput form-control" name="wpzbscrm_transaction_net" id="wpzbscrm_transaction_net" value="1"
				<?php
				if ( isset( $settings['transaction_net'] ) && $settings['transaction_net'] == '1' ) {
					echo ' checked="checked"';}
				?>
				/></td>
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


	<div style="text-align: center;margin-top:2.5em">
		<span class="ui label"><?php esc_html_e( 'Other Tools:', 'zero-bs-crm' ); ?></span> <a href="<?php echo jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=customfields#zbscrm-transactions-custom-fields' ); ?>"><?php esc_html_e( 'Manage Custom Fields', 'zero-bs-crm' ); ?></a>
	</div>
	
</div>
