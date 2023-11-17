<?php
/*
!
 * Admin Page: Settings: Custom field settings
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $wpdb, $zbs;

// Default custom fields
$custom_fields = array(
	'customers'      => array(),
	'customersfiles' => array(),
	'companies'      => array(),
	'quotes'         => array(),
	'transactions'   => array(),
	'invoices'       => array(),
	'addresses'      => array(),
);

$settings          = $zbs->settings->getAll();
$old_custom_fields = $settings['customfields'];

$acceptableCFTypes = zeroBSCRM_customfields_acceptableCFTypes();

// define custom fields to process (via global definitions)
$object_custom_fields_to_save = array(
	'customers'    => ZBS_TYPE_CONTACT,
	'companies'    => ZBS_TYPE_COMPANY,
	'quotes'       => ZBS_TYPE_QUOTE,
	'transactions' => ZBS_TYPE_TRANSACTION,
	'invoices'     => ZBS_TYPE_INVOICE,
	'addresses'    => ZBS_TYPE_ADDRESS,
);

// list the various custom fields areas available
$custom_field_table_data = array(
	'customers'      => array(
		'table_title' => __( 'Contact Custom Fields', 'zero-bs-crm' ),
		'is_visible'  => true,
	),
	'customersfiles' => array(
		'table_title' => __( 'Contact Custom File Upload Boxes', 'zero-bs-crm' ),
		'is_visible'  => true,
	),
	'companies'      => array(
		'table_title' => __( jpcrm_label_company() . ' Custom Fields', 'zero-bs-crm' ),
		'is_visible'  => zeroBSCRM_getSetting( 'companylevelcustomers' ) == 1,
	),
	'quotes'         => array(
		'table_title' => __( 'Quote Custom Fields', 'zero-bs-crm' ),
		'is_visible'  => zeroBSCRM_getSetting( 'feat_quotes' ) == 1,
	),
	'invoices'       => array(
		'table_title' => __( 'Invoice Custom Fields', 'zero-bs-crm' ),
		'is_visible'  => zeroBSCRM_getSetting( 'feat_invs' ) == 1,
	),
	'transactions'   => array(
		'table_title' => __( 'Transaction Custom Fields', 'zero-bs-crm' ),
		'is_visible'  => zeroBSCRM_getSetting( 'feat_transactions' ) == 1,
	),
	'addresses'      => array(
		'table_title' => __( 'Address Custom Fields', 'zero-bs-crm' ),
		'is_visible'  => true,
	),
);

// Act on any edited custom fields, if POST is set
if ( zeroBSCRM_isZBSAdminOrAdmin() && isset( $_POST['editwplf'] ) ) {

	// check nonce
	check_admin_referer( 'zbs-update-settings-customfields' );

	// pass through disabled object fields
	foreach ( $custom_fields as $obj_key => $obj_val ) {
		if ( ! $custom_field_table_data[ $obj_key ]['is_visible'] ) {
			$custom_fields[ $obj_key ] = $old_custom_fields[ $obj_key ];
		}
	}

	// define an array to allow sidestepping of dupes
	$field_slugs_used = array();

	// #backward-compatibility
	// The function `does_model_field_exist` doesn't work for calculated fields (e.g. name).
	// Because of this the code below populates `$field_slugs_used` with the columns from the list view. (see ZeroBSCRM.List.Columns.php)
	// The columns from the list view come with the already saved custom fields, so they have to be taken them out.
	global $zeroBSCRM_columns_customer;
	global $zeroBSCRM_columns_company;
	global $zeroBSCRM_columns_quote;
	global $zeroBSCRM_columns_transaction;
	global $zeroBSCRM_columns_invoice;
	$all_fields_from_listview                 = array();
	$all_fields_from_listview['customers']    = $zeroBSCRM_columns_customer['all'];
	$all_fields_from_listview['companies']    = $zeroBSCRM_columns_company['all'];
	$all_fields_from_listview['quotes']       = $zeroBSCRM_columns_quote['all'];
	$all_fields_from_listview['transactions'] = $zeroBSCRM_columns_transaction['all'];
	$all_fields_from_listview['invoices']     = $zeroBSCRM_columns_invoice['all'];

	foreach ( $all_fields_from_listview as $all_fields_key => $all_fields_value ) {
		foreach ( $all_fields_value as $column_key => $column_value ) {
			$field_slugs_used[ $all_fields_key ][ $column_key ] = 1;
		}
		foreach ( $old_custom_fields[ $all_fields_key ] as $old_custom_field ) {
			if ( isset( $old_custom_field[3] ) ) {
				unset( $field_slugs_used[ $all_fields_key ][ $old_custom_field[3] ] );
			}
		}
	}

	$submitted_fields = isset( $_POST['wpzbscrm_cf'] ) ? $_POST['wpzbscrm_cf'] : array();

	foreach ( $submitted_fields as $object_key => $object_custom_fields ) {
		if (
			// bad $object_key
			! isset( $custom_fields[ $object_key ] )
			// missing params
			|| ! isset( $object_custom_fields['name'] )
		) {
			continue;
		}

		// max out at 128 fields
		$max_custom_fields_per_object = min( count( $object_custom_fields['name'] ), 128 );

		for ( $i = 0; $i < $max_custom_fields_per_object; $i++ ) {

			if ( $object_key == 'customersfiles' ) {

				$possName = zeroBSCRM_textProcess( sanitize_text_field( $object_custom_fields['name'][ $i ] ) );

				// Add
				if ( ! empty( $possName ) ) {
					$custom_fields['customersfiles'][] = array( $possName );
				}

				// file custom field, so short-circuit
				continue;

			}

			$obj_type_id = $object_custom_fields_to_save[ $object_key ];
			$possType    = sanitize_text_field( $object_custom_fields['type'][ $i ] );
			$possName    = zeroBSCRM_textProcess( sanitize_text_field( $object_custom_fields['name'][ $i ] ) );
			// Placeholder text or csv options
			$possPlaceholder = sanitize_text_field( $object_custom_fields['placeholder'][ $i ] );

			// autonumber
			if ( $possType == 'autonumber' ) {
				// because we store them dumbly in db, we don't allow special characters :)
				// allows alphanumeric + - + _
				if ( isset( $object_custom_fields['anprefix'][ $i ] ) ) {
					$autonumberPrefix = trim( zeroBSCRM_strings_stripNonAlphaNumeric_dash( sanitize_text_field( $object_custom_fields['anprefix'][ $i ] ) ) );
				}
				if ( isset( $object_custom_fields['annextnumber'][ $i ] ) ) {
					$autonumberNextNumber = (int) zeroBSCRM_strings_stripNonNumeric( trim( sanitize_text_field( $object_custom_fields['annextnumber'][ $i ] ) ) );
				}
				if ( isset( $object_custom_fields['ansuffix'][ $i ] ) ) {
					$autonumberSuffix = trim( zeroBSCRM_strings_stripNonAlphaNumeric_dash( sanitize_text_field( $object_custom_fields['ansuffix'][ $i ] ) ) );
				}
				// roll them into one for storage :)
				// in fact we store them in placeholder for now! not super clean, custom fields needs a fresh rewrite (when can)
				// this overrides anything passed in _p above, also, so isn't messy messy :)
				if ( $autonumberNextNumber < 1 ) {
					$autonumberNextNumber = 1;
				}
				$possPlaceholder = $autonumberPrefix . '#' . $autonumberNextNumber . '#' . $autonumberSuffix;
			}

			// catch empty names
			if ( empty( $possName ) ) {
				$possName = sprintf( __( 'Custom Field %d', 'zero-bs-crm' ), count( $custom_fields[ $object_key ] ) + 1 );
			}

			// if using select, radio, or checkbox, trim ", " peeps
			if ( $possType == 'select' || $possType == 'radio' || $possType == 'checkbox' ) {
				$possPlaceholder = trim( str_replace( ' ,', ',', str_replace( ', ', ',', $possPlaceholder ) ) );
			}

			// 2.77+ added slug as a 4th arr item
			$potential_slug = $zbs->DAL->makeSlug( $possName );

			// 3.0.13 - Chinese characters were being obliterated by the transliterisor here, so this is a fallback gh-503
			$wasNotTransliteratable = false;

			if ( empty( $potential_slug ) ) {
				$potential_slug         = 'custom-field';
				$wasNotTransliteratable = true;
			}

			// append `-n*` until safe...
			// if it exists already
			// ...or if we've just added a slug as a custom field, do the same
			// ...or if it's a restricted field name (id/status) deny
			if (
				$zbs->DAL->does_model_field_exist( $obj_type_id, $potential_slug )
				||
				isset( $field_slugs_used[ $object_key ][ $potential_slug ] )
				||
				in_array( $potential_slug, array( 'id', 'status' ) )
			) {

				$n = 0;

				while ( $n <= 20 ) {

					// Search for alternative slugs, n+1
					++$n;
					$alternative_slug = "$potential_slug-$n";

					// Check in custom fields
					if ( isset( $field_slugs_used[ $object_key ][ $alternative_slug ] ) ) {
						continue;
					}

					// Check in model fields
					if ( $zbs->DAL->does_model_field_exist( $obj_type_id, $alternative_slug ) ) {
						continue;
					}

					// got one that's okay, set + break
					if ( ! $wasNotTransliteratable ) {
						$possName .= ' ' . $n;
					}

					$potential_slug = $alternative_slug;

					break;
				}
			}

			if ( in_array( $possType, $acceptableCFTypes ) ) {

				// Add it
				$custom_fields[ $object_key ][] = array( $possType, $possName, $possPlaceholder, $potential_slug );
				// dupe check
				$field_slugs_used[ $object_key ][ $potential_slug ] = 1;

			}
		}
	}

	// update DAL 2 custom fields :) (DAL3 dealt with below)
	if ( $zbs->isDAL2() && ! $zbs->isDAL3() ) {

		if ( isset( $custom_fields['customers'] ) && is_array( $custom_fields['customers'] ) ) {

			// slight array reconfig
			$db2_custom_fields = array();
			foreach ( $custom_fields['customers'] as $cfArr ) {
				$db2_custom_fields[ $cfArr[3] ] = $cfArr;
			}

			// simple maintain DAL2 (needs to also)
			$zbs->DAL->updateActiveCustomFields(
				array(
					'objtypeid' => 1,
					'fields'    => $db2_custom_fields,
				)
			);

		}
	}
	// DAL3 they all get this :)
	if ( $zbs->isDAL3() ) {

		foreach ( $object_custom_fields_to_save as $obj_key => $obj_type_id ) {

			if ( isset( $custom_fields[ $obj_key ] ) && is_array( $custom_fields[ $obj_key ] ) ) {

				// slight array reconfig
				$db2_custom_fields = array();
				foreach ( $custom_fields[ $obj_key ] as $cfArr ) {
					$db2_custom_fields[ $cfArr[3] ] = $cfArr;
				}

				// simple maintain DAL2 (needs to also)
				$zbs->DAL->updateActiveCustomFields(
					array(
						'objtypeid' => $obj_type_id,
						'fields'    => $db2_custom_fields,
					)
				);

			}
		}
	}

	// Brutal update (note this is on top of updateActiveCustomFields DAL2+ work above)
	$zbs->settings->update( 'customfields', $custom_fields );

	/*
	 * After the update, we must remove all references in the field sorting
	 * settings for any custom fields that no longer exist. We begin with
	 * a hard-coded map, which is required since field types in custom fields and
	 * field sorts are hard-coded differently. Unifying them would demand major efforts.
	 */
	$sort_types_map = array(
		'address'  => array(
			'custom_key'        => 'addresses',
			'obj_key'           => 'zbsAddressFields',
			'force_addr_prefix' => 'addr_',
		),
		'customer' => array(
			'custom_key' => 'customers',
			'obj_key'    => 'zbsCustomerFields',
		),
		'company'  => array(
			'custom_key' => 'companies',
			'obj_key'    => 'zbsCompanyFields',
		),
	);

	/*
	 * Creating a lookup table so we don't need to have multiple nested loops in
	 * the next step. We do this by first adding all currently valid custom
	 * fields, then adding all others (that should be the default ones).
	 */
	$sort_field_names = array();
	foreach ( $sort_types_map as $sort_type => $sort_map ) {
		$custom_type = $sort_map['custom_key'];
		$field_types = isset( $GLOBALS[ $sort_map['obj_key'] ] ) ? $GLOBALS[ $sort_map['obj_key'] ] : array();
		foreach ( $field_types as $field_key => $field_array ) {
			if ( isset( $field_array['custom-field'] ) && $field_array['custom-field'] ) {
				continue;
			}
			$sort_field_names[ $custom_type ][ $field_key ] = true;

			// This is a special case used for grouping addresses.
			if ( isset( $field_array['migrate'] ) ) {
				$sort_field_names[ $custom_type ][ $field_array['migrate'] ] = true;
			}
		}
	}

	foreach ( $custom_fields as $custom_type => $field_arrays ) {
		$field_prefix = array_column( $sort_types_map, 'force_addr_prefix', 'custom_key' )[ $custom_type ] ?? '';
		foreach ( $field_arrays as $field_array ) {
			if ( isset( $field_array[3] ) ) {
				$field_slug                                      = $field_prefix . $field_array[3];
				$sort_field_names[ $custom_type ][ $field_slug ] = true;
			}
		}
	}

	/*
	 * In this step, we remove any field that no longer exists. Additionally, if
	 * a field type becomes empty, we also remove the corresponding entry from
	 * the sort array. We have two distinct settings for sorting fields: one for
	 * the sorting itself and another for hidden fields. For fieldsorts we add all
	 * newly added fields, we don't do this for fieldhides.
	 */
	$settings_to_update = array( 'fieldsorts', 'fieldhides' );
	foreach ( $settings_to_update as $setting ) {
		$fields = $zbs->settings->get( $setting );
		foreach ( $fields as $sort_type => $sort_names ) {
			if ( empty( $sort_names ) ) {
				continue;
			}

			$custom_type = $sort_types_map[ $sort_type ]['custom_key'];

			if ( ! isset( $custom_fields[ $custom_type ] ) || ! isset( $sort_field_names[ $custom_type ] ) ) {
				unset( $fields[ $sort_type ] );
				continue;
			}

			$valid_fields = array_values(
				array_filter(
					$sort_names,
					function ( $field_name ) use ( $sort_field_names, $custom_type ) {
						return isset( $sort_field_names[ $custom_type ][ $field_name ] );
					}
				)
			);
			if ( $setting === 'fieldsorts' ) {
				/**
				* The operation below ensures that any newly added custom fields are included in the final array (only for fieldsorts).
				* Although this could be optimized for performance, readability is prioritized here.
				* Note: This operation is only invoked when custom fields are added or removed, minimizing the performance impact.
				*/
				$all_fields           = array_keys( $sort_field_names[ $custom_type ] );
				$fields[ $sort_type ] = array_unique( array_merge( $valid_fields, $all_fields ) );
			} else {
				$fields[ $sort_type ] = $valid_fields;
			}

			if ( empty( $fields[ $sort_type ] ) ) {
				unset( $fields[ $sort_type ] );
			}
		}
		$zbs->settings->update( $setting, $fields );
	}

	// $msg out!
	$sbupdated = true;

	// Reload
	$settings = $zbs->settings->getAll( true );

}

