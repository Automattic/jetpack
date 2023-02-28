<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.76+
 *
 * Copyright 2020 Automattic
 *
 * Date: 27/05/18
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

// outputs top of page screen options panel :)
// (based on rights + pagekey)
function zeroBSCRM_screenOptionsPanel(){
		
	global $zbs;

	$screenOptionsHTML = ''; $options = array(); $rights = true; // this is 'okay for everyone' - current_user_can('administrator')?
    $screenOpts = $zbs->userScreenOptions();

	switch ($zbs->pageKey){

		// contact edit
		case 'zbs-add-edit-contact-edit':

			$options['metaboxes'] = zeroBSCRM_getCurrentMetaboxesFlatArr();

			break;

		// company view
		case 'zbs-add-edit-company-view':

			if(!array_key_exists('tablecolumns', $options)){
				$options['tablecolumns'] = array();
			}

			if (!is_array($options['tablecolumns'])) $options['tablecolumns'] = array();

	        // global $zbsTransactionFields; 
	        // get existing from setting
	        $activeTransactionColumns = array('date','id','total','status'); // default
			// not from setting, from screenopt $allColumns = zeroBSCRM_getSetting('company_view_docs_columns');
			//if (isset($allColumns['transactions']) && is_array($allColumns['transactions']) && count($allColumns['transactions']) > 0) $zbsTransactionFields = $allColumns['transactions'];
			if (
					isset($screenOpts) && is_array($screenOpts) 
						&& isset($screenOpts['tablecolumns']) && is_array($screenOpts['tablecolumns']) 
							&& isset($screenOpts['tablecolumns']['transactions']) 
							&& is_array($screenOpts['tablecolumns']['transactions']) 
							&& count($screenOpts['tablecolumns']['transactions']) > 0
				) $activeTransactionColumns = $screenOpts['tablecolumns']['transactions'];

			$options['tablecolumns']['transactions'] = $activeTransactionColumns;

			break;

	}

	// build html
	if (count($options) > 0){

		// build metabox show/hide
		if (isset($options['metaboxes'])){

			// get hidden list
    		$hidden = array(); if (is_array($screenOpts) && isset($screenOpts['mb_hidden']) && is_array($screenOpts['mb_hidden'])) $hidden = $screenOpts['mb_hidden'];
        
        	// allow rearrange?
        	// Don't use anymore :) MS UI input $rearrangeButton = '<button class="ui mini button orange" type="button" id="zbs-metabox-manager"><i class="arrows alternate icon"></i>'.__('Re-arrange','zero-bs-crm').'</button>';
        	$rearrangeButton = '';

    		// build html list
			$screenOptionsHTML .= '<div class="zbs-screenoptions-opt zbs-screenoptions-metaboxes"><div class="ui dividing header">'.__('Boxes','zero-bs-crm').$rearrangeButton.'</div><div class="ui divided grid"><div class="row">';

				// show lists - normal
				if (isset($options['metaboxes']['normal']) && is_array($options['metaboxes']['normal']) && count($options['metaboxes']['normal']) > 0){
				
					// for now, just doing lines $screenOptionsHTML .= '<div class="ten wide column">';
					$screenOptionsHTML .= '<div class="sixteen wide column"><h4 class="ui header">'.__('Main Column','zero-bs-crm').'</h4>';
					foreach ($options['metaboxes']['normal'] as $mbID => $mb){

						$mbTitle = $mbID; if (is_array($mb) && isset($mb['title'])) $mbTitle = $mb['title'];

						// if can hide
						$canHide = true; if (isset($mb['capabilities']) && isset($mb['capabilities']['can_hide']) && $mb['capabilities']['can_hide'] == false) $canHide = false;

						if ($canHide){

							$screenOptionsHTML .= '<div class="ui checkbox zbs-metabox-checkbox"><input type="checkbox" id="zbs-mb-'.$mbID.'"';
							if (!in_array($mbID, $hidden)) $screenOptionsHTML .= ' checked="checked"';
							$screenOptionsHTML .= ' /><label for="zbs-mb-'.$mbID.'">'.$mbTitle.'</label></div>';
						
						} else {

							$screenOptionsHTML .= '<div class="ui checkbox zbs-metabox-checkbox"><input type="checkbox" id="zbs-mb-'.$mbID.'" checked="checked" disabled="disabled"><label for="zbs-mb-'.$mbID.'">'.$mbTitle.'</label></div>';
							
						}

					}
					$screenOptionsHTML .= '</div>';

				}	
				// show list - side
				if (isset($options['metaboxes']['side']) && is_array($options['metaboxes']['side']) && count($options['metaboxes']['side']) > 0){
				
					// for now, just doing lines $screenOptionsHTML .= '<div class="six wide column">';
					$screenOptionsHTML .= '<div class="sixteen wide column"><h4 class="ui header">'.__('Side','zero-bs-crm').'</h4>';
					foreach ($options['metaboxes']['side'] as $mbID => $mb){

						$mbTitle = $mbID; if (is_array($mb) && isset($mb['title'])) $mbTitle = $mb['title'];

						// if can hide
						$canHide = true; if (isset($mb['capabilities']) && isset($mb['capabilities']['can_hide']) && $mb['capabilities']['can_hide'] == false) $canHide = false;

						if ($canHide){
							$screenOptionsHTML .= '<div class="ui checkbox zbs-metabox-checkbox"><input type="checkbox" id="zbs-mb-'.$mbID.'"';
							if (!in_array($mbID, $hidden)) $screenOptionsHTML .= ' checked="checked"';
							$screenOptionsHTML .= ' /><label for="zbs-mb-'.$mbID.'">'.$mbTitle.'</label></div>';
						} else {

							$screenOptionsHTML .= '<div class="ui checkbox zbs-metabox-checkbox"><input type="checkbox" id="zbs-mb-'.$mbID.'" checked="checked" disabled="disabled"><label for="zbs-mb-'.$mbID.'">'.$mbTitle.'</label></div>';
							
						}
					}
					$screenOptionsHTML .= '</div>';

				}	

			$screenOptionsHTML .= '</div></div></div>'; // end row + grid + group

		}

		// build tablecolumns on/off
		if (isset($options['tablecolumns']) && is_array($options['tablecolumns']) && count($options['tablecolumns']) > 0){

			// build html list
			$screenOptionsHTML .= '<div class="zbs-screenoptions-opt zbs-screenoptions-tablecolumns"><div class="ui dividing header">'.__('Document Table Columns','zero-bs-crm').'</div><div class="ui divided grid"><div class="row">';

			foreach ($options['tablecolumns'] as $type => $selectedColumns){

				switch ($type){

					case 'transactions':

						// get whole list (of poss columns - list fields, then columns)
						// these are in two types of arrays, so first, shuffle them into a kinda standardised type
						global $zbsTransactionFields, $zeroBSCRM_columns_transaction;

						// exclusions (wh temp workaround)
						$excludeColumnKeys = array('customer','customer_name','currency','tagged','added','tax_rate','customeremail');

						$availableColumns = array();
						// all fields (inc custom:)
						if (isset($zbsTransactionFields) && is_array($zbsTransactionFields) && count($zbsTransactionFields) > 0) foreach ($zbsTransactionFields as $tKey => $tDeets){

							// key => name
							if (!in_array($tKey, $excludeColumnKeys)) $availableColumns[$tKey] = $tDeets[1];

						}
						// all columns (any with same key will override)					
						if (isset($zeroBSCRM_columns_transaction['all']) && is_array($zeroBSCRM_columns_transaction['all']) && count($zeroBSCRM_columns_transaction['all']) > 0) foreach ($zeroBSCRM_columns_transaction['all'] as $tKey => $tDeets){

							// key => name
							if (!in_array($tKey, $excludeColumnKeys)) $availableColumns[$tKey] = $tDeets[0];

						}

						// show list of cols
						if (isset($availableColumns) && is_array($availableColumns) && count($availableColumns) > 0){
						
							// for now, just doing lines $screenOptionsHTML .= '<div class="ten wide column">';
							$screenOptionsHTML .= '<div class="sixteen wide column" id="zbs-tablecolumns-'.$type.'"><h4 class="ui header">'.__('Transactions Table','zero-bs-crm').'</h4>';
							foreach ($availableColumns as $colKey => $colName){

								$screenOptionsHTML .= '<div class="ui checkbox zbs-tablecolumn-checkbox" data-colkey="'.$colKey.'"><input type="checkbox" id="zbs-tc-'.$colKey.'"';
								if (in_array($colKey, $selectedColumns)) $screenOptionsHTML .= ' checked="checked"';
								$screenOptionsHTML .= ' /><label for="zbs-tc-'.$colKey.'">'.$colName.'</label></div>';
							

							}
							$screenOptionsHTML .= '</div>';

						}	



						break;

				}


			} // foreach type

			$screenOptionsHTML .= '</div></div></div>'; // end row + grid 

		} // if tablecolumns


	}


	if (!empty($screenOptionsHTML)){
			
			?><!-- screenoptions -->
            <div id="zbs-screen-options" class="ui segment secondary zbs-closed">
	            <?php if ($rights){ ?>
	            	<?php echo $screenOptionsHTML; ?>
	            <?php } // / can ?>
	            <div id="zbs-screen-options-handle"><?php esc_html_e('Page Layout','zero-bs-crm'); ?> <i class="caret up icon"></i><i class="caret down icon"></i></div>
            </div>
            <!-- / screenoptions --><?php

    }
}

function zeroBS_outputScreenOptions(){

	global $zbs;

	$screenOpts = $zbs->userScreenOptions();

	?><script type="text/javascript">var zbsPageKey = '<?php echo esc_html( $zbs->pageKey ); ?>';var zbsScreenOptions = <?php echo json_encode($screenOpts); ?>;</script><?php

}
	
add_action('admin_footer','zeroBS_outputScreenOptions');


function zeroBS_canUpdateScreenOptions(){

	// does this need to check if is zbs wp usr?

	$id = get_current_user_id();
	if ($id > 0) return true;

	return false;

}