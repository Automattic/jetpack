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
	$csvAdminPage = add_submenu_page( null, 'CSV Importer', 'CSV Importer', 'admin_zerobs_customers', $zbs->slugs['csvlite'], 'zeroBSCRM_CSVImporterLitepages_app', 1 ); // $zeroBSCRM_CSVImporterLiteslugs['app']
	add_action( "admin_print_styles-{$csvAdminPage}", 'zeroBSCRM_CSVImporter_lite_admin_styles' );
	add_action( "admin_print_styles-{$csvAdminPage}", 'zeroBSCRM_global_admin_styles' ); // } and this.
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


	<script type="text/javascript">

		jQuery(function($){

		jQuery('.learn')
			.popup({
			inline: false,
			on:'click',
			lastResort: 'bottom right',
		});

		});
	</script>

	<div id="zbs-admin-top-bar">
		<div id="zbs-list-top-bar">
			<div class="zbs-white"><span class="add-new-button">
			<?php
			esc_html_e( 'CSV Importer Lite', 'zero-bs-crm' );
			if ( ! empty( $subpage ) ) {
				echo esc_html( ': ' . $subpage );}
			?>
			</span>
			<div class="ui button grey tiny learn" id="learn"><i class="fa fa-graduation-cap" aria-hidden="true"></i> Learn</div>
			<div class="ui special popup top left transition hidden" id="learn-pop">
				<h3 class="learn-h3"><?php esc_html_e( 'Import contacts from CSV', 'zero-bs-crm' ); ?></h3>
				<div class="content">
				<p>
					<?php esc_html_e( 'If you have contacts you need to import to Jetpack CRM, doing so via a CSV is a quick and easy way to get your data in.', 'zero-bs-crm' ); ?>
				</p>
				<p>
					<strong><?php esc_html_e( 'Formatting Tips', 'zero-bs-crm' ); ?></strong> <?php esc_html_e( "it's important that you format your CSV file correctly for the upload. We have written a detailed guide on how to do this below.", 'zero-bs-crm' ); ?> 
				</p>

				<?php
				##WLREMOVE
				if ( ! empty( $zbs->urls['extcsvimporterpro'] ) ) {
					?>

						<p><?php esc_html_e( 'Want to import companies as well as keep a record of your imports.', 'zero-bs-crm' ); ?>
						<a href="<?php echo esc_url( $zbs->urls['extcsvimporterpro'] ); ?>" target="_blank">
						<?php esc_html_e( 'CSV importer PRO is the perfect tool.', 'zero-bs-crm' ); ?></a></p>

					<?php
				}
				##/WLREMOVE
				?>

				<br/>
				<?php
				##WLREMOVE
				?>
				<a href="<?php echo esc_url( $zbs->urls['kbcsvformat'] ); ?>" target="_blank" class="ui button orange"><?php esc_html_e( 'Learn More', 'zero-bs-crm' ); ?></a>
				<?php
				##/WLREMOVE
				?>
				</div>
				<div class="video">
		
					<!--
					<iframe src="https://www.youtube.com/embed/2YAO7hEICwk?ecver=2" width="385" height="207" frameborder="0" gesture="media" allow="encrypted-media" allowfullscreen style="margin-top:-15px;"></iframe>
					-->
				</div>
			</div>

			<?php if ( ! empty( $zbs->urls['extcsvimporterpro'] ) ) { ?>
				<a href="<?php echo esc_url( $zbs->urls['extcsvimporterpro'] ); ?>" target="_blank" class="ui button blue tiny" id="gopro"><?php esc_html_e( 'Get CSV Importer Pro', 'zero-bs-crm' ); ?></a>
			<?php } ?>

			</div>
		</div>
		</div>


