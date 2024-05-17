<?php
/*
!
 * Single contact view page
 */
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Render the page
 */
function zeroBSCRM_render_add_or_edit_file() {

	global $zbs;

	$customer = -1;
	if ( isset( $_GET['customer'] ) ) {
		$customer = (int) sanitize_text_field( $_GET['customer'] );
	}
	// or company...
	$company = -1;
	if ( isset( $_GET['company'] ) ) {
		$company = (int) sanitize_text_field( $_GET['company'] );
	}

	$is_adding_file = false;
	$fileid         = '';
	// fileid can be 0 (zero). So we can't use the 'empty' function here.
	if ( isset( $_GET['fileid'] ) && $_GET['fileid'] !== '' ) {
		$fileid = (int) sanitize_text_field( $_GET['fileid'] );
	} elseif ( isset( $_POST['fileid'] ) && $_POST['fileid'] !== '' ) {
		$fileid = (int) sanitize_text_field( $_POST['fileid'] );
	} else {
		$is_adding_file = true;
	}

	if ( $customer > 0 || $company > 0 ) {

		// customer and file passed as variables. Allow us to edit the file title, description, show on portal, etc.

		$file_owner_html = '';

		if ( $customer > 0 ) {
			$zbsFiles    = zeroBSCRM_getCustomerFiles( $customer );
			$crm_contact = $zbs->DAL->contacts->getContact( $customer );
			$avatar_mode = zeroBSCRM_getSetting( 'avatarmode' );
			if ( $avatar_mode == '2' || $avatar_mode == '3' ) {
				$avatar_url           = $zbs->DAL->contacts->getContactAvatar( $customer );
				$view_url_contact     = jpcrm_esc_link( 'view', -1, 'zerobs_customer', true ) . $customer;
				$file_owner_html     .= '<h4 class="ui image header" style="margin:0px;">';
				$file_owner_html     .= '<img src="' . esc_attr( $avatar_url ) . '" id="profile-picture-img" class="ui mini rounded image" />';
				$file_owner_html     .= '<div class="content"><a href="' . esc_url( $view_url_contact ) . '">' . esc_html( $crm_contact['fullname'] ) . '</a>';
					$file_owner_html .= ! empty( $crm_contact['email'] ) ? '<div class="sub header">' . esc_html( $crm_contact['email'] ) . '</div>' : '';

				// $file_owner_html .= '<b> ' . $crm_contact['fullname'] . ' </b><br>';
				// $file_owner_html .= isset( $crm_contact['email'] ) && ! empty( $crm_contact['email'] ) ? '<b> ' . $crm_contact['email'] . ' </b><br>' : '';
				$file_owner_html .= '</h4><br />';
			}
		} elseif ( $company > 0 ) {
			$zbsFiles = zeroBSCRM_files_getFiles( 'company', $company );
		}

		$originalSlot = -1;
		$title        = ! empty( $_POST['title'] ) ? sanitize_text_field( $_POST['title'] ) : '';
		$desc         = ! empty( $_POST['desc'] ) ? sanitize_text_field( $_POST['desc'] ) : '';
		$portal       = ! empty( $_POST['fileportal'] ) ? (int) sanitize_text_field( $_POST['fileportal'] ) : '';
		$slot         = ! empty( $_POST['fileslot'] ) ? sanitize_text_field( $_POST['fileslot'] ) : '';

		if ( ! $is_adding_file ) {
			$ourFile = $zbsFiles[ $fileid ];
			if ( $customer > 0 ) {
				$originalSlot = zeroBSCRM_fileslots_fileSlot( $ourFile['file'], $customer, ZBS_TYPE_CONTACT );
			}
		} else {
			$fileid  = '';
			$ourFile = array();
		}

		if (
			isset( $_POST['save'] )
			&& $_POST['save'] == -1
			&& isset( $_POST['_wpnonce'] )
			&& wp_verify_nonce( $_POST['_wpnonce'], 'jpcrm-edit-file-info' )
		) {
			$ourFile['desc']   = $desc;
			$ourFile['title']  = $title;
			$ourFile['portal'] = $portal;

			$error_while_adding = false;

			if ( $is_adding_file && $customer > 0 ) {

				if ( ! jpcrm_file_check_mime_extension( $_FILES['zbsc_file_attachment'] ) ) {

					echo '<br>';
					echo "<div class='ui message red' style='margin-right:20px'><i class='icon info'></i> " . esc_html( __( 'Error: File type not accepted.', 'zero-bs-crm' ) ) . '</div>';
					$error_while_adding = true;
				} else {
					$crm_contact      = $zbs->DAL->contacts->getContact( $customer );
					$contact_dir_info = jpcrm_storage_dir_info_for_contact( $customer );
					if ( ! $contact_dir_info ) {
						echo "<div class='ui message red' style='margin-right:20px'><i class='icon info'></i> " . esc_html( __( 'Error: Unable to retrieve the contact\'s folder.', 'zero-bs-crm' ) ) . '</div>';
						$error_while_adding = true;
					} else {

						$upload = jpcrm_save_admin_upload_to_folder( 'zbsc_file_attachment', $contact_dir_info['files'] );

						if ( isset( $upload['error'] ) && $upload['error'] != 0 ) {
							echo "<div class='ui message red' style='margin-right:20px'><i class='icon info'></i> ";
							echo sprintf( esc_html__( 'There was an error uploading your file: %s', 'zero-bs-crm' ), esc_html( $upload['error'] ) );
							echo '</div>';
							$error_while_adding = true;
						} else {
							// if it everything went ok adds the file to the list
							$new_upload                  = array();
							$new_upload['file']          = $upload['file'];
							$new_upload['url']           = $upload['url'];
							$new_upload['type']          = $upload['type'];
							$new_upload['error']         = $upload['error'];
							$new_upload['priv']          = $ourFile['portal'];
							$new_upload['portal']        = $ourFile['portal'];
							$new_upload['title']         = $ourFile['title'];
							$new_upload['desc']          = $ourFile['desc'];
							$new_upload['owner']         = get_current_user_id();
							$new_upload['creation_date'] = time();

							$zbsFiles = zeroBSCRM_getCustomerFiles( $customer );
							if ( is_array( $zbsFiles ) ) {
								$zbsFiles[] = $new_upload;
							} else {
								$zbsFiles = array( $new_upload );
							}
							zeroBSCRM_updateCustomerFiles( $customer, $zbsFiles );

							// updating the references
							$fileid = array_key_last( $zbsFiles );

							$ourFile = $new_upload;
							// file was successfully added!
							$is_adding_file = false;
						}
					}
				}
			}

			if ( ! $error_while_adding ) {

				$ourFile = apply_filters( 'zbs_cpp_fileedit_save', $ourFile, $_POST );

				$zbsFiles[ $fileid ] = $ourFile;

				if ( $customer > 0 ) {
					zeroBSCRM_updateCustomerFiles( $customer, $zbsFiles );
				} elseif ( $company > 0 ) {
					zeroBSCRM_files_updateFiles( 'company', $company, $zbsFiles );
				}

				// if slot, update manually (custs only)
				if ( ! isset( $_POST['noslot'] ) && $customer > 0 ) {
					// this'll empty the slot, if it previously had one and moved to new, or emptied
					// means 1 slot : 1 file
					if ( ! empty( $originalSlot ) && $slot != $originalSlot ) {
						zeroBSCRM_fileslots_clearFileSlot( $originalSlot, $customer, ZBS_TYPE_CONTACT );
					}
					// some slot
					// this will OVERRITE whatevers in that slot
					if ( ! empty( $slot ) && $originalSlot != $slot && $slot !== -1 ) {
						zeroBSCRM_fileslots_addToSlot( $slot, $ourFile['file'], $customer, ZBS_TYPE_CONTACT, true );
					}
					// reget
					$originalSlot = zeroBSCRM_fileslots_fileSlot( $ourFile['file'], $customer, ZBS_TYPE_CONTACT );
				}

				echo "<div class='ui message blue' style='margin-right:20px'><i class='icon info'></i> " . esc_html( __( 'Details saved', 'zero-bs-crm' ) ) . '</div>';
			}
		}

		if ( ! $is_adding_file ) {
			$file = zeroBSCRM_files_baseName( $ourFile['file'], isset( $ourFile['priv'] ) );
		}

		?>

		<div class = "ui segment zbs-cp-file-edit-page">
			<?php

			// CPP thumb support. If file exists, display here
			if ( ! $is_adding_file && function_exists( 'zeroBSCRM_cpp_getThumb' ) ) {

				$thumb = zeroBSCRM_cpp_getThumb( $ourFile );
				if ( ! empty( $thumb ) ) {

					// hacky solution to avoid shadow on 'filetype' default imgs
					$probablyFileType = false;
					if ( strpos( $thumb, 'i/filetypes/' ) > 0 ) {
						$probablyFileType = true;
					}

					echo '<img src="' . esc_url( $thumb ) . '" alt="' . esc_attr( __( 'File Thumbnail', 'zero-bs-crm' ) ) . '" class="zbs-file-thumb';
					if ( $probablyFileType ) {
						echo ' zbs-cp-file-img-default';
					}
					echo '" />';
				}
			}

			if ( $is_adding_file ) :
				?>
			<h4><?php echo esc_html( __( 'Adding New File', 'zero-bs-crm' ) ); ?></h4>
				<?php
			else :
				?>
			<h4><?php echo esc_html( __( 'Edit File Details', 'zero-bs-crm' ) ); ?></h4>
				<?php
			endif;
			?>

			<form class="ui form" enctype="multipart/form-data" method="POST" action="#">
				<?php
				wp_nonce_field( 'jpcrm-edit-file-info' );
				echo $file_owner_html;
				?>

				<?php if ( $is_adding_file ) : ?>
					<p>
						<label for="zbsc_file_attachment">
							<?php echo esc_html( __( 'Choose file', 'zero-bs-crm' ) ); ?>
						</label>
						<br />
						<input type="file" id="zbsc_file_attachment" name="zbsc_file_attachment" size="25" class="zbs-dc">
						<em>(<?php echo esc_html( __( 'Accepted File Types', 'zero-bs-crm' ) ); ?>: <?php echo esc_html( zeroBS_acceptableFileTypeListStr() ); ?>)</em>
						<br />
					</p>
					<?php
				else :
					?>
					<p>
						<?php echo esc_html( __( 'You are editing details for the following file:', 'zero-bs-crm' ) ); ?>
						<br/>
						<em><?php echo esc_html( $file ); ?>
						(<a href="<?php echo esc_url( $ourFile['url'] ); ?>" target="_blank"><?php echo esc_html( __( 'View file', 'zero-bs-crm' ) ); ?></a>)</em>
					</p>
				<?php endif; ?>

				<input type="hidden" id="fileid" name="fileid" value="<?php echo esc_attr( $fileid ); ?>" />

				<label for="title"><?php echo esc_html( __( 'Title', 'zero-bs-crm' ) ); ?></label>
				<input class="ui field input" id="title" name="title" value="<?php echo ! empty( $ourFile['title'] ) ? esc_attr( $ourFile['title'] ) : ''; ?>" />

				<label for="desc"><?php echo esc_html( __( 'Description', 'zero-bs-crm' ) ); ?></label>
				<textarea class="ui field textarea" id="desc" name="desc"><?php echo ! empty( $ourFile['desc'] ) ? esc_attr( $ourFile['desc'] ) : ''; ?></textarea>

				<?php if ( defined( 'ZBS_CLIENTPRO_TEMPLATES' ) && $customer > 0 ) { ?>
					<label for="fileportal"><?php echo esc_html( __( 'Show on Client Portal', 'zero-bs-crm' ) ); ?></label>
					<select class="ui field select" id="fileportal" name="fileportal">
							<option value="0"
							<?php
							if ( isset( $ourFile['portal'] ) && $ourFile['portal'] == 0 ) {
								echo ' selected';}
							?>
							><?php echo esc_html( __( 'No', 'zero-bs-crm' ) ); ?></option>
							<option value="1"
							<?php
							if ( isset( $ourFile['portal'] ) && $ourFile['portal'] == 1 ) {
								echo ' selected';}
							?>
							><?php echo esc_html( __( 'Yes', 'zero-bs-crm' ) ); ?></option>
					</select>
					<?php
				} else {

					// no client portal pro, so UPSELL :)

					##WLREMOVE
					// only get admins!
					if ( current_user_can( 'admin_zerobs_manage_options' ) && $customer > 0 ) {
						?>
						<label><?php echo esc_html( __( 'Show on Client Portal', 'zero-bs-crm' ) ); ?></label>
						<div style="margin-bottom:1em;line-height: 1.8em"><input type="checkbox" name="fileportal" disabled="disabled" />&nbsp;&nbsp;<a href="<?php echo esc_url( $zbs->urls['upgrade'] ); ?>?utm_content=inplugin-fileedit" target="_blank"><?php echo esc_html( __( 'Upgrade to a Bundle', 'zero-bs-crm' ) ); ?></a> <?php echo esc_html( __( '(and get Client Portal Pro) to enable this', 'zero-bs-crm' ) ); ?>.</div>
																																										<?php
					}
					##/WLREMOVE

				}

				if ( $customer > 0 ) {
					// File slots

					// Custom file attachment boxes
					$fileSlots = zeroBSCRM_fileSlots_getFileSlots();
					// get all slots (to show 'overrite' warning)
					$allFilesInSlots = zeroBSCRM_fileslots_allSlots( $customer, ZBS_TYPE_CONTACT );

					if ( count( $fileSlots ) > 0 ) {

						?>
						<label for="fileslot"><?php echo esc_html( __( 'Assign to Custom File Upload Box', 'zero-bs-crm' ) ); ?></label>
						<select class="ui field select" id="fileslot" name="fileslot">
							<option value="-1"><?php echo esc_html( __( 'None', 'zero-bs-crm' ) ); ?></option>
															<?php

															foreach ( $fileSlots as $cfb ) {

																$nExtra = '';
																if ( $originalSlot != $cfb['key'] && isset( $allFilesInSlots[ $cfb['key'] ] ) && ! empty( $allFilesInSlots[ $cfb['key'] ] ) ) {
																	$nExtra = ' (' . __( 'Current file', 'zero-bs-crm' ) . ': ' . zeroBSCRM_files_baseName( $allFilesInSlots[ $cfb['key'] ], true ) . ')';
																}

																echo '<option value="' . esc_attr( $cfb['key'] ) . '"';
																if ( isset( $originalSlot ) && $originalSlot == $cfb['key'] ) {
																	echo ' selected="selected"';
																}
																echo '>' . esc_html( $cfb['name'] . $nExtra ) . '</option>';

															}

															?>
						</select>
						<?php

					} else {
						echo '<input type="hidden" name="noslot" value="noslot" />';
					}
				}
				?>

				<?php
				// Client portal pro integration
				do_action( 'zbs_cpp_fileedit', $ourFile );
				?>
				<input type="hidden" value="-1" id="save" name="save"/>

				<input type="submit" class="ui button blue" value="<?php echo esc_attr( __( 'Save details', 'zero-bs-crm' ) ); ?>"/>

			</form>

		</div>



		<?php

	} // if cid
}
