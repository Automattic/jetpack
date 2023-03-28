<?php
/*
!
 * Admin Page: Settings: Field sorts
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $wpdb, $zbs;  // } Req

// $settings = $zbs->settings->getAll();

$fieldTypes = array(

	'address'  => array(
		'name' => 'Address Fields',
		'obj'  => 'zbsAddressFields',
	),
	'customer' => array(
		'name' => 'Contact Fields',
		'obj'  => 'zbsCustomerFields',
	),
	'company'  => array(
		'name' => jpcrm_label_company() . ' Fields',
		'obj'  => 'zbsCompanyFields',
	),
	// following make no sense as we have custom editors for them :) v3.0 removed QUOTES, other 2 were'nt even in there yet
	// 'quote' => array('name'=>'Quote Fields','obj'=>'zbsCustomerQuoteFields'),
	// 'invoice' => array('name'=>'Invoice Fields','obj'=>'zbsInvoiceFields'),
	// 'transaction' => array('name'=>'Transaction Fields','obj'=>'zbsTransactionFields'),

);

// } Act on any edits!
if ( isset( $_POST['editwplfsort'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

	// check nonce
	check_admin_referer( 'zbs-update-settings-fieldsorts' );

	// } localise
	global $zbsFieldSorts;

	// } Retrieve existing
	$newFieldOrderList = array();// $zbsFieldSorts;
	$newFieldHideList  = array();

	// } Cycle through + Save custom field order
	foreach ( $fieldTypes as $key => $fieldType ) {

		// } Retrieve from post
		$potentialCSV = '';
		if ( isset( $_POST[ 'zbscrm-' . $key . '-sortorder' ] ) && ! empty( $_POST[ 'zbscrm-' . $key . '-sortorder' ] ) ) {
			$potentialCSV = sanitize_text_field( $_POST[ 'zbscrm-' . $key . '-sortorder' ] );
		}

		// } TODO Compare with defaults (don't overridewise?)
		// use $zbsFieldSorts

		// } If not empty, break into array
		if ( ! empty( $potentialCSV ) ) {

			// $newArr = array();
			// brutal, lol
			$newArr = explode( ',', $potentialCSV );

			// } add if any
			// } This adds to rolling arr
			// if (count($newArr) > 0) $newFieldOrderList[$key]['overrides'] = $newArr;
			// } ... but better to just add to save obj :)
			$newFieldOrderList[ $key ] = $newArr;

		}

		// for each fieldtype, also check for hidden fields (hacky temp workaround)

		// } Retrieve from post
		$potentialCSV = '';
		if ( isset( $_POST[ 'zbscrm-' . $key . '-hidelist' ] ) && ! empty( $_POST[ 'zbscrm-' . $key . '-hidelist' ] ) ) {
			$potentialCSV = sanitize_text_field( $_POST[ 'zbscrm-' . $key . '-hidelist' ] );
		}

		// } TODO Compare with defaults (don't overridewise?)
		// use $zbsFieldSorts

		// } If not empty, break into array
		if ( ! empty( $potentialCSV ) ) {

			// $newArr = array();
			// brutal, lol
			$newArr = explode( ',', $potentialCSV );

			// } add if any
			// } This adds to rolling arr
			// if (count($newArr) > 0) $newFieldOrderList[$key]['overrides'] = $newArr;
			// } ... but better to just add to save obj :)
			$newFieldHideList[ $key ] = $newArr;

		}

		// / hidden fields

	}

	// debug echo 'UPDATING: <PRE>'; print_r($_POST); echo '</PRE>';

	// } This brutally overrides existing!
	$zbs->settings->update( 'fieldsorts', $newFieldOrderList );
	$zbs->settings->update( 'fieldhides', $newFieldHideList );
	$sbupdated = true;

	// $x = $zbs->settings->get('fieldsorts');
	// debug echo 'UPDATED: <PRE>'; print_r($x); echo '</PRE>';

	// } Then needs to "reget" fields :)
	zeroBSCRM_applyFieldSorts();

}

// Get field Hides...
$fieldHideOverrides = $zbs->settings->get( 'fieldhides' );

?>

<p id="sbDesc"><?php esc_html_e( 'Using this page you can modify the order of the fields associated with Contacts, Companies, Quotes', 'zero-bs-crm' ); ?></p>

<?php
if ( isset( $sbupdated ) ) {
	if ( $sbupdated ) {
		echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">';
		zeroBSCRM_html_msg( 0, __( 'Field Orders Updated', 'zero-bs-crm' ) );
		echo '</div>'; }
}
?>

<div id="sbA">
	<form method="post" action="?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=fieldsorts" id="zbsfieldsortform">
		<input type="hidden" name="editwplfsort" id="editwplfsort" value="1" />
		<?php
		// add nonce
		wp_nonce_field( 'zbs-update-settings-fieldsorts' );
		?>
		<?php foreach ( $fieldTypes as $key => $fieldType ) { ?>



			<table class="table table-bordered table-striped wtab">

				<thead>

				<tr>
					<th class="wmid"><?php esc_html_e( $fieldType['name'], 'zero-bs-crm' ); ?>:</th>
				</tr>

				</thead>

				<tbody id="zbscrm-<?php echo esc_attr( $key ); ?>-fieldsorts">

				<tr>
					<td style="text-align:right">

						<div class="zbsSortableFieldList">

							<ul id="zbscrm-<?php echo esc_attr( $key ); ?>-sort">

								<?php
								// } output fields

								$fieldTypesArray = isset( $GLOBALS[ $fieldType['obj'] ] ) ? $GLOBALS[ $fieldType['obj'] ] : null;

								// } This holds running list of migrated fields so only shows once
								$migratedFieldsOut = array();

								// } This holds a csv sort order output in input below
								$csvSortOrder = '';
								$csvHideList  = '';

								if ( count( $fieldTypesArray ) > 0 ) {
									foreach ( $fieldTypesArray as $subkey => $field ) {

										// remove address custom fields echo '<br>'.$subkey; print_r($field);
										if ( $key != 'address' && ( substr( $subkey, 0, 7 ) == 'addr_cf' || substr( $subkey, 0, 10 ) == 'secaddr_cf' ) ) {

											// to ignore :)

										} else {

											// normal

											// } Those with a "migrate" attribute need to be switched for what they represent here
											// } (Addresses currently @ 1.1.19)

											if ( isset( $field['migrate'] ) && ! empty( $field['migrate'] ) ) {

												if ( ! in_array( $field['migrate'], $migratedFieldsOut ) ) {

													switch ( $field['migrate'] ) {

														// } Address Fields which were seperate fields under an obj are now managed as groups
														case 'addresses':
															// } Grouped "Address" field out
															?>
														<li data-key="addresses">Addresses</li>
															<?php

															break;

													}

													// } add to csv
													if ( ! empty( $csvSortOrder ) ) {
														$csvSortOrder .= ',';
													}
													$csvSortOrder .= $field['migrate'];

													// } And mark output
													$migratedFieldsOut[] = $field['migrate'];

												} // else just skip

											} else {

												// } Normal field out
												?>
											<li data-key="<?php echo esc_attr( $subkey ); ?>">
																	<?php
																		echo esc_html( $field[1] );

																	if ( substr( $subkey, 0, 2 ) == 'cf' ) {
																		echo ' (' . esc_html__( 'Custom Field', 'zero-bs-crm' ) . ')';
																	}

																		// only bother with this if in these types:
																	if ( in_array( $key, array( 'customer', 'company' ) ) ) {

																											// } Show hide?
																		if ( isset( $field['essential'] ) && ! empty( $field['essential'] ) ) {

																			// these fields are always shown

																		} else {

																			// can be hidden

																			// is hidden?
																			$hidden = false;
																			if ( isset( $fieldHideOverrides[ $key ] ) && is_array( $fieldHideOverrides[ $key ] ) ) {
																				if ( in_array( $subkey, $fieldHideOverrides[ $key ] ) ) {
																					$hidden = true;

																					// } add to csv
																					if ( ! empty( $csvHideList ) ) {
																						$csvHideList .= ',';
																					}
																					$csvHideList .= $subkey;
																				}
																			}
																			?>
													<div class="zbs-showhide-field"><label for="zbsshowhide<?php echo esc_attr( $key . '-' . $subkey ); ?>"><?php esc_html_e( 'Hide', 'zero-bs-crm' ); ?>:</label><input id="zbsshowhide<?php echo esc_attr( $key . '-' . $subkey ); ?>" type="checkbox" value="1"
																				<?php
																				if ( $hidden ) {
																					echo ' checked="checked"';
																				}
																				?>
													/></div>
																				<?php

																		}
																	} // if hide/show option

																	?>
											</li>
												<?php
											}

											// } add to csv
											if ( ! empty( $csvSortOrder ) ) {
												$csvSortOrder .= ',';
											}
											$csvSortOrder .= $subkey;

										} // if not addr custom field

									}
								}

								?>

							</ul>

						</div>

					</td>
				</tr>

				</tbody>

			</table>
			<input type="hidden" name="zbscrm-<?php echo esc_attr( $key ); ?>-sortorder" id="zbscrm-<?php echo esc_attr( $key ); ?>-sortorder" value="<?php echo esc_attr( $csvSortOrder ); ?>" />
			<input type="hidden" name="zbscrm-<?php echo esc_attr( $key ); ?>-hidelist" id="zbscrm-<?php echo esc_attr( $key ); ?>-hidelist" value="<?php echo esc_attr( $csvHideList ); ?>" />

		<?php } ?>

		<table class="table table-bordered table-striped wtab">
			<tbody>

			<tr>
				<td class="wmid">
					<button type="button" class="ui button primary" id="zbsSaveFieldSorts"><?php esc_html_e( 'Save Field Sorts', 'zero-bs-crm' ); ?></button>
				</td>
			</tr>

			</tbody>
		</table>

	</form>

	<script type="text/javascript">
		var zbsSortableFieldTypes = [
		<?php
		$x = 1;
		foreach ( $fieldTypes as $key => $fieldType ) {
			if ( $x > 1 ) {
				echo ',';
			} echo "'" . esc_html( $key ) . "'";
			++$x; }
		?>
		];

		jQuery(function(){


			jQuery( ".zbsSortableFieldList ul" ).sortable();
			jQuery( ".zbsSortableFieldList ul" ).disableSelection();

			// bind go button
			jQuery('#zbsSaveFieldSorts').on( 'click', function(){

				// compile csv's
				jQuery.each(window.zbsSortableFieldTypes,function(ind,ele){

					var csvList = '';
					var csvHideList = '';

					// list into csv
					jQuery('#zbscrm-' + ele + '-sort li').each(function(ind,ele){

						if (csvList.length > 0) csvList += ',';

						csvList += jQuery(ele).attr('data-key');

						//DEBUG  console.log(ind + " " + jQuery(ele).attr('data-key'));


						// show hides:

						// if is present
						if (jQuery('.zbs-showhide-field input[type=checkbox]',jQuery(ele))){

							// if is checked
							if (jQuery('.zbs-showhide-field input[type=checkbox]',jQuery(ele)).prop('checked')){

								// log hide
								if (csvHideList.length > 0) csvHideList += ',';

								csvHideList += jQuery(ele).attr('data-key');

							}
						}

					});

					// add to hidden input
					jQuery('#zbscrm-' + ele + '-sortorder').val(csvList);
					jQuery('#zbscrm-' + ele + '-hidelist').val(csvHideList);
					//DEBUG  console.log("set " + '#zbscrm-' + ele + '-sortorder',csvList);


				});


				setTimeout(function(){

					// submit form
					jQuery('#zbsfieldsortform').submit();

				},0);

			})

		});

	</script>

</div>
