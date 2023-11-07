<?php
/*
!
 * Admin Page: Settings: Field options
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $wpdb, $zbs;  // } Req

$settings = $zbs->settings->getAll();

// } Act on any edits!
if ( isset( $_POST['editwplf'] ) ) {
	// check nonce
	check_admin_referer( 'jpcrm-update-settings-field-options' );

	// use existing as a base
	$customisedFields = $settings['customisedfields'];

	// contact status
	$zbsStatusStr = '';
	if ( isset( $_POST['zbs-status'] ) && ! empty( $_POST['zbs-status'] ) ) {
		$zbsStatusStr = sanitize_text_field( $_POST['zbs-status'] );
	}

	// funnel
	$zbsFunnelStr = ''; if ( isset( $_POST['zbs-funnel'] ) && ! empty( $_POST['zbs-funnel'] ) ) {
		$zbsFunnelStr = sanitize_text_field( $_POST['zbs-funnel'] );
		// wh added to trim , x
		$zbsFunnelStr = trim( str_replace( ' ,', ',', str_replace( ', ', ',', $zbsFunnelStr ) ) );
	}

	$zbs->settings->update( 'zbsfunnel', $zbsFunnelStr );

	$zbsDefaultStatusStr = '';
	if ( isset( $_POST['zbs-default-status'] ) && ! empty( $_POST['zbs-default-status'] ) ) {
		$zbsDefaultStatusStr = sanitize_text_field( $_POST['zbs-default-status'] );
	}
	$zbsPrefixStr = '';
	if ( isset( $_POST['zbs-prefix'] ) && ! empty( $_POST['zbs-prefix'] ) ) {
		$zbsPrefixStr = sanitize_text_field( $_POST['zbs-prefix'] );
	}

	// } 2.10.3
	$zbsShowID = -1;
	if ( isset( $_POST['zbs-show-id'] ) && ! empty( $_POST['zbs-show-id'] ) ) {
		$zbsShowID = 1;
	}

	// } Update

	// } any here? or 1?
	if ( str_contains( $zbsStatusStr, ',' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		// } Trim them...
		$zbsStatusArr        = array();
		$zbsStatusUncleanArr = explode( ',', $zbsStatusStr );
		foreach ( $zbsStatusUncleanArr as $x ) {
			$z = trim( $x );
			if ( ! empty( $z ) ) {
				$zbsStatusArr[] = $z;
			}
		}

		$customisedFields['customers']['status'][1] = implode( ',', $zbsStatusArr ); // $zbsStatusArr;

	} else {

		// } only 1? or empty?
		if ( ! empty( $zbsStatusStr ) ) {
			$customisedFields['customers']['status'][1] = $zbsStatusStr;
		}
	}

	// } any here? or 1?
	if ( str_contains( $zbsPrefixStr, ',' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		// } Trim them...
		$zbsPrefixArr        = array();
		$zbsPrefixUncleanArr = explode( ',', $zbsPrefixStr );
		foreach ( $zbsPrefixUncleanArr as $x ) {
			$z = trim( $x );
			if ( ! empty( $z ) ) {
				$zbsPrefixArr[] = $z;
			}
		}

		$customisedFields['customers']['prefix'][1] = implode( ',', $zbsPrefixArr ); // $zbsPrefixArr;

	} else {

		// } only 1? or empty?
		if ( ! empty( $zbsPrefixStr ) ) {
			$customisedFields['customers']['prefix'][1] = $zbsPrefixStr;
		}
	}

	// } 2.17
	$filtersFromStatus = -1;
	if ( isset( $_POST['wpzbscrm_filtersfromstatus'] ) && ! empty( $_POST['wpzbscrm_filtersfromstatus'] ) && $_POST['wpzbscrm_filtersfromstatus'] == '1' ) {
		$filtersFromStatus = 1;
	}

	// } 2.81
	$fieldOverride = -1;
	if ( isset( $_POST['wpzbscrm_fieldoverride'] ) && ! empty( $_POST['wpzbscrm_fieldoverride'] ) && $_POST['wpzbscrm_fieldoverride'] == '1' ) {
		$fieldOverride = 1;
	}

	// } 2.87
	$filtersFromSegments = -1;
	if ( isset( $_POST['wpzbscrm_filtersfromsegments'] ) && ! empty( $_POST['wpzbscrm_filtersfromsegments'] ) && $_POST['wpzbscrm_filtersfromsegments'] == '1' ) {
		$filtersFromSegments = 1;
	}

	// } 2.99.9.11
	$customFieldSearch = -1;
	if ( isset( $_POST['wpzbscrm_customfieldsearch'] ) && ! empty( $_POST['wpzbscrm_customfieldsearch'] ) && $_POST['wpzbscrm_customfieldsearch'] == '1' ) {
		$customFieldSearch = 1;
	}

	// } Brutal update
	$zbs->settings->update( 'customisedfields', $customisedFields );
	$zbs->settings->update( 'defaultstatus', $zbsDefaultStatusStr );
	$zbs->settings->update( 'showid', $zbsShowID );
	$zbs->settings->update( 'filtersfromstatus', $filtersFromStatus );
	$zbs->settings->update( 'fieldoverride', $fieldOverride );
	$zbs->settings->update( 'filtersfromsegments', $filtersFromSegments );
	$zbs->settings->update( 'customfieldsearch', $customFieldSearch );

	// } $msg out!
	$sbupdated = true;

	// } Reload
	$settings = $zbs->settings->getAll( true );

}

// load
$fieldOverride = $settings['fieldoverride'];

?>

<p id="sbDesc"><?php esc_html_e( 'Using this page you can manage the default fields, statuses and other field options used throughout your CRM', 'zero-bs-crm' ); ?></p>

<?php
if ( isset( $sbupdated ) ) {
	if ( $sbupdated ) {
		echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">';
		zeroBSCRM_html_msg( 0, __( 'Custom Fields Updated', 'zero-bs-crm' ) );
		echo '</div>'; }
}
?>

<div id="sbA" class="zbs-settings-custom-fields">

	<form method="post" action="?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=fieldoptions">
		<input type="hidden" name="editwplf" id="editwplf" value="1" />
		<?php
		// add nonce
		wp_nonce_field( 'jpcrm-update-settings-field-options' );
		?>

		<table class="table table-bordered table-striped wtab">

			<thead>

			<tr>
				<th class="wmid"><?php esc_html_e( 'General Field Options', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td style="padding:2%;">

					<table class="table table-bordered table-striped wtab">
						<tbody id="zbscrm-statusprefix-custom-fields-general">

						<tr>
							<td width="94">
								<label for="zbs-show-id"><?php esc_html_e( 'Show IDs', 'zero-bs-crm' ); ?></label>
							</td>
							<td>
								<input type="checkbox" name="zbs-show-id" id="zbs-show-id" value="1" 
								<?php
								if ( isset( $settings['showid'] ) && $settings['showid'] == '1' ) {
									echo ' checked="checked"';}
								?>
								class="form-control" />
								<p style="margin-top:4px">
								<?php
								echo esc_html(
									sprintf(
										/* Translators: %s: is the company label */
										__( 'Choose whether to show or hide Contact/%s ID on contact record and manage pages', 'zero-bs-crm' ),
										jpcrm_label_company()
									)
								);
								?>
								</p>
							</td>
						</tr>


						<tr>
							<td>
								<label for="wpzbscrm_fieldoverride"><?php esc_html_e( 'Overwrite Option', 'zero-bs-crm' ); ?></label>
							</td>
							<td>
								<input type="checkbox" name="wpzbscrm_fieldoverride" id="wpzbscrm_fieldoverride" value="1"
								<?php
								if ( $fieldOverride == '1' ) {
									echo ' checked="checked"';}
								?>
								class="form-control" />
								<br />
								<p style="margin-top:4px"><?php esc_html_e( 'When a field is overriden by the API, a form, or other non-manual means, only overwrite the fields that are sent and do not clear non-sent fields?', 'zero-bs-crm' ); ?></p>
							</td>
						</tr>


						<tr>
							<td width="94">
								<label for="wpzbscrm_customfieldsearch"><?php esc_html_e( 'Include Custom Fields in Search', 'zero-bs-crm' ); ?></label>
							</td>
							<td>
								<input type="checkbox" name="wpzbscrm_customfieldsearch" id="wpzbscrm_customfieldsearch" value="1" 
								<?php
								if ( isset( $settings['customfieldsearch'] ) && $settings['customfieldsearch'] == '1' ) {
									echo ' checked="checked"';}
								?>
								class="form-control" />
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
				<th class="wmid"><?php esc_html_e( 'Contact Field Options', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td style="padding:2%;">

					<table class="table table-bordered table-striped wtab">
						<tbody id="zbscrm-statusprefix-custom-fields-contact">

						<tr>
							<td width="94">
								<label for="zbs-status"><?php esc_html_e( 'Contact Status', 'zero-bs-crm' ); ?></label>
							</td>
							<td>
								<?php

								// } retrieve value as simple CSV for now - simplistic at best.
								$zbsStatusStr = '';
								// } stored here: $settings['customisedfields']
								if ( isset( $settings['customisedfields']['customers']['status'] ) && is_array( $settings['customisedfields']['customers']['status'] ) ) {
									$zbsStatusStr = $settings['customisedfields']['customers']['status'][1];
								}
								if ( empty( $zbsStatusStr ) ) {
									// } Defaults:
									global $zbsCustomerFields;
									if ( is_array( $zbsCustomerFields ) ) {
										$zbsStatusStr = implode( ',', $zbsCustomerFields['status'][3] );
									}
								}

								?>
								<input type="text" name="zbs-status" id="zbs-status" value="<?php echo esc_attr( $zbsStatusStr ); ?>" class="form-control" />
								<p style="margin-top:4px"><?php esc_html_e( 'Default is', 'zero-bs-crm' ); ?>:<br /><span style="background:#ceeaea;padding:0 4px">Lead,Customer,Refused,Blacklisted</span></p>
							</td>
						</tr>

						<tr>
							<td>
								<label for="zbs-prefix"><?php esc_html_e( 'Prefix Options', 'zero-bs-crm' ); ?></label>
							</td>
							<td>
								<?php

								// } retrieve value as simple CSV for now - simplistic at best.
								// } stored here: $settings['customisedfields']
								$zbsPrefixStr = '';
								if ( isset( $settings['customisedfields']['customers']['prefix'] ) && is_array( $settings['customisedfields']['customers']['prefix'] ) ) {
									$zbsPrefixStr = $settings['customisedfields']['customers']['prefix'][1];
								}
								if ( empty( $zbsPrefixStr ) ) {
									// } Defaults:
									global $zbsCustomerFields;
									if ( is_array( $zbsCustomerFields ) ) {
										$zbsPrefixStr = implode( ',', $zbsCustomerFields['prefix'][3] );
									}
								}

								?>
								<input type="text" name="zbs-prefix" id="zbs-prefix" value="<?php echo esc_attr( $zbsPrefixStr ); ?>" class="form-control" />
								<p style="margin-top:4px"><?php esc_html_e( 'Default is', 'zero-bs-crm' ); ?>: <span style="background:#ceeaea;padding:0 4px">Mr,Mrs,Ms,Miss,Dr,Prof,Mr &amp; Mrs</span></p>
							</td>
						</tr>

						<tr>
							<td><label for="wpzbscrm_filtersfromstatus">Status Quick-filters:</label></td>
							<td>
								<select class="winput form-control" name="wpzbscrm_filtersfromstatus" id="wpzbscrm_filtersfromstatus">
									<option value="1"
									<?php
									if ( isset( $settings['filtersfromstatus'] ) && $settings['filtersfromstatus'] == '1' ) {
										echo ' selected="selected"';}
									?>
									><?php esc_html_e( 'Automatic Status Quick Filters', 'zero-bs-crm' ); ?></option>
									<option value="-1"
									<?php
									if ( isset( $settings['filtersfromstatus'] ) && $settings['filtersfromstatus'] != '1' ) {
										echo ' selected="selected"';}
									?>
									><?php esc_html_e( 'No Status Quick Filters', 'zero-bs-crm' ); ?></option>
								</select>
								<p style="margin-top:4px"><?php esc_html_e( 'Automatically add Quick-filters for each status', 'zero-bs-crm' ); ?></p>
							</td>
						</tr>
						<tr>
							<td><label for="wpzbscrm_filtersfromsegments">Segment Quick-filters:</label></td>
							<td>
								<select class="winput form-control" name="wpzbscrm_filtersfromsegments" id="wpzbscrm_filtersfromsegments">
									<option value="1"
									<?php
									if ( isset( $settings['filtersfromsegments'] ) && $settings['filtersfromsegments'] == '1' ) {
										echo ' selected="selected"';}
									?>
									><?php esc_html_e( 'Automatic Segment Quick Filters', 'zero-bs-crm' ); ?></option>
									<option value="-1"
									<?php
									if ( isset( $settings['filtersfromsegments'] ) && $settings['filtersfromsegments'] != '1' ) {
										echo ' selected="selected"';}
									?>
									><?php esc_html_e( 'No Segment Quick Filters', 'zero-bs-crm' ); ?></option>
								</select>
								<p style="margin-top:4px"><?php esc_html_e( 'Automatically add Quick-filters for each Segment', 'zero-bs-crm' ); ?></p>
							</td>
						</tr>

						<tr>
							<td width="94">
								<label for="zbs-default-status"><?php esc_html_e( 'Status: Default', 'zero-bs-crm' ); ?></label>
							</td>
							<td>
								<?php

								// } stored here: $settings['defaultstatus']
								if ( isset( $settings['defaultstatus'] ) ) {
									$defaultStatusStr = $settings['defaultstatus'];
								}
								if ( ! empty( $zbsStatusStr ) ) {

									?>
									<select name="zbs-default-status" id="zbs-default-status" class="form-control">
									<?php

									$zbsStatuses = explode( ',', $zbsStatusStr );
									if ( is_array( $zbsStatuses ) ) {
										foreach ( $zbsStatuses as $statusStr ) {

											?>
										<option value="<?php echo esc_attr( $statusStr ); ?>"
																				<?php
																				if ( $defaultStatusStr == $statusStr ) {
																					echo ' selected="selected"';
																				}
																				?>
										><?php echo esc_html( $statusStr ); ?></option>
											<?php

										}
									} else {

										?>
										<option value=""><?php esc_html_e( 'None (Set values above and save to enable this)', 'zero-bs-crm' ); ?></option>
										<?php

									}

									?>
									</select>
									<?php

								}

								?>
								<p style="margin-top:4px"><?php esc_html_e( 'This setting determines which status will automatically be assigned to new contact records where a status is not specified (e.g. via web form)', 'zero-bs-crm' ); ?></p>
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
				<th class="wmid"><?php esc_html_e( 'Funnels', 'zero-bs-crm' ); ?>:</th>
			</tr>

			</thead>

			<tbody>

			<tr>
				<td style="padding:2%;">

					<table class="table table-bordered table-striped wtab" id="funnel">
						<tbody id="zbscrm-statusprefix-custom-fields-funnel">

						<tr>
							<td>
								<label for="zbs-funnel"><?php esc_html_e( 'Funnel Statuses', 'zero-bs-crm' ); ?></label>
							</td>
							<td>

								<?php

								// } retrieve value as simple CSV for now - simplistic at best.
								$zbsFunnelStr = '';
								// } stored here: $settings['customisedfields']
								if ( isset( $settings['zbsfunnel'] ) && ! empty( $settings['zbsfunnel'] ) ) {
									$zbsFunnelStr = $settings['zbsfunnel'];
								}

								if ( empty( $zbsFunnelStr ) ) {
									// } Defaults:
									$zbsFunnelStr = 'Lead,Customer'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
								}

								?>
								<input type="text" name="zbs-funnel" id="zbs-funnel" value="<?php echo esc_attr( $zbsFunnelStr ); ?>" class="form-control" />
								<p style="margin-top:4px"><?php esc_html_e( 'Enter which statuses you want to display in the funnel. Starting at the top of the funnel', 'zero-bs-crm' ); ?>. e.g. Lead,Customer as a CSV value</p>
							</td>
						</tr>

						</tbody>
					</table>

			</tbody>
		</table>


		<table class="table table-bordered table-striped wtab">
			<tbody>

			<tr>
				<td class="wmid"><button type="submit" class="ui button primary"><?php esc_html_e( 'Save Field Options', 'zero-bs-crm' ); ?></button></td>
			</tr>

			</tbody>
		</table>

	</form>

	<script type="text/javascript">

		// all custom js moved to admin.settings.js 12/3/19 :)

		var wpzbscrm_settings_page = 'fieldoptions'; // this fires init js in admin.settings.min.js
		var wpzbscrm_settings_lang = {

			// e.g. customfield:'<?php zeroBSCRM_slashOut( __( 'Custom Field', 'zero-bs-crm' ) ); ?>',

		};
		var wpzbscrm_settings_urls = {

			// e.g. autonumberhelp: '<?php echo esc_url( $zbs->urls['autonumberhelp'] ); ?>'

		};

	</script>

</div>
