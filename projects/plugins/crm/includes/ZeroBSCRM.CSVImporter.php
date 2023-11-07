<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 07/03/2017
 */

/*
======================================================
	Breaking Checks ( stops direct access )
	====================================================== */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}
/*
======================================================
	/ Breaking Checks
	====================================================== */

/*
// } #coreintegration - MOVED to core.extensions

// } Log with main core (Has to be here, outside of all funcs)
// } Note, this function permacode (e.g. woo) needs to have a matching function for settings page named "zeroBSCRM_extensionhtml_settings_woo" (e.g.)
global $zeroBSCRM_extensionsInstalledList;
if (!is_array($zeroBSCRM_extensionsInstalledList)) $zeroBSCRM_extensionsInstalledList = array();
$zeroBSCRM_extensionsInstalledList[] = 'csvimporterlite'; #woo #pay #env
// } Super simpz function to return this extensions name to core (for use on settings tabs etc.)
function zeroBSCRM_extension_name_csvimporterlite(){ return 'CSV Importer LITE'; }
*/

	// } IMPORTANT FOR SETTINGS EXTENSIONS MODEL!
	// } Unique str for each plugin extension, e.g. "mail" or "wooimporter" (lower case no numbers or spaces/special chars)
	$zeroBSCRM_CSVImporterconfigkey = 'csvimporterlite';
	$zeroBSCRM_extensions[]         = $zeroBSCRM_CSVImporterconfigkey;

	global $zeroBSCRM_CSVImporterLiteslugs;
$zeroBSCRM_CSVImporterLiteslugs            = array();
	$zeroBSCRM_CSVImporterLiteslugs['app'] = 'zerobscrm-csvimporterlite-app'; // NOTE: this should now be ignored, use $zbs->slugs['csvlite'] as is WL friendly

	global $zeroBSCRM_CSVImporterLiteversion;
	$zeroBSCRM_CSVImporterLiteversion = '2.0';

/*
No settings included in CSV Importer LITE - pro only :)
// } If legit... #CORELOADORDER
if (!defined('ZBSCRMCORELOADFAILURE')){

	#} Should be safe as called from core

	#} Settings Model. req. > v1.1

		#} Init settings model using your defaults set in the file above
		#} Note "zeroBSCRM_extension_extensionName_defaults" var below must match your var name in the config.
		global $zeroBSCRM_CSVImporterSettings, $zeroBSCRM_extension_extensionName_defaults;
		$zeroBSCRM_CSVImporterSettings = new WHWPConfigExtensionsLib($zeroBSCRM_CSVImporterconfigkey,$zeroBSCRM_extension_extensionName_defaults);

} */

// CA: Block commented because the issue #1116 about a Woocommerce - JPCRM import conflict
/*
function zeroBSCRM_CSVImporterLite_extended_upload ( $mime_types =array() ) {

	//$mime_types['csv']  = "text/csv";
	//wonder it actually this..
	$mime_types['csv']  = "text/plain";

	return $mime_types;
} */
// add_filter('upload_mimes', 'zeroBSCRM_CSVImporterLite_extended_upload');

// } Add le admin menu
function zeroBSCRM_CSVImporterLiteadmin_menu() {

	global $zbs,$zeroBSCRM_CSVImporterLiteslugs; // req

	wp_register_style( 'zerobscrm-csvimporter-admcss', ZEROBSCRM_URL . 'css/ZeroBSCRM.admin.csvimporter' . wp_scripts_get_suffix() . '.css', array(), $zbs->version );
	$csv_admin_page = add_submenu_page( 'jpcrm-hidden', 'CSV Importer', 'CSV Importer', 'admin_zerobs_customers', $zbs->slugs['csvlite'], 'zeroBSCRM_CSVImporterLitepages_app', 1 ); // phpcs:ignore WordPress.WP.Capabilities.Unknown
	add_action( "admin_print_styles-{$csv_admin_page}", 'zeroBSCRM_CSVImporter_lite_admin_styles' );
	add_action( "admin_print_styles-{$csv_admin_page}", 'zeroBSCRM_global_admin_styles' ); // } and this.
}
add_action( 'zerobs_admin_menu', 'zeroBSCRM_CSVImporterLiteadmin_menu' );

function zeroBSCRM_CSVImporter_lite_admin_styles() {
	wp_enqueue_style( 'zerobscrm-csvimporter-admcss' );
}

// ================== Admin Pages