<div id="sgpBody">

	<div id="ZeroBSCRMAdminPage" class="ui segment">
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

	// } Header
	// } Moved into page to control subtitle zeroBSCRM_CSVImporterLitepages_header();

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
		if ( ! jpcrm_file_check_mime_extension( $csv_file_data, '.csv', array( 'text/csv', 'text/plain' ) ) ) {
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
	if ( $file_path === false || strpos( $file_path, $tmp_dir ) !== 0 ) {
		// Traversal attempt, file does not exist, invalid wrapper
		throw new Exception( __( 'There was an error processing your CSV file. Please try again.', 'zero-bs-crm' ) );
	}

	// Get CSV data
	$csv_data = file_get_contents( $file_path );

	// no lines or empty first line
	if ( empty( $csv_data ) ) {
		// delete the file
		unlink( $file_path );
		throw new Exception( __( 'We did not find any usable lines in the provided file. If you are having continued problems please contact support.', 'zero-bs-crm' ) );
	}

	$csv_data = strip_tags( $csv_data );
	$csv_data = preg_split( "/\\r\\n|\\r|\\n/", $csv_data );

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
			zeroBSCRM_CSVImporterLitepages_header( '2. Map Fields' );

			?>
			<div class="zbscrm-csvimport-wrap">
				<h2><?php esc_html_e( 'Map Columns from your CSV to Contact Fields', 'zero-bs-crm' ); ?></h2>
				<?php
				if ( isset( $stageError ) && ! empty( $stageError ) ) {
					zeroBSCRM_html_msg( -1, $stageError ); }
				?>
				<div class="zbscrm-csv-map">
					<p class="zbscrm-csv-map-help"><?php esc_html_e( 'Your CSV File has been successfully uploaded. Before we can complete your import, you\'ll need to specify which field in your CSV file matches which field in your CRM.<br />You can do so by using the drop down options below:', 'zero-bs-crm' ); ?></p>
					<form method="post" class="zbscrm-csv-map-form">
						<input type="hidden" id="zbscrmcsvimpstage" name="zbscrmcsvimpstage" value="2" />
						<input type="hidden" id="zbscrmcsvimpf" name="zbscrmcsvimpf" value="<?php echo esc_attr( $file_details['public_name'] ); ?>" />
						<?php wp_nonce_field( 'zbscrm_csv_import', 'zbscrmcsvimportnonce' ); ?>

						<hr />
						<div class="zbscrm-csv-map-ignorefirst">
							<input type="checkbox" id="zbscrmcsvimpignorefirst" name="zbscrmcsvimpignorefirst" value="1" />
							<label for="zbscrmcsvimpignorefirst" ><?php echo esc_html__( 'Ignore first line of CSV file when running import.', 'zero-bs-crm' ) . '<br />' . esc_html__( 'Use this if you have a "header line" in your CSV file.)', 'zero-bs-crm' ); ?></label>
						</div>
						<hr />

						<?php
						// print_r($fileDetails);

							// } Cycle through each field and display a mapping option
							// } Using first line of import
							$firstLine      = $file_details['csv_data'][0];
							$firstLineParts = explode( ',', $firstLine );

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
						foreach ( $firstLineParts as $userField ) {

							// } Clean user field - ""
							if ( substr( $userField, 0, 1 ) == '"' && substr( $userField, -1 ) == '"' ) {
								$userField = substr( $userField, 1, strlen( $userField ) - 2 );
							}
							// } Clean user field - ''
							if ( substr( $userField, 0, 1 ) == "'" && substr( $userField, -1 ) == "'" ) {
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
							<button type="submit" name="csv-map-submit" id="csv-map-submit" class="button button-primary button-large" type="submit"><?php esc_html_e( 'Continue', 'zero-bs-crm' ); ?></button>	
						</div>
					</form>
				</div>
			</div>
			<?php

			break;
		case 2:
			// Title
			zeroBSCRM_CSVImporterLitepages_header( '3. Run Import' );

			// Stolen from plugin-install.php?tab=upload
			?>
			<div class="zbscrm-csvimport-wrap">
				<h2>Complete Contact Import</h2>
				<?php
				if ( isset( $stageError ) && ! empty( $stageError ) ) {
					zeroBSCRM_html_msg( -1, $stageError ); }
				?>
				<div class="zbscrm-confirmimport-csv">
					<p class="zbscrm-csv-help"><?php __( 'Ready to run the import.<br />Please confirm the following is correct <i>before</i> continuing.', 'zero-bs-crm' ); ?><br /></p>
					<div style="">
						<?php
						// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
						echo zeroBSCRM_html_msg( 1, __( 'Note: There is no easy way to "undo" a CSV import. To remove any contacts that have been added you will need to manually remove them.', 'zero-bs-crm' ) );
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
						$firstLine      = $file_details['csv_data'][0];
						$firstLineParts = explode( ',', $firstLine );

						foreach ( $file_details['field_map'] as $fieldID => $fieldTarget ) {

							$fieldTargetName = $fieldTarget;
							if ( isset( $zbsCustomerFields[ $fieldTarget ] ) && isset( $zbsCustomerFields[ $fieldTarget ][1] ) && ! empty( $zbsCustomerFields[ $fieldTarget ][1] ) ) {
								$fieldTargetName = __( $zbsCustomerFields[ $fieldTarget ][1], 'zero-bs-crm' );
							}

							if ( in_array( $fieldTarget, array( 'secaddr1', 'secaddr2', 'seccity', 'seccounty', 'seccountry', 'secpostcode' ) ) ) {
								$fieldTargetName .= ' (' . __( '2nd Address', 'zero-bs-crm' ) . ')';
							}

							$fromStr = '';
							if ( isset( $firstLineParts[ $fieldID - 1 ] ) ) {
								$fromStr = $firstLineParts[ $fieldID - 1 ];
							}

							// Clean user field - ""
							if ( substr( $fromStr, 0, 1 ) == '"' && substr( $fromStr, -1 ) == '"' ) {
								$fromStr = substr( $fromStr, 1, strlen( $fromStr ) - 2 );
							}
							// Clean user field - ''
							if ( substr( $fromStr, 0, 1 ) == "'" && substr( $fromStr, -1 ) == "'" ) {
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
							<button type="submit" name="csv-map-submit" id="csv-map-submit" class="button button-primary button-large" type="submit"><?php esc_html_e( 'Run Import', 'zero-bs-crm' ); ?></button>	
						</div>
					</form>
				</div>
			</div>
			<?php

			break;

		case 3:
			// } Title
			zeroBSCRM_CSVImporterLitepages_header( '4. Import' );

			?>
			<div class="zbscrm-csvimport-wrap">
				<h2><?php esc_html_e( 'Running Import...', 'zero-bs-crm' ); ?></h2>
				<?php
				if ( isset( $stageError ) && ! empty( $stageError ) ) {
					zeroBSCRM_html_msg( -1, $stageError ); }
				?>
				<div class="zbscrm-final-stage">
					<div class="zbscrm-import-log">
						<div class="zbscrm-import-log-line"><?php esc_html_e( 'Loading CSV File...', 'zero-bs-crm' ); ?> <i class="fa fa-check"></i></div>
						<div class="zbscrm-import-log-line"><?php esc_html_e( 'Parsing rows...', 'zero-bs-crm' ); ?> <i class="fa fa-check"></i></div>
						<div class="zbscrm-import-log-line"><?php echo esc_html( sprintf( __( 'Beginning Import of %s rows...', 'zero-bs-crm' ), zeroBSCRM_prettifyLongInts( $file_details['num_lines'] ) ) ); ?></div>
						<?php

							// } Cycle through
							$lineIndx       = 0;
						$linesAdded         = 0;
						$existingOverwrites = array();
						$brStrs             = array( '<br>', '<BR>', '<br />', '<BR />', '<br/>', '<BR/>' );
						foreach ( $file_details['csv_data'] as $line ) {

							// } Check line
							if ( $lineIndx === 0 && $file_details['ignore_first_line'] ) {

								echo '<div class="zbscrm-import-log-line">' . esc_html__( 'Skipping header row...', 'zero-bs-crm' ) . '<i class="fa fa-check"></i></div>';

							} else {

								// } split
								$lineParts = explode( ',', $line );
								// debug echo '<pre>'; print_r(array($lineParts,$fieldMap)); echo '</pre>';

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

										// } Clean user field - ""
										if ( substr( $cleanUserField, 0, 1 ) == '"' && substr( $cleanUserField, -1 ) == '"' ) {
											$cleanUserField = substr( $cleanUserField, 1, strlen( $cleanUserField ) - 2 );
										}
										// } Clean user field - ''
										if ( substr( $cleanUserField, 0, 1 ) == "'" && substr( $cleanUserField, -1 ) == "'" ) {
											$cleanUserField = substr( $cleanUserField, 1, strlen( $cleanUserField ) - 2 );
										}

										if ( $cleanUserField == 'NULL' ) {
											$cleanUserField = '';
										}

										// } set customer fields
										$customerFields[ 'zbsc_' . $fieldTarget ] = $cleanUserField;

									}
								}

								// } Any legit fields?
								if ( count( $customerFields ) > 0 ) {

									// } Try and find a unique id for this user
									$userUniqueID = md5( $line . '#' . $file_details['public_name'] );

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
						<button type="button" class="button button-primary button-large" onclick="javascript:window.location='admin.php?page=<?php echo esc_attr( $zbs->slugs['datatools'] ); ?>';"><?php esc_html_e( 'Finish', 'zero-bs-crm' ); ?></button>
					</div>
				</div>
			</div>
			<?php

			break;
		default: // } Also case 0
			// } Title
			zeroBSCRM_CSVImporterLitepages_header( '1. Upload' );

			// } Stolen from plugin-install.php?tab=upload
			?>
			<div class="zbscrm-csvimport-wrap">
				<h2><?php esc_html_e( 'Import Contacts from a CSV File', 'zero-bs-crm' ); ?></h2>
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
							<input type="submit" name="csv-file-submit" id="csv-file-submit" class="ui button green" value="<?php esc_attr_e( 'Start CSV Import Now', 'zero-bs-crm' ); ?>">
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