// load
$fieldOverride = $settings['fieldoverride'];

// Following overloading code is also replicated in Fields.php, search #FIELDOVERLOADINGDAL2+

// This ALWAYS needs to get overwritten by DAL2 for now :)
if ( zeroBSCRM_isZBSAdminOrAdmin() && $zbs->isDAL2() && ! $zbs->isDAL3() && isset( $settings['customfields'] ) && isset( $settings['customfields']['customers'] ) ) {

	$settings['customfields']['customers'] = $zbs->DAL->setting( 'customfields_contact', array() );

}
// DAL3 ver (all objs in $object_custom_fields_to_save above)
if ( $zbs->isDAL3() ) {

	foreach ( $object_custom_fields_to_save as $obj_key => $obj_type_id ) {

		if ( isset( $settings['customfields'] ) && isset( $settings['customfields'][ $obj_key ] ) ) {

			// turn ZBS_TYPE_CONTACT (1) into "contact"
			$typeStr = $zbs->DAL->objTypeKey( $obj_type_id );
			if ( ! empty( $typeStr ) ) {
				$settings['customfields'][ $obj_key ] = $zbs->DAL->setting( 'customfields_' . $typeStr, array() );
			}
		}
	}
}

// ensure custom field types missing from stored settings are present
$current_custom_fields = array_merge( $custom_fields, $settings['customfields'] );