// } Admin Page header
function zeroBSCRM_CSVImporterLitepages_header( $subpage = '' ) {

	global $wpdb, $zbs, $zeroBSCRM_CSVImporterLiteversion;  // } Req

	if ( ! current_user_can( 'admin_zerobs_customers' ) ) {
		wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) ); }

	?>

<div id="sgpBody">

	<div id="ZeroBSCRMAdminPage" class="ui segment">

<h1><?php echo ( empty( $subpage ) ? '' : esc_html( $subpage ) ); ?></h1>
	<?php

	// } Check for required upgrade
	// zeroBSCRM_CSVImportercheckForUpgrade();
}

// } Admin Page footer
function zeroBSCRM_CSVImporterLitepages_footer() {

	?>
	</div>
	<?php
}

// } Main Uploader Page
function zeroBSCRM_CSVImporterLitepages_app() {

	global $wpdb, $zbs, $zeroBSCRM_CSVImporterLiteversion;  // } Req

	if ( ! current_user_can( 'admin_zerobs_customers' ) ) {
		wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) ); }

	// } Homepage
	zeroBSCRM_CSVImporterLitehtml_app();

	// } Footer
	zeroBSCRM_CSVImporterLitepages_footer();

	?>
</div>
	<?php
}

// catch errors with nonce or other oddities
function jpcrm_csvimporter_lite_preflight_checks( $stage ) {

	if ( ! isset( $_POST['zbscrmcsvimportnonce'] ) || ! wp_verify_nonce( $_POST['zbscrmcsvimportnonce'], 'zbscrm_csv_import' ) ) {
		// hard no
		zeroBSCRM_html_msg( -1, __( 'There was an error processing your CSV file. Please try again.', 'zero-bs-crm' ) );
		exit();
	}

	// eventually update this to use the zbscrm-store/_wip replacement
	// apparently sys_get_temp_dir() isn't consistent on whether it has a trailing slash
	$tmp_dir = untrailingslashit( sys_get_temp_dir() );
	$tmp_dir = realpath( $tmp_dir ) . '/';

	$field_map = array();

	if ( $stage == 1 ) {

		if ( empty( $_FILES['zbscrmcsvfile'] ) || empty( $_FILES['zbscrmcsvfile']['name'] ) ) {
			throw new Exception( __( 'No CSV file was provided. Please choose the CSV file you want to upload.', 'zero-bs-crm' ) );
		}

		$csv_file_data = $_FILES['zbscrmcsvfile'];

		// error uploading
		if ( $csv_file_data['error'] !== UPLOAD_ERR_OK ) {
			throw new Exception( __( 'There was an error processing your CSV file. Please try again.', 'zero-bs-crm' ) );
		}

		// verify file extension and MIME
		if ( ! jpcrm_file_check_mime_extension( $csv_file_data, '.csv', array( 'text/csv', 'text/plain', 'application/csv' ) ) ) {
			throw new Exception( __( 'Your file is not a correctly-formatted CSV file. Please check your file format. If you continue to have issues please contact support.', 'zero-bs-crm' ) );
		}

		/*
			The main goal below is to have a file that can be read in future steps, but also that is unreadable to the public.

			Things to be aware of:
			- If we don't move/rename the file, PHP automatically deletes it at the end of the process.
			- The hash/encryption is overkill at the moment but exists in case the destination folder is publicly available (see 2435-gh).
			- For now, we just rename the file and leave it in the system tmp folder, but eventually we can move it to the zbscrm-store replacement.
		*/

		$public_name = basename( $csv_file_data['tmp_name'] );

		$hashed_filename = jpcrm_get_hashed_filename( $public_name, '.csv' );
		$file_path       = $tmp_dir . $hashed_filename;

		// try to move file to destination for future processing
		if ( ! move_uploaded_file( $csv_file_data['tmp_name'], $file_path ) ) {
			throw new Exception( __( 'Unable to upload CSV file.', 'zero-bs-crm' ) );
		}
	}

	// Check stage 2 and 3
	if ( $stage === 2 || $stage === 3 ) {

		// (carefully) check for file presence
		$public_name = ( isset( $_POST['zbscrmcsvimpf'] ) ? sanitize_file_name( $_POST['zbscrmcsvimpf'] ) : '' );

		if ( empty( $public_name ) ) {
			throw new Exception( __( 'There was an error processing your CSV file. Please try again.', 'zero-bs-crm' ) );
		}

		$hashed_filename = jpcrm_get_hashed_filename( $public_name, '.csv' );
		$file_path       = $tmp_dir . $hashed_filename;

		// Retrieve fields
		$field_map          = array();
		$mapped_field_count = 0;
		for ( $fieldI = 0; $fieldI <= 30; $fieldI++ ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

			// Default to ignore
			$map_to = 'ignorezbs';

			// Map :)
			if ( ! empty( $_POST[ 'zbscrm-csv-fieldmap-' . $fieldI ] ) && $_POST[ 'zbscrm-csv-fieldmap-' . $fieldI ] !== -1 ) {

				$map_to = sanitize_text_field( $_POST[ 'zbscrm-csv-fieldmap-' . $fieldI ] );

				// Count actual mapped fields
				if ( $map_to != 'ignorezbs' ) {
					++$mapped_field_count;
				}

				// Pass it.
				$field_map[ $fieldI ] = $map_to;

			}
		}

		// no fields were mapped
		if ( $mapped_field_count === 0 ) {
			// delete the file
			unlink( $file_path );
			throw new Exception( __( 'No fields were mapped. You cannot import contacts without at least one field mapped to a contact attribute.', 'zero-bs-crm' ) );
		}
	}

	// Now that we only pass the filename via POST, and we encrypt+hash it, the following few lines are probably
	// no longer needed, but leaving for now
	$file_path = realpath( $file_path );
	// This ensures that the provided file exists and is inside the upload folder or one of its subdirs (ie `/wp-content/uploads/*`)
	// and not somewhere else, also prevent traversal attacks, and usage of wrappers like phar:// etc
	if ( $file_path === false || ! str_starts_with( $file_path, $tmp_dir ) ) {
		// Traversal attempt, file does not exist, invalid wrapper
		throw new Exception( __( 'There was an error processing your CSV file. Please try again.', 'zero-bs-crm' ) );
	}

	$csv_data = array();

	$file = fopen( $file_path, 'r' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
	while ( ! feof( $file ) ) {
		$csv_data[] = fgetcsv( $file );
	}

	fclose( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose

	// no lines or empty first line
	if ( empty( $csv_data ) ) {
		// delete the file
		unlink( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		throw new Exception( __( 'We did not find any usable lines in the provided file. If you are having continued problems please contact support.', 'zero-bs-crm' ) );
	}

	// Count lines
	$num_lines         = count( $csv_data );
	$ignore_first_line = isset( $_POST['zbscrmcsvimpignorefirst'] );
	if ( $ignore_first_line ) {
		--$num_lines;
	}

	$file_details = array(
		'public_name'       => $public_name,
		'filename'          => $hashed_filename,
		'file_path'         => $file_path,
		'csv_data'          => $csv_data,
		'num_lines'         => $num_lines,
		'ignore_first_line' => $ignore_first_line,
		'field_map'         => $field_map,
	);

	return $file_details;
}

// } HTML for main app
function zeroBSCRM_CSVImporterLitehtml_app() {

	global $zbsCustomerFields, $zeroBSCRM_CSVImporterLiteslugs,  $zbs;// ,$zeroBSCRM_CSVImporterSettings;

	// $settings = $zeroBSCRM_CSVImporterSettings->getAll();
	$default_status    = $zbs->settings->get( 'defaultstatus' );
	$settings          = array(
		'savecopy'              => false,
		'defaultcustomerstatus' => $default_status ? $default_status : __( 'Customer', 'zero-bs-crm' ),
	);
	$saveCopyOfCSVFile = false; // Not in LITE : ) if (isset($settings['savecopy'])) $saveCopyOfCSVFile = $settings['savecopy'];

	// } 3 stages:
	// } - Upload
	// } - Map
	// } - Complete (button)
	// } - Process
	$stage = 0;
	if ( ! empty( $_POST['zbscrmcsvimpstage'] ) ) {
		$stage = (int) $_POST['zbscrmcsvimpstage'];
	}

	if ( in_array( $stage, array( 1, 2, 3 ) ) ) {
		try {
			// check nonce and other things
			$file_details = jpcrm_csvimporter_lite_preflight_checks( $stage );
		} catch ( Exception $e ) {
			// send back to beginning and show error
			$stage      = 0;
			$stageError = $e->getMessage();
		}
	}

	switch ( $stage ) {

		case 1:
			// } Title
			zeroBSCRM_CSVImporterLitepages_header( __( 'Step 2: Map Fields', 'zero-bs-crm' ) );

			?>
			<div class="zbscrm-csvimport-wrap">
				<h2><?php esc_html_e( 'Map columns from your CSV to contact fields', 'zero-bs-crm' ); ?></h2>
				<?php
				if ( isset( $stageError ) && ! empty( $stageError ) ) {
					zeroBSCRM_html_msg( -1, $stageError ); }
				?>
				<div class="zbscrm-csv-map">
					<p class="zbscrm-csv-map-help"><?php esc_html_e( 'Your CSV file has been successfully uploaded. Please map your CSV columns to their corresponding CRM fields with the drop down options below.', 'zero-bs-crm' ); ?></p>
					<form method="post" class="zbscrm-csv-map-form">
						<input type="hidden" id="zbscrmcsvimpstage" name="zbscrmcsvimpstage" value="2" />
						<input type="hidden" id="zbscrmcsvimpf" name="zbscrmcsvimpf" value="<?php echo esc_attr( $file_details['public_name'] ); ?>" />
						<?php wp_nonce_field( 'zbscrm_csv_import', 'zbscrmcsvimportnonce' ); ?>

						<hr />
						<div class="zbscrm-csv-map-ignorefirst">
							<input type="checkbox" id="zbscrmcsvimpignorefirst" name="zbscrmcsvimpignorefirst" value="1" />
							<label for="zbscrmcsvimpignorefirst" ><?php echo esc_html__( 'Ignore first line of CSV file when running import.', 'zero-bs-crm' ) . '<br />' . esc_html__( 'Use this if you have a "header line" in your CSV file.', 'zero-bs-crm' ); ?></label>
						</div>
						<hr />

						<?php
						// print_r($fileDetails);

							// } Cycle through each field and display a mapping option
							// } Using first line of import
							$first_line_parts = $file_details['csv_data'][0];

							// } Retrieve possible map fields from fields model
							$possibleFields = array();
						foreach ( $zbsCustomerFields as $fieldKey => $fieldDeets ) {

							// not custom-fields
							if ( ! isset( $fieldDeets['custom-field'] ) ) {
								$possibleFields[ $fieldKey ] = __( $fieldDeets[1], 'zero-bs-crm' );
							}

							if ( in_array( $fieldKey, array( 'secaddr1', 'secaddr2', 'seccity', 'seccounty', 'seccountry', 'secpostcode' ) ) ) {
								$possibleFields[ $fieldKey ] .= ' (' . __( '2nd Address', 'zero-bs-crm' ) . ')';
							}
						}

							// } Loop
							$indx = 1;
						foreach ( $first_line_parts as $userField ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

							// } Clean user field - ""
							if ( str_starts_with( $userField, '"' ) && str_ends_with( $userField, '"' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
								$userField = substr( $userField, 1, strlen( $userField ) - 2 );
							}
							// } Clean user field - ''
							if ( str_starts_with( $userField, "'" ) && str_ends_with( $userField, "'" ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
								$userField = substr( $userField, 1, strlen( $userField ) - 2 );
							}

							?>
									<div class="zbscrm-csv-map-field">
										<span><?php echo esc_html_x( 'Map', 'As in map CSV column to field', 'zero-bs-crm' ); ?>:</span> <div class="zbscrm-csv-map-user-field">"<?php echo esc_html( $userField ); ?>"</div><br />
										<div class="zbscrm-csv-map-zbs-field">
											<span class="to"><?php esc_html_e( 'To:', 'zero-bs-crm' ); ?></span> <select name="zbscrm-csv-fieldmap-<?php echo esc_attr( $indx ); ?>" id="zbscrm-csv-fieldmap-<?php echo esc_attr( $indx ); ?>">
												<option value="-1" disabled="disabled"><?php esc_html_e( 'Select a field', 'zero-bs-crm' ); ?></option>
												<option value="-1" disabled="disabled">==============</option>
												<option value="ignorezbs" selected="selected"><?php esc_html_e( 'Ignore this field', 'zero-bs-crm' ); ?></option>
												<option value="-1" disabled="disabled">==============</option>
										<?php foreach ( $possibleFields as $fieldID => $fieldTitle ) { ?>
												<option value="<?php echo esc_attr( $fieldID ); ?>"><?php esc_html_e( $fieldTitle, 'zero-bs-crm' ); ?></option>
											<?php } ?>
											</select>
										</div>
									</div>
								<?php

								++$indx;

						}

						?>
							<hr />
						<div style="text-align:center">
							<button type="submit" name="csv-map-submit" id="csv-map-submit" class="ui button button-primary button-large green" type="submit"><?php esc_html_e( 'Continue', 'zero-bs-crm' ); ?></button>	
						</div>
					</form>
				</div>
			</div>
			<?php

			break;
		case 2:
			// Title
			zeroBSCRM_CSVImporterLitepages_header( __( 'Step 3: Run Import', 'zero-bs-crm' ) );

			// Stolen from plugin-install.php?tab=upload
			?>
			<div class="zbscrm-csvimport-wrap">
				<h2>Verify field mapping</h2>
				<?php
				if ( isset( $stageError ) && ! empty( $stageError ) ) {
					zeroBSCRM_html_msg( -1, $stageError ); }
				?>
				<div class="zbscrm-confirmimport-csv">
					<div>
						<?php
						// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						echo zeroBSCRM_html_msg( 1, esc_html__( 'Note: There is no automatic way to undo a CSV import. To remove any contacts that have been added you will need to manually remove them.', 'zero-bs-crm' ) );
						?>
					<form method="post" enctype="multipart/form-data" class="zbscrm-csv-import-form">
						<input type="hidden" id="zbscrmcsvimpstage" name="zbscrmcsvimpstage" value="3" />
						<input type="hidden" id="zbscrmcsvimpf" name="zbscrmcsvimpf" value="<?php echo esc_attr( $file_details['public_name'] ); ?>" />
						<?php wp_nonce_field( 'zbscrm_csv_import', 'zbscrmcsvimportnonce' ); ?>
						<h3>Import <?php echo esc_html( zeroBSCRM_prettifyLongInts( $file_details['num_lines'] ) ); ?> Contacts</h3>
						<hr />
						<?php if ( $file_details['ignore_first_line'] ) { ?>
							<p style="font-size:16px;text-align:center;">Ignore first line of CSV <i class="fa fa-check"></i></p>
							<hr />
							<input type="hidden" id="zbscrmcsvimpignorefirst" name="zbscrmcsvimpignorefirst" value="1" />
						<?php } ?>
						<p style="font-size:16px;text-align:center;">Map the following fields:</p>
						<?php

						// Cycle through each field
						// Using first line of import
						$first_line_parts = $file_details['csv_data'][0];

						foreach ( $file_details['field_map'] as $fieldID => $fieldTarget ) {

							$fieldTargetName = $fieldTarget;
							if ( isset( $zbsCustomerFields[ $fieldTarget ] ) && isset( $zbsCustomerFields[ $fieldTarget ][1] ) && ! empty( $zbsCustomerFields[ $fieldTarget ][1] ) ) {
								$fieldTargetName = __( $zbsCustomerFields[ $fieldTarget ][1], 'zero-bs-crm' );
							}

							if ( in_array( $fieldTarget, array( 'secaddr1', 'secaddr2', 'seccity', 'seccounty', 'seccountry', 'secpostcode' ) ) ) {
								$fieldTargetName .= ' (' . __( '2nd Address', 'zero-bs-crm' ) . ')';
							}

							$fromStr = '';
							if ( isset( $first_line_parts[ $fieldID - 1 ] ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
								$fromStr = $first_line_parts[ $fieldID - 1 ]; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							}

							// Clean user field - ""
							if ( str_starts_with( $fromStr, '"' ) && str_ends_with( $fromStr, '"' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
								$fromStr = substr( $fromStr, 1, strlen( $fromStr ) - 2 );
							}
							// Clean user field - ''
							if ( str_starts_with( $fromStr, "'" ) && str_ends_with( $fromStr, "'" ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
								$fromStr = substr( $fromStr, 1, strlen( $fromStr ) - 2 );
							}

							?>
								<input type="hidden" id="zbscrm-csv-fieldmap-<?php echo esc_attr( $fieldID - 1 ); ?>" name="zbscrm-csv-fieldmap-<?php echo esc_attr( $fieldID - 1 ); ?>" value="<?php echo esc_attr( $fieldTarget ); ?>" />
								<div class="zbscrm-impcsv-map">
									<div class="zbscrm-impcsv-from">
									<?php
									if ( ! empty( $fromStr ) ) {
										echo '"' . esc_html( $fromStr ) . '"';
									} else {
										echo esc_html( sprintf( __( 'Field #%s', 'zero-bs-crm' ), $fieldID ) );
									}
									?>
									</div>
									<div class="zbscrm-impcsv-arrow">
									<?php
									if ( $fieldTarget != 'ignorezbs' ) {
										echo '<i class="fa fa-long-arrow-right"></i>';
									} else {
										echo '-';
									}
									?>
									</div>
									<div class="zbscrm-impcsv-to">
									<?php
									if ( $fieldTarget != 'ignorezbs' ) {
										echo '"' . esc_html( $fieldTargetName ) . '"';
									} else {
										esc_html_e( 'Ignore', 'zero-bs-crm' );
									}
									?>
									</div>
								</div>
							<?php

						}

						?>
						<hr />
						<div style="text-align:center">
							<button type="submit" name="csv-map-submit" id="csv-map-submit" class="ui button button-primary button-large green" type="submit"><?php esc_html_e( 'Run import', 'zero-bs-crm' ); ?></button>	
						</div>
					</form>
				</div>
			</div>
			<?php

			break;

		case 3:
			// } Title
			zeroBSCRM_CSVImporterLitepages_header( __( 'Step 4: Import', 'zero-bs-crm' ) );

			?>
			<div class="zbscrm-csvimport-wrap">
				<h2 id="jpcrm_final_step_heading"><?php esc_html_e( 'Running import...', 'zero-bs-crm' ); ?></h2>
				<?php
				if ( isset( $stageError ) && ! empty( $stageError ) ) {
					zeroBSCRM_html_msg( -1, $stageError ); }
				?>
				<div class="zbscrm-final-stage" style="text-align: center;">
					<p>New contacts added: <span id="jpcrm_new_contact_count">0</span></p>
					<p>Existing contacts updated: <span id="jpcrm_update_contact_count">0</span></p>
					<button id="jpcrm_toggle_log_button" class="ui button grey"><?php esc_html_e( 'Toggle log', 'zero-bs-crm' ); ?></button>
					<a id="jpcrm_import_finish_button" href="<?php echo jpcrm_esc_link( $zbs->slugs['managecontacts'] ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>" class="ui button green hidden"><?php esc_html_e( 'Finish', 'zero-bs-crm' ); ?></a>
				</div>
					<div id="jpcrm_import_log_div" class="zbscrm-import-log hidden">
						<div class="zbscrm-import-log-line"><?php esc_html_e( 'Loading CSV File...', 'zero-bs-crm' ); ?> <i class="fa fa-check"></i></div>
						<div class="zbscrm-import-log-line"><?php esc_html_e( 'Parsing rows...', 'zero-bs-crm' ); ?> <i class="fa fa-check"></i></div>
						<div class="zbscrm-import-log-line"><?php echo esc_html( sprintf( __( 'Beginning Import of %s rows...', 'zero-bs-crm' ), zeroBSCRM_prettifyLongInts( $file_details['num_lines'] ) ) ); ?></div>
						<?php

							// } Cycle through
							$lineIndx       = 0;
						$linesAdded         = 0;
						$existingOverwrites = array();
						$brStrs             = array( '<br>', '<BR>', '<br />', '<BR />', '<br/>', '<BR/>' );
						foreach ( $file_details['csv_data'] as $lineParts ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

							// } Check line
							if ( $lineIndx === 0 && $file_details['ignore_first_line'] ) {

								echo '<div class="zbscrm-import-log-line">' . esc_html__( 'Skipping header row...', 'zero-bs-crm' ) . '<i class="fa fa-check"></i></div>';

							} else {

								// } build arr
								$customerFields = array();
								// } Catch first if there

								foreach ( $file_details['field_map'] as $fieldID => $fieldTarget ) {

									// } id
									$fieldIndx = $fieldID;

									// } Anything to set?
									if (

											// data in line
											isset( $lineParts[ $fieldIndx ] ) && ! empty( $lineParts[ $fieldIndx ] ) &&

											// isn't ignore
											$fieldTarget != 'ignorezbs'

										) {

										// for <br> passes, we convert them to nl
										$cleanUserField = str_replace( $brStrs, "\r\n", $lineParts[ $fieldIndx ] );

										$cleanUserField = trim( $cleanUserField );

										if ( $cleanUserField == 'NULL' ) {
											$cleanUserField = '';
										}

										$cleanUserField = sanitize_text_field( $cleanUserField ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

										// } set customer fields
										$customerFields[ 'zbsc_' . $fieldTarget ] = $cleanUserField;

									}
								}

								// } Any legit fields?
								if ( count( $customerFields ) > 0 ) {

									// } Try and find a unique id for this user
									// adjusted for backward-compatibility, but this should be rewritten
									$userUniqueID = md5( implode( ',', $lineParts ) . '#' . $file_details['public_name'] ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

										// } 1st use email if there
									if ( isset( $customerFields['zbsc_email'] ) && ! empty( $customerFields['zbsc_email'] ) ) {
										$userUniqueID = $customerFields['zbsc_email'];
									}

										// } else use md5 of the line + Filename

									// } If no STATUS have to add one!
									$status_override_value = null;
									if ( ! isset( $customerFields['zbsc_status'] ) ) {

										// } Get from setting, if present
										if ( isset( $settings['defaultcustomerstatus'] ) && ! empty( $settings['defaultcustomerstatus'] ) ) {
											$status_override_value = $settings['defaultcustomerstatus'];
										} else {
											$status_override_value = 'Contact';
										}
									}

									// } Already exists? (This is only used to find dupes
									$potentialCustomerID = zeroBS_getCustomerIDWithExternalSource( 'csv', $userUniqueID );
									if ( ! empty( $potentialCustomerID ) && $potentialCustomerID > 0 ) {

										$thisDupeRef = '#' . $potentialCustomerID;
										if ( isset( $customerFields['zbsc_email'] ) && ! empty( $customerFields['zbsc_email'] ) ) {
											$thisDupeRef .= ' (' . $customerFields['zbsc_email'] . ')';
										}

										$existingOverwrites[] = $thisDupeRef;
									}

									if ( ! empty( $potentialCustomerID ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
										// We could modify `zeroBS_integrations_addOrUpdateCustomer`
										// to touch only on the fields we are passing to the function,
										// but that function is used in other places and this could
										// result in unwanted side effects.
										// Instead we are passing all original fields
										// to the function, and overriding only the ones
										// we want.
										$original_contact = $zbs->DAL->contacts->getContact( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
											$potentialCustomerID, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
											array(
												'withCustomFields' => true,
												'ignoreowner' => true,
											)
										);
										foreach ( $original_contact as $original_key => $original_value ) {
											// We need to prefix all fields coming from the above function, because
											// `zeroBS_integrations_addOrUpdateCustomer` expects the fields to be prefixed
											// (this is an older function).
											$original_contact[ 'zbsc_' . $original_key ] = $original_value;
											unset( $original_contact[ $original_key ] );
										}
										$customerFields = array_merge( $original_contact, $customerFields ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
									} else {
										// We should override the status only when adding a new contact.
										$customerFields['zbsc_status'] = ! empty( $status_override_value ) ? $status_override_value : $customerFields['zbsc_status']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
									}

									// } Add customer
									$newCustID = zeroBS_integrations_addOrUpdateCustomer( 'csv', $userUniqueID, $customerFields );

									if ( ! empty( $newCustID ) && empty( $potentialCustomerID ) ) {

										++$linesAdded;

										// } Line
										echo '<div class="zbscrm-import-log-line">' .
																									sprintf(
																										__( 'Successfully added contact #<a href="%1$s" target="_blank">%2$d</a>... <i class="fa fa-user"></i><span>+1</span>', 'zero-bs-crm' ),
																										jpcrm_esc_link( 'edit', $newCustID, 'contact', false, false ),
																										esc_html( $newCustID )
																									)
																								. '</div>';

									} else {

										// dupe overriten?
										if ( ! empty( $potentialCustomerID ) ) {

											// } Line
											echo '<div class="zbscrm-import-log-line">' . esc_html__( 'Contact Already Exists!:', 'zero-bs-crm' ) . ' #' . esc_html( $newCustID ) . '... <i class="fa fa-user"></i><span>[' . esc_html__( 'Updated', 'zero-bs-crm' ) . ']</span></div>';

										}
									}
								} else {

									echo '<div class="zbscrm-import-log-line">' . esc_html__( 'Skipping row (no usable fields)', 'zero-bs-crm' ) . '... <i class="fa fa-check"></i></div>';

								}
							}

							++$lineIndx;

						}

							// any of these?
						if ( count( $existingOverwrites ) > 0 ) {

							echo '<div class="zbscrm-import-log-line"><strong>' . esc_html__( 'The following contacts were already in your Jetpack CRM, and were updated:', 'zero-bs-crm' ) . '</strong></div>';

							foreach ( $existingOverwrites as $l ) {

								echo '<div class="zbscrm-import-log-line">' . $l . '</div>';
							}
						}

						if ( $file_details['file_path'] ) {
							unlink( $file_details['file_path'] );
						}
							echo '<div class="zbscrm-import-log-line">' . esc_html__( 'CSV Upload File Deleted...', 'zero-bs-crm' ) . '<i class="fa fa-check"></i></div>';

						?>
						<hr />
					</div>
			</div>
			<script>
				// these are some quick hacks for better usability until the importer rewrite

				function jpcrm_toggle_csv_log() {
					document.getElementById('jpcrm_import_log_div').classList.toggle('hidden');
				}

				document.getElementById('jpcrm_toggle_log_button').addEventListener('click',jpcrm_toggle_csv_log);
				document.getElementById('jpcrm_final_step_heading').innerHTML = '<?php esc_html_e( 'Import complete!', 'zero-bs-crm' ); ?>';
				document.getElementById('jpcrm_new_contact_count').innerHTML = <?php echo esc_html( $linesAdded ); /* phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase */ ?>;
				document.getElementById('jpcrm_update_contact_count').innerHTML = <?php echo esc_html( count( $existingOverwrites ) ); /* phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase */ ?>;
				document.getElementById('jpcrm_import_finish_button').classList.remove('hidden');
			</script>
			<?php

			break;
		default: // } Also case 0
			// } Title
			zeroBSCRM_CSVImporterLitepages_header( __( 'Step 1: Upload', 'zero-bs-crm' ) );

			// } Stolen from plugin-install.php?tab=upload
			?>
			<div class="zbscrm-csvimport-wrap">
				<h2><?php esc_html_e( 'Import contacts from a CSV file', 'zero-bs-crm' ); ?></h2>
				<?php
				if ( isset( $stageError ) && ! empty( $stageError ) ) {
					zeroBSCRM_html_msg( -1, $stageError ); }
				?>
				<div class="zbscrm-upload-csv">
					<p class="zbscrm-csv-import-help"><?php esc_html_e( 'If you have a CSV file of contacts that you would like to import into Jetpack CRM, you can start the import wizard by uploading your .CSV file here.', 'zero-bs-crm' ); ?></p>
					<form method="post" enctype="multipart/form-data" class="zbscrm-csv-import-form">
						<input type="hidden" id="zbscrmcsvimpstage" name="zbscrmcsvimpstage" value="1" />
						<?php wp_nonce_field( 'zbscrm_csv_import', 'zbscrmcsvimportnonce' ); ?>
						<label class="screen-reader-text" for="zbscrmcsvfile"><?php esc_html_e( '.CSV file', 'zero-bs-crm' ); ?></label>
						<input type="file" id="zbscrmcsvfile" name="zbscrmcsvfile">
						<div class="csv-import__start-btn">
							<input type="submit" name="csv-file-submit" id="csv-file-submit" class="ui button black" value="<?php esc_attr_e( 'Upload CSV file', 'zero-bs-crm' ); ?>">
						</div>
					</form>
				</div>
			</div>
			<?php

			// } Lite upsell (remove from rebrander) but also make it translation OK.
			##WLREMOVE

				// WH added: Is now polite to License-key based settings like 'entrepreneur' doesn't try and upsell
				// this might be a bit easy to "hack out" hmmmm
				$bundle = false;
			if ( $zbs->hasEntrepreneurBundleMin() ) {
				$bundle = true;
			}

			if ( ! $bundle ) {
				?>
					<hr style="margin-top:40px" />
					<div class="zbscrm-lite-notice">
						<h2><?php esc_html_e( 'CSV Importer: Lite Version', 'zero-bs-crm' ); ?></h2>
						<p><?php echo wp_kses( sprintf( __( 'If you would like to benefit from more features (such as logging your imports, automatically creating companies (B2B), and direct support) then please purchase a copy of our <a href="%s" target="_blank">CSV Importer PRO</a> extension.', 'zero-bs-crm' ), esc_url( $zbs->urls['extcsvimporterpro'] ) ), $zbs->acceptable_restricted_html ); ?><br /><br /><a href="<?php echo esc_url( $zbs->urls['extcsvimporterpro'] ); ?>" target="_blank" class="ui button blue large"><?php esc_html_e( 'Get CSV Importer PRO', 'zero-bs-crm' ); ?></a></p>

					</div>
					<?php

			} else {

				// has bundle should download + install
				?>
					<hr style="margin-top:40px" />
					<div class="zbscrm-lite-notice">
						<h2><?php esc_html_e( 'CSV Importer: Lite Version', 'zero-bs-crm' ); ?></h2>
						<p><?php echo wp_kses( sprintf( __( 'You have the PRO version of CSV importer available as part of your bundle. Please download and install from <a href="%s" target="_blank">your account</a>.', 'zero-bs-crm' ), esc_url( $zbs->urls['account'] ) ), $zbs->acceptable_restricted_html ); ?></p>
					</div>
					<?php
			}
			##/WLREMOVE

			break;

	}
}
