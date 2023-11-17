<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 01/11/16
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */




/* ======================================================
  Acceptible Mime Types
   ====================================================== */

	#} A list of applicable Mimetypes for file uploads
	function zeroBSCRM_returnMimeTypes(){ 
		return array(
										'pdf' => array('application/pdf'),
										'doc' => array('application/msword'),
										'docx' => array('application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
										'ppt' => array('application/vnd.ms-powerpointtd>'),
										'pptx' => array('application/vnd.openxmlformats-officedocument.presentationml.presentation'),
										'xls' => array('application/vnd.ms-excel'),
										'xlsx' => array('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
										'csv' => array('text/csv'),
										'png' => array('image/png'),
										'jpg' => array('image/jpeg'),
										'jpeg' => array('image/jpeg'),
										'gif' => array('image/gif'),
										'mp3' => array('audio/mpeg'),
										'txt' => array('text/plain'),
										'zip' => array('application/zip', 'application/x-compressed-zip'),
										'mp4' => array('video/mp4')
												# plus 'any'
			);
	}
	
	/* 
	 * Returns the extension for the provided mimetype, false otherwise.
	 */
	function jpcrm_return_ext_for_mimetype( $mimetype ) {
		global $zbs;
		$all_types = $zbs->acceptable_mime_types;
		
		foreach( $all_types as $extension => $ext_mimetypes ) {
			foreach( $ext_mimetypes as $this_mimetype ) {
				if ( $this_mimetype === $mimetype ) {
					return $extension;
				}
			}
		}

		return false;
	}

/* ======================================================
  / Acceptible Mime Types
   ====================================================== */





/* ======================================================
  File Upload Related Funcs
   ====================================================== */

	// str e.g. .pdf, .xls
	function zeroBS_acceptableFileTypeListStr(){

		$ret = '';
	  
		global $zbs;

		#} Retrieve settings
		$settings = $zbs->settings->getAll();
		
		if (isset($settings['filetypesupload'])) {

			if (isset($settings['filetypesupload']['all']) && $settings['filetypesupload']['all'] == 1){

				$ret = __( 'All File Types', 'zero-bs-crm' );

			} else {

				foreach ($settings['filetypesupload'] as $filetype => $enabled){

					if (isset($settings['filetypesupload'][$filetype]) && $enabled == 1) {

						if (!empty($ret)) $ret .= ', ';

						$ret .= '.'.$filetype;

					}

				} 

			}

		}

		if (empty($ret)) $ret = 'No Uploads Allowed';

		return $ret;
	}

	function zeroBS_acceptableFileTypeListArr(){

		$ret = array();
	  
		global $zbs;

		#} Retrieve settings
		$settings = $zbs->settings->getAll();
		
		if (isset($settings['filetypesupload'])) 
			foreach ($settings['filetypesupload'] as $filetype => $enabled){

				if (isset($settings['filetypesupload'][$filetype]) && $enabled == 1) $ret[] = '.'.$filetype;

			} 

		return $ret;
	}

	function zeroBS_acceptableFileTypeMIMEArr(){

		$ret = array();
	  
		global $zbs;

		#} Retrieve settings
		$settings = $zbs->settings->getAll();
		
		// if all, pass that
		if ( isset( $settings['filetypesupload'] ) && isset($settings['filetypesupload']['all']) && $settings['filetypesupload']['all'] == 1){

			return array('all'=>1);

		}
		if (isset($settings['filetypesupload'])) {
			if (isset($settings['filetypesupload']['all']) && $settings['filetypesupload']['all'] == 1) {
				// add all
				foreach ($settings['filetypesupload'] as $filetype => $enabled){
					$ret = array_merge( $ret, $zbs->acceptable_mime_types[$filetype] );
				}
			} else {
				// individual
				foreach ($settings['filetypesupload'] as $filetype => $enabled) {
					if ( isset( $settings['filetypesupload'][$filetype] ) && $enabled == 1 ) {
						$ret = array_merge( $ret, $zbs->acceptable_mime_types[$filetype] );
					}
				}
			}
		}

		return $ret;
	}

	/**
	 * Returns an array with all the mime types accepted for uploads from 
	 * contacts.
	 */
	function jpcrm_acceptable_filetype_mime_array_from_contacts() {
		global $zbs;

		$ret = array();
		$settings = $zbs->settings->getAll();
		if ( isset( $settings['filetypesupload'] ) ) {
			foreach ( $settings['filetypesupload'] as $filetype => $enabled ) {
				if ( 
					$enabled == 1 
					&& isset( $settings['filetypesupload'][$filetype] ) 
					&& isset( $zbs->acceptable_mime_types[$filetype] ) 
				) {
					$ret = array_merge( $ret, $zbs->acceptable_mime_types[$filetype] );
				}
			}
		}

		return $ret;
	}


	function jpcrm_acceptable_file_type_list_str_for_contact() {
		$ret = '';
	  
		global $zbs;

		$settings = $zbs->settings->getAll();
		
		if ( isset( $settings['filetypesupload'] ) && is_array( $settings['filetypesupload'] ) ) {
			foreach ($settings['filetypesupload'] as $filetype => $enabled){
				if (isset($settings['filetypesupload'][$filetype]) && $enabled == 1 && $filetype !== 'all') {
					if (!empty($ret)) $ret .= ', ';
					$ret .= '.'.$filetype;
				}
			} 
		}
		if (empty($ret)) $ret = 'No Uploads Allowed';

		return $ret;
	}


	#} removes a link to file (quote, invoice, other)
	// not always customer id... sometimes inv/co etc.
	function zeroBS_removeFile($objectID=-1,$fileType='',$fileURL=''){

	  	if ( current_user_can( 'admin_zerobs_customers' ) ) {   //only admin can do this too (extra security layer)

	  		global $zbs;

			if ($objectID !== -1 && !empty($fileURL)){
				
				/* centralised into zeroBSCRM_files_getFiles
				switch ($fileType){

					case 'customer':

						$filesArrayKey = 'zbs_customer_files';

						break;
					case 'quotes':

						$filesArrayKey = 'zbs_customer_quotes';

						break;
					case 'invoices':

						$filesArrayKey = 'zbs_customer_invoices';

						break;
				} */

				#} good?
				// zeroBSCRM_files_getFiles if (isset($filesArrayKey)){
				if (in_array($fileType, array('customer','quotes','invoices','company'))){

					#} First remove list reference:

						#} any change?
						$changeFlag = false; $fileObjToDelete = false;

						#} Load files arr

						/* centralised into zeroBSCRM_files_getFiles
						// for DAL1 contacts + quotes/invs:
						if (!$zbs->isDAL2() || $filesArrayKey == 'zbs_customer_quotes' || $filesArrayKey == 'zbs_customer_invoices') // DAL1
							$filesList = get_post_meta($objectID, $filesArrayKey, true);
						else // DAL2
							$filesList = $zbs->DAL->contacts->getContactMeta($objectID,'files');
						*/
						$filesList = zeroBSCRM_files_getFiles($fileType,$objectID);


						if (is_array($filesList) && count($filesList) > 0){

							#} defs
							$ret = array();
							
							#} Cycle through and remove any with this url - lame, but works for now
							foreach ($filesList as $fileObj){

								if ($fileObj['url'] != $fileURL) 
									$ret[] = $fileObj;
								else {
									$fileObjToDelete = $fileObj;
									$changeFlag = true;

									// also, if the removed file(s) are logged in any slots, clear the slot :)
    								$slot = zeroBSCRM_fileslots_fileSlot($fileObj['file'],$objectID,ZBS_TYPE_CONTACT);
    								if ($slot !== false && !empty($slot)){
										zeroBSCRM_fileslots_clearFileSlot($slot,$objectID,ZBS_TYPE_CONTACT);
									}
								}

							}

							if ($changeFlag) {

								/* zeroBSCRM_files_updateFiles 
								// for DAL1 contacts + quotes/invs:
								if (!$zbs->isDAL2() || $filesArrayKey == 'zbs_customer_quotes' || $filesArrayKey == 'zbs_customer_invoices') // DAL1
									update_post_meta($objectID,$filesArrayKey,$ret);
								else // DAL2
									$zbs->DAL->updateMeta(ZBS_TYPE_CONTACT,$objectID,'files',$ret);
								*/
								zeroBSCRM_files_updateFiles($fileType,$objectID,$ret);

							}

						} #} else w/e

					#} Then delete actual file ... 
					if ($changeFlag && isset($fileObjToDelete) && isset($fileObjToDelete['file'])){

						#} Brutal 
						#} #recyclingbin
						if (file_exists($fileObjToDelete['file'])) {

							#} Delete
							unlink($fileObjToDelete['file']);

							#} Check if deleted:
							if (file_exists($fileObjToDelete['file'])){

								// try and be more forceful:
								chmod($fileObjToDelete['file'], 0777);
								unlink(realpath($fileObjToDelete['file']));

								if (file_exists($fileObjToDelete['file'])){
									
									// tone down perms, at least
									chmod($fileObjToDelete['file'], 0644);

									// add message
									return __('Could not delete file from server:','zero-bs-crm').' '.$fileObjToDelete['file'];

								}

							}

						}

					}

					return true;

				}


			}

		} #} / can manage options


		return false;
	}

  

/* ======================================================
  	File Upload related funcs
   ====================================================== */

   function zeroBSCRM_privatiseUploadedFile($fromPath='',$filename=''){

   		#} Check dir created
   		$currentUploadDirObj = zeroBSCRM_privatisedDirCheck();
		if (is_array($currentUploadDirObj) && isset($currentUploadDirObj['path'])){ 
			$currentUploadDir = $currentUploadDirObj['path'];
			$currentUploadURL = $currentUploadDirObj['url'];
		} else {
			$currentUploadDir = false;
			$currentUploadURL = false;
		}

   		if (!empty($currentUploadDir)){

   			// generate a safe name + check no file existing
   			// this is TEMP code to be rewritten on formally secure file sys WH
   			$filePreHash = md5($filename.time());
   			// actually limit to first 16 chars is plenty
   			$filePreHash = substr($filePreHash,0,16);
   			$finalFileName = $filePreHash.'-'.$filename;
   			$finalFilePath = $currentUploadDir.'/'.$finalFileName;

   			// check exists, deal with (unlikely) dupe names
   			$c = 1;
   		 	while (file_exists($finalFilePath) && $c < 50){

   		 		// remake
   				$finalFileName = $filePreHash.'-'.$c.'-'.$filename;
   		 		$finalFilePath = $currentUploadDir.'/'.$finalFileName;

   		 		// let it roll + retest
   		 		$c++;
   		 	}

   			if (rename($fromPath.'/'.$filename,$finalFilePath)){

   				// moved :)

   				// check perms?
   				/* https://developer.wordpress.org/reference/functions/wp_upload_bits/
			    // Set correct file permissions
			    $stat = @ stat( dirname( $new_file ) );
			    $perms = $stat['mode'] & 0007777;
			    $perms = $perms & 0000666;
			    @ chmod( $new_file, $perms );
			    */

			    $endPath = $finalFilePath;
			    // this url is temp, it should be fed via php later.
			    $endURL = $currentUploadURL.'/'.$finalFileName;


   				// the caller-func needs to remove/change data/meta :)
   				return array('file'=>$endPath,'url'=>$endURL);

   			} else {

   				// failed to move
   				return false;
   			}


   		}

   		return false; // couldn't - no dir to move to :)


   }

function zeroBSCRM_privatisedDirCheck( $echo = false ) {
	$storage_dir_info = jpcrm_storage_dir_info();

	if ( $storage_dir_info === false ) {
		return false;
	}

	$is_dir_created = jpcrm_create_and_secure_dir_from_external_access( $storage_dir_info['path'], false );

	if ( $is_dir_created === false ) {
		return false;
	}

	return $storage_dir_info;
}

function jpcrm_get_hash_for_object( $object_id, $object_hash_string ) {
	global $zbs;
	$zbs->load_encryption();
	return $zbs->encryption->hash( $object_id . $zbs->encryption->get_encryption_key( $object_hash_string ) );
}

/*
 * Returns the 'dir info' for the storage folder.
 * dir info = 
 * [ 
 *      'path' => 'path for the physical file',
 *      'url'  => 'public facing url'
 * ]
 *
 */
function jpcrm_storage_dir_info() {
	$uploads_dir = WP_CONTENT_DIR;
	$uploads_url = content_url();
	$private_dir_name = 'jpcrm-storage';

	if ( ! empty( $uploads_dir ) && ! empty( $uploads_url ) ) {
		$full_dir_path = $uploads_dir . '/' . $private_dir_name;
		$full_url      = $uploads_url . '/' . $private_dir_name;
		return array( 'path' => $full_dir_path, 'url' => $full_url );
	}

	return false;
}

/*
 * Returns the 'dir info' for the fonts folder.
 */
function jpcrm_storage_fonts_dir_path() {
	$root_storage_info = jpcrm_storage_dir_info();

	if ( !$root_storage_info ) {
		return false;
	}

	$fonts_dir = $root_storage_info['path'] . '/fonts/';

	// Create and secure fonts dir as needed
	if ( !jpcrm_create_and_secure_dir_from_external_access( $fonts_dir ) || !is_dir( $fonts_dir ) ) {
		return false;
	}

	return $fonts_dir;
}

/*
 * Returns the 'dir info' for the provided generic object. This directory should
 * be used to store all files associated to this object (e.g. contact files, 
 * company files, invoices...). 
 * 
 * dir info = 
 * [ 
 *   'subfolder_1' => 
 *     [ 
 *        'path' => 'path for the physical file',
 *        'url'  => 'public facing url'
 *      ],
 *   'subfolder_2' => 
 *     [ 
 *        'path' => 'path for the physical file',
 *        'url'  => 'public facing url'
 *      ],
 *    .
 *    .
 *    .
 * ]
 *
 */
function jpcrm_storage_dir_info_for_object( $object_id, $object_hash_string, $object_parent_folder, $subfolder_list ) {
	global $zbs;

	$root_storage_info = jpcrm_storage_dir_info();

	if ( $root_storage_info === false ) {
		return false;
	}

	$parent_storage_info = array( 
		'path' => $root_storage_info['path'] . '/' . $object_parent_folder, 
		'url'  => $root_storage_info['url'] . '/' . $object_parent_folder 
	);

	if ( ! jpcrm_create_and_secure_dir_from_external_access( $parent_storage_info['path'], false ) ) {
		return false;
	}

	$object_unique_hash   = jpcrm_get_hash_for_object( $object_id, $object_hash_string );
	$parent_relative_path = sprintf( '/%s-%s/', $object_id, $object_unique_hash );
	$parent_full_path     = $parent_storage_info['path'] . $parent_relative_path;

	if ( ! jpcrm_create_and_secure_dir_from_external_access( $parent_full_path, false ) ) {
		return false;
	}

	$object_dir_info = array();

	foreach ( $subfolder_list as $subfolder ) {
		$object_dir_info[ $subfolder ] = array(
			'path' => $parent_full_path . $subfolder,
			'url'  => $parent_storage_info['url']  . $parent_relative_path . $subfolder,
		);
	}

	return $object_dir_info;
}

/*
 * Returns the 'dir info' for the provided contact with the subfolders 'avatar',
 * and 'files'. The definition of 'dir info' can be found in the function
 * 'jpcrm_storage_dir_info_for_object'.
 *
 */
function jpcrm_storage_dir_info_for_contact( $contact_id ) {

	return jpcrm_storage_dir_info_for_object( 
		$contact_id,
		'contact_hash',
		'contacts',
		array( 'avatar', 'files' )
	);

}

/*
 * Returns the 'dir info' for the provided company with the subfolder 'files'.
 * The definition of 'dir info' can be found in the function 'jpcrm_storage_dir_info_for_object'.
 *
 */
function jpcrm_storage_dir_info_for_company( $company_id ) {

	return jpcrm_storage_dir_info_for_object( 
		$company_id,
		'company_hash',
		'companies',
		array( 'files' )
	);

}

/*
 * Returns the 'dir info' for the provided invoice with the subfolder 'files'.
 * The definition of 'dir info' can be found in the function 'jpcrm_storage_dir_info_for_object'.
 *
 */
function jpcrm_storage_dir_info_for_invoices( $invoice_id ) {

	return jpcrm_storage_dir_info_for_object( 
		$invoice_id,
		'invoice_hash',
		'invoices',
		array( 'files' )
	);

}

/*
 * Returns the 'dir info' for the provided quote with the subfolder 'files'.
 * The definition of 'dir info' can be found in the function 'jpcrm_storage_dir_info_for_object'.
 *
 */
function jpcrm_storage_dir_info_for_quotes( $quote_id ) {

	return jpcrm_storage_dir_info_for_object( 
		$quote_id,
		'quote_hash',
		'quotes',
		array( 'files' )
	);

}
/*
 * Saves a file uploaded by an admin from $_FILES[ $param_name ] to the folder
 * $target_dir_info['path'] and returns an array( 'error' => something ) in the
 * case of errors and an 
 * array( 'file' => file_path, 'url' => file_url, 'priv' => boolean) in the case
 * of success.
 */
function jpcrm_save_admin_upload_to_folder( $param_name, $target_dir_info ) {
	$upload = wp_upload_bits( $_FILES[ $param_name ]['name'], null, file_get_contents( $_FILES[ $param_name ]['tmp_name'] ) );

	if( isset( $upload['error'] ) && $upload['error'] != 0 ) {
		return $upload;
	}
	// change this to return a custom error in the future if needed
	if ( $target_dir_info === false ) {
		return $upload;
	}

	global $zbs;
	$zbs->load_encryption();

	$upload_path          = $target_dir_info['path'];
	$upload_folder_exists = jpcrm_create_and_secure_dir_from_external_access( $upload_path, false );
	if ( $upload_folder_exists ) {
		$upload_filename  = sanitize_file_name( sprintf( 
			'%s-%s',
			$zbs->encryption->get_rand_hex( 16 ),
			$_FILES[ $param_name ]['name'] // for admins we are accepting "filename.ext" as provided by $_FILES
		) );

		if ( move_uploaded_file( $_FILES[ $param_name ]['tmp_name'], $upload_path . '/' . $upload_filename ) ) {
			$upload['file'] = $upload_path . '/' . $upload_filename;
			$upload['url']  = $target_dir_info['url'] . '/' . $upload_filename;
			// add this extra identifier if in privatised sys
			$upload['priv'] = true;
		}
	}

	return $upload;
}

// 2.95.5+ we also add a subdir for 'work' (this is used by CPP when making thumbs, for example)
function zeroBSCRM_privatisedDirCheckWorks( $echo = false ) {
	$uploads_dir = WP_CONTENT_DIR;
	$uploads_url = content_url();
	$private_dir_name = 'jpcrm-storage/tmp';

	if ( ! empty( $uploads_dir ) && ! empty( $uploads_url ) ) {
		$full_dir_path = $uploads_dir . '/' . $private_dir_name;
		$full_url      = $uploads_url . '/' . $private_dir_name;

		// check existence
		if ( !file_exists( $full_dir_path ) ) {

			// doesn't exist, attempt to create
			mkdir( $full_dir_path, 0755, true );
			// force perms?
			chmod( $full_dir_path, 0755 );

		}

		if ( is_dir( $full_dir_path ) ) {
			jpcrm_create_and_secure_dir_from_external_access( $full_dir_path );
			return array( 'path' => $full_dir_path, 'url' => $full_url );
		}
	}

	return false;
}

/* ======================================================
  / File Upload related funcs
   ====================================================== */
   
/* ======================================================
  File Slots helpers
   ====================================================== */

   function zeroBSCRM_fileSlots_getFileSlots($objType=1){

   		global $zbs;

   		$fileSlots = array();

        $settings = zeroBSCRM_getSetting('customfields'); $cfbInd = 1;

        switch ($objType){

        	case 1:

		        if (isset($settings['customersfiles']) && is_array($settings['customersfiles']) && count($settings['customersfiles']) > 0){

			         foreach ($settings['customersfiles'] as $cfb){

			            $cfbName = ''; if (isset($cfb[0])) $cfbName = $cfb[0];
			         	$key = $zbs->DAL->makeSlug($cfbName); // $cfbInd
			            if (!empty($key)){
			            	$fileSlots[] = array('key'=>$key,'name'=>$cfbName);
			            	$cfbInd++;
			            }

			        }

		    	}

		    break;

		}

    	return $fileSlots;
   }

   // returns the slot (if assigned) of a given file
   function zeroBSCRM_fileslots_fileSlot($file='',$objID=-1,$objType=1){

   		// get all slotted files for contact/obj
   	
   		if ($objID > 0 && !empty($file)){

   			global $zbs;
   			$fileSlots = zeroBSCRM_fileslots_allSlots($objID,$objType);
   			// cycle through
   			if (count($fileSlots) > 0){

   				foreach ($fileSlots as $fsKey => $fsFile){

   					if ($fsFile == $file) return $fsKey;

   				}

   			}


   		}
   		return false;
   }


   // returns all slots (if assigned) of a given obj(contact)
   function zeroBSCRM_fileslots_allSlots($objID=-1,$objType=1){

   		if ($objID > 0){

   			global $zbs;
   			$fileSlots = zeroBSCRM_fileSlots_getFileSlots(ZBS_TYPE_CONTACT);
   			$ret = array();
   			if (count($fileSlots) > 0){

   				foreach ($fileSlots as $fs){

   					$ret[$fs['key']] = zeroBSCRM_fileslots_fileInSlot($fs['key'],$objID,$objType);

   				}

   			}
   			return $ret;
   	
   		}
   		return false;
   }

   // returns a file for a slot
   function zeroBSCRM_fileslots_fileInSlot($fileSlot='',$objID=-1,$objType=1){

   		if ($objID > 0){

   			global $zbs;

   			return $zbs->DAL->meta($objType,$objID,'cfile_'.$fileSlot);

   		}
   		return false;
 
   }

   // adds a file to a slot
   function zeroBSCRM_fileslots_addToSlot($fileSlot='',$file='',$objID=-1,$objType=1,$overrite=false){

   		if ($objID > 0){

   			//echo '<br>zeroBSCRM_fileslots_addToSlot '.$fileSlot.' '.$file.' '.$objID.' ext:'.zeroBSCRM_fileslots_fileInSlot($fileSlot,$objID).'!';

   			global $zbs;

	   		// check existing?
	   		if (!$overrite){
	   			$existingFile = zeroBSCRM_fileslots_fileInSlot($fileSlot,$objID);
	   			if (!empty($existingFile)) return false;
	   		} else {

	   			// overrite... so remove any if present before..
	   			zeroBSCRM_fileslots_clearFileSlot($fileSlot,$objID,$objType);
	   		}

	        // DAL2 add via meta (for now)
	        $zbs->DAL->updateMeta($objType,$objID,'cfile_'.$fileSlot,$file);
	        return true;

	    }

	    return false;

   	
   }

   function zeroBSCRM_fileslots_clearFileSlot($fileSlot='',$objID=-1,$objType=1){

   		if ($objID > 0){

   			global $zbs;
			return $zbs->DAL->deleteMeta(array(
						'objtype' 			=> $objType,
						'objid' 			=> $objID,
						'key'	 			=> 'cfile_'.$fileSlot
			   		));

		}

		return false;
   }


   function zeroBSCRM_files_baseName($filePath='',$privateRepo=false){

   		$file = '';
   		if (!empty($filePath)){


		    $file = basename($filePath);
		    if ($privateRepo) $file = substr($file,strpos($file, '-')+1);

   		}

   		return $file;

   }

/* ======================================================
  / File Slots helpers
   ====================================================== */

// gives an hashed filename+salt that is generally suitable for filesystems
function jpcrm_get_hashed_filename( $filename, $suffix='' ) {
	global $zbs;
	$zbs->load_encryption();
	$salt = $zbs->encryption->get_encryption_key( 'filename' );
	$hashed_filename = $zbs->encryption->hash( $filename . $salt ) . $suffix;
	return $hashed_filename;
}


/**
 * Checks legitimacy (in so far as practicable) of an uploaded file 
 * With default 'setting' params, checks against the core functions:
 * `zeroBS_acceptableFileTypeMIMEArr()` and `zeroBS_acceptableFileTypeListArr()`
 * (Which reflect the core setting)
 * 
 * @param $FILE
 * @param $check_file_extension string|array - if string, can be single, e.g. `.pdf`, if array, can be multiple strings
 * @param $check_mime_type string|array - if string, can be single, e.g. `application/pdf`, if array, can be multiple strings
 */
function jpcrm_file_check_mime_extension( $FILE, $check_file_extension = 'setting', $check_mime_type = 'setting' ){

		// expects $_FILES type array (e.g. pass $_FILES['zbsc_file_attachment'])
		if ( !is_array( $FILE ) || !isset( $FILE['name'] ) || !isset( $FILE['type'] ) || !isset( $FILE['tmp_name'] ) ){
			return false;
		}

		// check file extension

		// retrieve settings, or prepare an array of acceptable file extensions from passed string/array
		if ( $check_file_extension == 'setting' ){
			$check_file_extension = zeroBS_acceptableFileTypeListArr();
		} elseif ( $check_file_extension != 'setting' && !is_array( $check_file_extension ) ){
			$check_file_extension = array( $check_file_extension );
		}

		// check actual extension
		if ( !in_array( '.' . pathinfo( $FILE['name'], PATHINFO_EXTENSION ), $check_file_extension ) ){
			return false;
		}

		// check mime

		// retrieve settings, or prepare an array of acceptable file extensions from passed string/array
		if ( $check_mime_type == 'setting' ){
			$check_mime_type = zeroBS_acceptableFileTypeMIMEArr();
		} elseif ( $check_mime_type != 'setting' && !is_array( $check_mime_type ) ){
			$check_mime_type = array( $check_mime_type );
		}

		// catch 'all' legacy solution which (perhaps dangerously) sidesteps this check
		// will do mime check if legacy 'all' is empty, which includes false, 0, and !isset()
		if ( empty( $check_mime_type['all'] ) ) {
			// check actual mime type
			if ( ! in_array( $FILE['type'], $check_mime_type ) ) {
				return false;
			}

			// also check the mime type directly inferred from the uploaded file
			// note: we don't check this type against $FILE['type'] because it
			// doesn't really matter if they are different but both accepted types
			$tmp_file_type = jpcrm_get_mimetype( $FILE['tmp_name'] ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

			if ( ! in_array( $tmp_file_type, $check_mime_type ) ) {
				return false;
			}
		}

		return true;
}