// / field Overloading

?>

<p id="sbDesc"><?php esc_html_e( 'Using this page you can add or edit custom fields for your CRM', 'zero-bs-crm' ); ?></p>

<?php
if ( isset( $sbupdated ) && $sbupdated ) {
	echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">';
	zeroBSCRM_html_msg( 0, __( 'Custom Fields Updated', 'zero-bs-crm' ) );
	echo '</div>';
}

?>

<div id="sbA" class="zbs-settings-custom-fields">

	<form method="post" action="?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=customfields">
		<input type="hidden" name="editwplf" id="editwplf" value="1" />
		<?php

		// loading here is shown until custom fields drawn, then this loader hidden and all .zbs-generic-loaded shown
		echo jpcrm_loading_container(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		// add nonce
		wp_nonce_field( 'zbs-update-settings-customfields' );

		foreach ( $custom_field_table_data as $object_key => $object_val ) {
			if ( ! $object_val['is_visible'] ) {
				continue;
			}
			?>
			<table class="table table-bordered table-striped wtab zbs-generic-loaded">
				<thead>
					<tr>
						<th colspan="2" class="wmid"><?php echo esc_html( $object_val['table_title'] ); ?>:</th>
					</tr>

				</thead>

				<tbody id="zbscrm-<?php echo esc_attr( $object_key ); ?>-custom-fields">

					<tr>
						<td colspan="2" style="text-align:right"><button type="button" id="zbscrm-addcustomfield-<?php echo esc_attr( $object_key ); ?>" class="ui small blue button">+ <?php esc_html_e( 'Add Custom Field', 'zero-bs-crm' ); ?></button></td>
					</tr>

				</tbody>

			</table>
			<?php
		}
		?>

		<table class="table table-bordered table-striped wtab zbs-generic-loaded">
			<tbody>
				<tr>
					<td class="wmid"><button type="submit" class="ui button primary"><?php esc_html_e( 'Save Custom Fields', 'zero-bs-crm' ); ?></button></td>
				</tr>
			</tbody>
		</table>
		<p style="text-align:center" class="zbs-generic-loaded">
			<i class="info icon"></i> <?php esc_html_e( 'Looking for default fields & statuses?', 'zero-bs-crm' ); ?> <a href="<?php echo esc_url( admin_url( 'admin.php?page=' . $zbs->slugs['settings'] . '&tab=fieldoptions' ) ); ?>"><?php esc_html_e( 'Click here for Field Options', 'zero-bs-crm' ); ?></a>
		</p>

	</form>

	<script type="text/javascript">

		// all custom js moved to admin.settings.js 12/3/19 :)

		var wpzbscrmCustomFields = <?php echo json_encode( $current_custom_fields ); ?>;
		var wpzbscrmAcceptableTypes = <?php echo json_encode( $acceptableCFTypes ); ?>;
		var wpzbscrm_settings_page = 'customfields'; // this fires init js in admin.settings.min.js
		var wpzbscrm_settings_lang = {

			customfield:'<?php zeroBSCRM_slashOut( __( 'Custom Field', 'zero-bs-crm' ) ); ?>',
			remove:     '<?php zeroBSCRM_slashOut( __( 'Remove', 'zero-bs-crm' ) ); ?>',
			tel:        '<?php zeroBSCRM_slashOut( __( 'Telephone', 'zero-bs-crm' ) ); ?>',
			numbdec:    '<?php zeroBSCRM_slashOut( __( 'Numeric (Decimals)', 'zero-bs-crm' ) ); ?>',
			numb:       '<?php zeroBSCRM_slashOut( __( 'Numeric', 'zero-bs-crm' ) ); ?>',
			placeholder:'<?php zeroBSCRM_slashOut( __( 'Placeholder', 'zero-bs-crm' ) ); ?>',
			csvopt:     '<?php zeroBSCRM_slashOut( __( "CSV of Options (e.g. 'a,b,c')", 'zero-bs-crm' ) ); ?>',
			fieldname:  '<?php zeroBSCRM_slashOut( __( 'Field Name', 'zero-bs-crm' ) ); ?>',
			fieldplacehold:'<?php zeroBSCRM_slashOut( __( 'Field Placeholder Text', 'zero-bs-crm' ) ); ?>',
			fileboxname: '<?php zeroBSCRM_slashOut( __( 'File Box Name', 'zero-bs-crm' ) ); ?>',
			password:   '<?php zeroBSCRM_slashOut( __( 'Password', 'zero-bs-crm' ) ); ?>',
			encryptedtext: '<?php zeroBSCRM_slashOut( __( 'Encrypted Text', 'zero-bs-crm' ) ); ?>',
			radiobuttons: '<?php zeroBSCRM_slashOut( __( 'Radio Buttons', 'zero-bs-crm' ) ); ?>',
			prefix:     '<?php zeroBSCRM_slashOut( __( 'Prefix', 'zero-bs-crm' ) ); ?>',
			nextnumber: '<?php zeroBSCRM_slashOut( __( 'Next Number', 'zero-bs-crm' ) ); ?>',
			suffix:     '<?php zeroBSCRM_slashOut( __( 'Suffix', 'zero-bs-crm' ) ); ?>',
			prefixe:     '<?php zeroBSCRM_slashOut( __( '(e.g. ABC-)', 'zero-bs-crm' ) ); ?>',
			nextnumbere: '<?php zeroBSCRM_slashOut( __( '(e.g. 1)', 'zero-bs-crm' ) ); ?>',
			suffixe:     '<?php zeroBSCRM_slashOut( __( '(e.g. -FINI)', 'zero-bs-crm' ) ); ?>',
			fieldtype:   '<?php zeroBSCRM_slashOut( __( 'Field Type:', 'zero-bs-crm' ) ); ?>',
			autonumberformat:   '<?php zeroBSCRM_slashOut( __( 'Autonumber Format', 'zero-bs-crm' ) ); ?>',
			autonumberguide:   '<?php zeroBSCRM_slashOut( __( 'Autonumber Guide', 'zero-bs-crm' ) ); ?>',

		};
		var wpzbscrm_settings_urls = {

			autonumberhelp: '<?php echo esc_html( $zbs->urls['autonumberhelp'] ); ?>'

		};

	</script>

</div>
