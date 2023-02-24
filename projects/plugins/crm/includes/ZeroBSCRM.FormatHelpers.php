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
  Contact
   ====================================================== */


function zeroBSCRM_html_contactIntroSentence($contact){


	// include 'contact since' when we have a valid date:
	if ( $contact['created'] > 0 ){
		
		$c = '<i class="calendar alternate outline icon"></i>' . sprintf( __('Contact since %s',"zero-bs-crm"), $contact['created_date'] );

	}

  	// in co? + check if B2B mode active
  	$b2bMode = zeroBSCRM_getSetting('companylevelcustomers');
  	if ( $b2bMode == 1 ){
	  	$possibleCo = zeroBS_getCustomerCompanyID($contact['id']);
	  	if (!empty($possibleCo) && $possibleCo > 0){

	  		$co = zeroBS_getCompany($possibleCo);

	  		if (is_array($co) && isset($co['name']) && !empty($co['name'])){

	  			$c .= '<br/><i class="building outline icon"></i>' . __('Works for',"zero-bs-crm").' <a href="'.jpcrm_esc_link('view',$possibleCo,'zerobs_company').'" target="_blank">'.$co['name'].'</a>';
	  		}
	  	}
		}
		
		#} New 2.98+
		$contact_location = "";
		if(!empty($contact['county']) && !empty($contact['country'])){
			$contact_location = $contact['county'] . ", " . $contact['country'];
		}else if(!empty($contact['county']) && empty($contact['country'])){
			$contact_location = $contact['county'];
		}else if(empty($contact['county']) && !empty($contact['country'])){
			$contact_location = $contact['country'];
		}

		if($contact_location != ""){
			$c .= '<br/><i class="map marker alternate icon"></i>' . $contact_location;
		}

		//tags for easier viewing UI wise (2.98+)

    $customerTags = zeroBSCRM_getCustomerTagsByID($contact['id']);
    if (!is_array($customerTags)) $customerTags = array();
    if (count($customerTags) > 0){
     	$c .=  '<br/>' . zeroBSCRM_html_linkedContactTags($contact['id'],$customerTags,'ui tag label zbs-mini-tag', false, true);
		}


  	// assigned to?
    $usingOwnership = zeroBSCRM_getSetting('perusercustomers');
	if ($usingOwnership){
  		$possibleOwner = zeroBS_getOwner($contact['id'],true,'zerobs_customer');
	  	if (is_array($possibleOwner) && isset($possibleOwner['ID']) && !empty($possibleOwner['ID'])){

	  		if (isset($possibleOwner['OBJ']) && isset($possibleOwner['OBJ']->user_nicename)){
				$user_avatar = jpcrm_get_avatar( $possibleOwner['OBJ']->ID, 25 ); 
	  			$c .= '<div class="zbs-contact-owner">' . __('Assigned to: ',"zero-bs-crm").' <span class="ui image label">'. $user_avatar . ' ' . $possibleOwner['OBJ']->display_name . '</span></div>';
	  		}
	  	}
	}

  	$c = apply_filters('zerobscrm_contactintro_filter', $c, $contact['id']);

  	return $c;

}
function zeroBSCRM_html_contactSince($customer){
  echo "<i class='fa fa-calendar'></i>  ";
  esc_html_e("Contact since ", "zero-bs-crm");
  $d = new DateTime($customer['created']);
  $formatted_date = $d->format(zeroBSCRM_getDateFormat());
  return "<span class='zbs-action'><strong>" . $formatted_date . "</strong></span>";
}


function zeroBSCRM_html_sendemailto($prefillID=-1,$emailAddress='',$withIco=true){
  global $zbs;
  if ($prefillID > 0 && !empty($emailAddress)){
	  if ($withIco) echo "<i class='fa fa-envelope-o'></i>  ";
	  echo "<span class='zbs-action'><a href='". esc_url( zeroBSCRM_getAdminURL($zbs->slugs['emails']).'&zbsprefill='.$prefillID ) ."'>";
	  echo esc_html( $emailAddress );
	  echo "</a></span>"; 
	}
}


//added echo = true (i.e by default echo this, but need to return it in some cases)
function zeroBSCRM_html_linkedContactTags($contactID=-1,$tags=false,$classStr='',$echo = true, $trim = false,  $limit = false){
	
	global $zbs; 
	$res = '';

	//check if we have a way to pass a LIMIT to the below (cos tons of tags in the top box is bad)

	if ($contactID > 0 && $tags == false) $tags = zeroBSCRM_getCustomerTagsByID($contactID);
	
	if (count($tags) > 0)
	foreach ($tags as $tag){

		// DAL1/2 switch
		$tagName = ''; $tagID = -1;
		if (is_array($tag)){
			$tagName = $tag['name'];
			$tagID = $tag['id'];
		} else {
			$tagName = $tag->name;
			$tagID = $tag->term_id;
		}
		
		$short_tag_name = $trim && strlen($tagName) > 50 ? substr($tagName,0,10)."..." : $tagName;

		$link = admin_url('admin.php?page='.$zbs->slugs['managecontacts'].'&zbs_tag='.$tagID);
		$res .= '<a title="' . esc_attr( $tagName ) . '" class="' . $classStr . '" href="' . $link . '">' . esc_html( $short_tag_name ) . '</a>';
		
	
	}
	
	if ($echo)
		echo $res;
	else
		return $res;
		

}


// builds the HTML for companies linked to a contact
// note can pass $companiesArray parameter optionally to avoid the need to retrieve companies (DAL3+ these are got with the getContact)
function zeroBSCRM_html_linkedContactCompanies($contactID=-1,$companiesArray=false){

	global $zbs;

    #} Contacts' companies
    if (!is_array($companiesArray))
        $companies = $zbs->DAL->contacts->getContactCompanies($contactID);
    else
    	$companies = $companiesArray;

    $companiesStr = '';

    foreach ($companies as $company){

        if (is_array($company) && isset($company['name']) && !empty($company['name'])){

          $companiesStr .= '<a href="'.jpcrm_esc_link('view',$company['id'],'zerobs_company').'" target="_blank">'.$company['name'].'</a>';

        }
    } 

    return $companiesStr;

}

function zeroBSCRM_html_contactTimeline($contactID=-1,$logs=false,$contactObj=false){ 

	global $zeroBSCRM_logTypes, $zbs;

	if (isset($contactID) && $contactID > 0 && $logs === false){

		// get logs
		$logs = zeroBSCRM_getContactLogs($contactID,true,100,0,'',false);

	}
	//echo 'zeroBSCRM_html_contactTimeline<pre>'.print_r($logs,1).'</pre>'; exit();


	// Compile a list of actions to show
	// - if under 10, show them all
	// - if over 10, show creation, and 'higher level' logs, then latest
	// - 7/2/19 WH modified this to catch "creation" logs properly, and always put them at the end
	// ... (we were getting instances where transaction + contact created in same second, which caused the order to be off)
	$logsToShow = array(); $creationLog = false;

	if (count($logs) <= 10){

		$logsToShow = $logs;

		$logsF = array(); $creationLog = false;
		// here we have to just do a re-order to make sure created is last :) 
		foreach ($logsToShow as $l){

			if ($l['type'] == 'created') 
				$creationLog = $l;
			else
				$logsF[] = $l;

		}

		// add it
		if (is_array($creationLog)) $logsF[] = $creationLog;

		// tidy
		$logsToShow = $logsF; 
		unset($logsF);
		unset($creationLog);


	} else {

		// cherry pick 9 logs

		// 1) latest
		$logsToShow[] = current($logs);

		// 2) cherry pick 8 middle events
		$logTypesToPrioritise = array( 'Quote: Accepted',
									   'Quote: Refused',
									   'Invoice: Sent',
									   'Invoice: Part Paid',
									   'Invoice: Paid',
									   'Invoice: Refunded',
									   'Transaction',
									   'Feedback',
									   'Status Change',
									   'Client Portal User Created',
									   'Call',
									   'Email',
									   'Note'
									   );

			// convert to type stored in db
			$x = array();
			foreach ($logTypesToPrioritise as $lt) $x[] = zeroBSCRM_logTypeStrToDB($lt);
			$logTypesToPrioritise = $x; unset($x);

			// for now, abbreviated, just cycle through + pick any in prioritised group... could do this staggered by type/time later
			//skip first item, as we've already added it earlier
			foreach (array_slice($logs,1) as $l){
				if ($l['type'] == 'created'){

					// add to this var
					$creationLog = $l;

				} else {

					// normal pickery
					if (count($logsToShow) < 9){ 
						if (in_array($l['type'], $logTypesToPrioritise)) $logsToShow[] = $l;
					} else {
						break;
					}

				}

			}

		// 3) created
		// for now, assume first log is created, if it's not, add one with date
		// ... this'll cover 100+ logs situ
		// WH changed 7/2/18 to remove issue mentioned above 
			// $creationLog = end($logs);
		if ($creationLog == false){

			// retrieve it
			if ($zbs->isDAL2()) $creationLog = zeroBSCRM_getObjCreationLog($contactID,1);

		}
		if (is_array($creationLog)){ //$creationLog['type'] == 'Create' || strpos($creationLog['shortdesc'], 'Created') > 0){

			$logsToShow[] = $creationLog;

		} else {

			// if has creation date (contactObj)
			if ($contactObj != false){	

				// manufacture a created log
				$logsToShow[] = array(

					'id' => -1,
					'created' => $contactObj['created'],
					'name' => '',

					// also add DAL2 support:
					'type' => __('Created',"zero-bs-crm"),
					'shortdesc' => __('Contact Created',"zero-bs-crm"),
					'longdesc' => __('Contact was created',"zero-bs-crm"),

					'meta' => array(
			          'type' => __('Created',"zero-bs-crm"),
			          'shortdesc' => __('Contact Created',"zero-bs-crm"),
			          'longdesc' => __('Contact was created',"zero-bs-crm")
					),
					'owner' => -1,
					//nicetime

				);

			}
		}


	}


	if ( count($logsToShow) > 0 ) {
		?>
		<ul class="zbs-timeline">
			<?php
			$prevDate = '';
			$i = 0;
			foreach ( $logsToShow as $log ) {

				if ( !is_array( $log ) || !isset( $log['created'] ) ) {
					continue;
				}

				// format date
				$d = new DateTime( $log['created'] );
				$formatted_date = $d->format( zeroBSCRM_getDateFormat() );

				// check if same day as prev log
				$sameDate = false;
				if ( $formatted_date == $prevDate ) {
					$sameDate = true;
				}
				$prevDate = $formatted_date;

				// ico?
				$ico = '';
				$logKey = strtolower( str_replace( ' ', '_', str_replace( ':', '_', $log['type'] ) ) );
				if ( isset( $zeroBSCRM_logTypes['zerobs_customer'][$logKey] ) ) {
					$ico = $zeroBSCRM_logTypes['zerobs_customer'][$logKey]['ico'];
				}
				// these are FA ico's at this point

				// fill in nicetime if using :)
				// use a setting to turn on off?
				if ( !empty( $log['createduts'] ) && $log['createduts'] > 0 ) {
					// get H:i in local timezone
					$log['nicetime'] = zeroBSCRM_date_i18n( 'H:i', $log['createduts'], true, false );
				}

				// if it's last one, make sure it has class:
				$notLast = true;
				if ( count( $logsToShow ) == $i + 1 ) {
					$notLast = false;
				}

				// compile this first, so can catch default (empty types)
				$logTitle = '';
				if ( !empty( $ico ) ) {
					$logTitle .= '<i class="fa ' . $ico . '"></i> ';
				}

				if ( isset( $zeroBSCRM_logTypes['zerobs_customer'][$logKey] ) ) {
					$logTitle .= __( $zeroBSCRM_logTypes['zerobs_customer'][$logKey]['label'], 'zero-bs-crm' );
				}

				$timeline_item_classes = '';
				if ( $sameDate && $notLast ) {
					$timeline_item_classes .= '-contd';
				}
				if ( empty( $logTitle ) ) {
					$timeline_item_classes .= ' zbs-timeline-item-notitle';
				}
				if ( !$notLast ) {
					$timeline_item_classes .= ' zbs-last-item'; // last item (stop rolling padding)
				}

				$timeline_item_id_attr = '';
				if ( isset( $log['id'] ) && $log['id'] !== -1 ) {
					$timeline_item_id_attr = ' id="zbs-contact-log-' . $log['id'] . '"';
				}

				?>
				<li class="zbs-timeline-item<?php echo esc_attr( $timeline_item_classes ); ?> zbs-single-log"<?php $timeline_item_id_attr; ?>>
					<?php
					if ( !$sameDate ) {
						?>
						<div class="zbs-timeline-info">
							<span><?php echo esc_html( $formatted_date ); ?></span>
						</div>
						<?php
					}
					?>
					<div class="zbs-timeline-marker"></div>
					<div class="zbs-timeline-content">

						<h3 class="zbs-timeline-title">
							<?php
							if ( !empty( $ico ) ) {
								echo '<i class="fa ' . esc_attr( $ico ) . '"></i> ';
							}

							if ( isset( $zeroBSCRM_logTypes['zerobs_customer'][$logKey] ) ) {
								echo esc_html__( $zeroBSCRM_logTypes['zerobs_customer'][$logKey]['label'], 'zero-bs-crm' );
							}
							?>
						</h3>
						<div>
							<?php
							if ( isset( $log['shortdesc'] ) ) {
								echo wp_kses( $log['shortdesc'], array( 'i' => array( 'class' => true ) ) );
							}
							if ( !empty( $log['author'] ) ) {
								echo ' &mdash; ' . esc_html( $log['author'] );
							}
							if ( isset( $log['nicetime'] ) ) {
								echo ' &mdash; <i class="clock icon"></i>' . esc_html( $log['nicetime'] );
							}
							// if has long desc, show/hide
							if ( !empty( $log['longdesc'] ) ) {
								?>
								<i class="angle down icon zbs-show-longdesc"></i><i class="angle up icon zbs-hide-longdesc"></i>
								<div class="zbs-long-desc">
									<?php echo wp_kses( html_entity_decode( $log['longdesc'], ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 ), $zbs->acceptable_restricted_html ); ?>
								</div>
								<?php
							}
							?>
						</div>
					</div>
				</li>
				<?php
				$i++;
			} // / per log
			?>
		</ul>
		<?php
	}
}

// 
/**
 * Builds HTML table of custom tables & values for (any object type)
 *
 * @return string HTML table
 */
function zeroBSCRM_pages_admin_display_custom_fields_table($id = -1, $objectType=ZBS_TYPE_CONTACT){

	global $zbs;

	// retrieve custom fields (including value)
	$custom_fields = $zbs->DAL->getObjectLayerByType($objectType)->getSingleCustomFields($id,false);

	// Build HTML
	if (is_array($custom_fields) && count($custom_fields) > 0){

		$html = '<table class="ui fixed single line celled table zbs-view-vital-customfields"><tbody>';

		foreach($custom_fields as $k => $v){

		  $html .= '<tr id="zbs-view-vital-customfield-'.esc_attr($v['id']). '" class="wraplines">';
		     $html .= '<td class="zbs-view-vital-customfields-label">' . esc_html($v['name']) . '</td>';
		     switch ($v['type']){

		     	case 'text':
					  $value = nl2br( esc_html( $v['value'] ) );
						//if url, build link, prefixed with 'https://' if needed
						if ( jpcrm_is_url( $value ) ) {
							$value = '<a href="' . jpcrm_url_with_scheme($value) . '" target="_blank">' . $value . '</a>';
						}
		     		$html .= '<td class="zbs-view-vital-customfields-'.esc_attr($v['type']).'">' . $value . '</td>';
		     		break;

		     	case 'date':
		     		$html .= '<td class="zbs-view-vital-customfields-'.esc_attr($v['type']).'">' . ( $v['value'] !== '' ? zeroBSCRM_date_i18n( -1, $v['value'], false, true ) : '' )  . '</td>';
		     		break;

		     	case 'checkbox':
		     		// pad , out
		     		$html .= '<td class="zbs-view-vital-customfields-'.esc_attr($v['type']).'">' . str_replace(',',', ',esc_html( $v['value'] ) )  . '</td>';
		     		break;

		     	default:
		     		$html .= '<td class="zbs-view-vital-customfields-'.esc_attr($v['type']).'">' . nl2br( esc_html( $v['value'] ) ) . '</td>';
		     		break;

		     }
		     	
		  $html .= '</tr>';

		}
		
		$html .= '</tbody></table>';

	} else {

		$html = __("No custom fields have been set up yet.", "zero-bs-crm");
		if (zeroBSCRM_isZBSAdminOrAdmin()){

		  $customFieldsUrl = esc_url(admin_url('admin.php?page='.$zbs->slugs['settings']).'&tab=customfields');
		  $html .= ' <a href="'.$customFieldsUrl.'" target="_blank">'.__('Click here to manage custom fields', 'zero-bs-crm').'</a>';

		}

	} 

	return $html;

}


/* ======================================================
  /	Contact
   ====================================================== */




/* ======================================================
  Company
   ====================================================== */

/*
* Returns company introduction sentence
* e.g. Email: alessandra.koepp@example.com, Added 01/01/2022
*/
function zeroBSCRM_html_companyIntroSentence( $company ){

	$return = "";
	if ( isset( $company['email'] ) && !empty( $company['email'] ) ){
		$return .= __('Email:', 'zero-bs-crm');
		$return .=  '<a href="mailto:'.$company['email'].'" class="coemail"> ' . $company['email'] . "</a><br/>";
	}

	if ( is_array( $company ) && $company['created'] > 0 && isset( $company['created_date'] ) ){
		$formatted_date = $company['created_date'];
  		$return .= __('Added',"zero-bs-crm") . ' ' . $formatted_date;
	}

	// filter
  	$return = apply_filters( 'zerobscrm_companyintro_filter', $return, $company['id'] );

  	return $return;

}

function zeroBSCRM_html_linkedCompanyTags($contactID=-1,$tags=false,$classStr=''){

	global $zbs;
	
	if ($contactID > 0 && $tags == false) $tags = zeroBSCRM_getCustomerTagsByID($contactID);
	if (count($tags) > 0)
	foreach ($tags as $tag){

		// DAL1/2 switch
		$tagName = ''; $tagID = -1;
		if (is_array($tag)){
			$tagName = $tag['name'];
			$tagID = $tag['id'];
		} else {
			$tagName = $tag->name;
			$tagID = $tag->term_id;
		}

      ?><a class="<?php echo esc_attr( $classStr ); ?>" href="<?php echo jpcrm_esc_link( $zbs->slugs['managecompanies'] ) . '&zbs_tag=' . $tagID; ?>"><?php echo esc_html( $tagName ); ?></a><?php
    }
}

// builds the HTML for contacts linked to a company
// note can pass $contactsArray parameter optionally to avoid the need to retrieve contacts (DAL3+ these are got with the getCompany)
function zeroBSCRM_html_linkedCompanyContacts( $companyID = -1, $contactsArray = false ) {

	// avatar mode
	$avatarMode = zeroBSCRM_getSetting( 'avatarmode' );

	// Contacts at company
	if ( !is_array( $contactsArray ) ) {
		$contactsAtCo = zeroBS_getCustomers( true, 1000, 0, false, false, '', false, false, $companyID );
	} else {
		$contactsAtCo = $contactsArray;
	}

	$contactStr = '';
	foreach ( $contactsAtCo as $contact ) {

		if ( $avatarMode !== 3 ) {
			$contactStr .= zeroBS_getCustomerIcoLinkedLabel( $contact['id'] ); // or zeroBS_getCustomerIcoLinkedLabel?
		} else {
			// no avatars, use labels
			$contactStr .= zeroBS_getCustomerLinkedLabel( $contact['id'] );
		}

	}

	return $contactStr;

}




function zeroBSCRM_html_companyTimeline($companyID=-1,$logs=false,$companyObj=false){ 

	global $zeroBSCRM_logTypes, $zbs;

	if (isset($companyID) && $companyID > 0 && $logs === false){

		// get logs
        $logs = zeroBSCRM_getCompanyLogs($companyID,true,100,0,'',false);

	}


	// Compile a list of actions to show
	// - if under 10, show them all
	// - if over 10, show creation, and 'higher level' logs, then latest
	// - 7/2/19 WH modified this to catch "creation" logs properly, and always put them at the end
	// ... (we were getting instances where transaction + contact created in same second, which caused the order to be off)
	$logsToShow = array(); $creationLog = false;

	if (count($logs) <= 10){

		$logsToShow = $logs;

		$logsF = array(); $creationLog = false;
		// here we have to just do a re-order to make sure created is last :) 
		foreach ($logsToShow as $l){

			if ($l['type'] == 'created') 
				$creationLog = $l;
			else
				$logsF[] = $l;

		}

		// add it
		if (is_array($creationLog)) $logsF[] = $creationLog;

		// tidy
		$logsToShow = $logsF; 
		unset($logsF);
		unset($creationLog);

	} else {

		// cherry pick 9 logs

		// 1) latest
		$logsToShow[] = current($logs);

		// 2) cherry pick 8 middle events
		$logTypesToPrioritise = array(
									   'Call',
									   'Email',
									   'Note'
									   );


			// convert to type stored in db
			$x = array();
			foreach ($logTypesToPrioritise as $lt) $x[] = zeroBSCRM_logTypeStrToDB($lt);
			$logTypesToPrioritise = $x; unset($x);


			// for now, abbreviated, just cycle through + pick any in prioritised group... could do this staggered by type/time later
			foreach ($logs as $l){
				if ($l['type'] == 'created'){

					// add to this var
					$creationLog = $l;

				} else {

					// normal pickery
					if (count($logsToShow) < 9){ 
						if (in_array($l['type'], $logTypesToPrioritise)) $logsToShow[] = $l;
					} else {
						break;
					}

				}

			}

		// 3) created
		// for now, assume first log is created, if it's not, add one with date
		// ... this'll cover 100+ logs situ
		// WH changed 7/2/18 to remove issue mentioned above 
			// $creationLog = end($logs);
		if ( $creationLog == false ) {

			// retrieve it
			if ( $zbs->isDAL2() ) {
			    $creationLog = zeroBSCRM_getObjCreationLog( $companyID, 1 );
            }
		}
		if (is_array($creationLog)){ //if ($creationLog['type'] == 'Create' || strpos($creationLog['shortdesc'], 'Created') > 0){

			$logsToShow[] = $creationLog;

		} else {

			// if has creation date (companyObj)
			if ($companyObj != false){	

				// manufacture a created log
				$logsToShow[] = array(

					'id' => -1,
					'created' => $companyObj['created'],
					'name' => '',

					// also add DAL2 support:
					'type' => __('Created',"zero-bs-crm"),
					'shortdesc' => __(jpcrm_label_company().'Created',"zero-bs-crm"),
					'longdesc' => __(jpcrm_label_company().' was created',"zero-bs-crm"),

					'meta' => array(
			          'type' => __('Created',"zero-bs-crm"),
			          'shortdesc' => __(jpcrm_label_company().' Created',"zero-bs-crm"),
			          'longdesc' => __(jpcrm_label_company().' was created',"zero-bs-crm")
					),
					'owner' => -1,
					//nicetime

				);

			}
		}


	}


	if (count($logsToShow) > 0){ ?>
	<ul class="zbs-timeline">
                <?php $prevDate = ''; $i = 0; foreach ($logsToShow as $log){ 

                	// format date
					$d = new DateTime($log['created']);
				  	$formatted_date = $d->format(zeroBSCRM_getDateFormat());

				  	// check if same day as prev log
				  	$sameDate = false; 
				  	if ($formatted_date == $prevDate) $sameDate = true;
				  	$prevDate = $formatted_date;

				  	// ico?
				  	$ico = ''; $logKey = strtolower(str_replace(' ','_',str_replace(':','_',$log['type'])));
				  	if (isset($zeroBSCRM_logTypes['zerobs_company'][$logKey])) $ico = $zeroBSCRM_logTypes['zerobs_company'][$logKey]['ico'];
				  	// these are FA ico's at this point


				  	// fill in nicetime if using :)
				  	// use a setting to turn on off?
				  	if (isset($log['createduts']) && !empty($log['createduts']) && $log['createduts'] > 0){
				  		//$log['nicetime'] = date('H:i',$log['createduts']);
				  		$log['nicetime'] = zeroBSCRM_date_i18n('H:i', $log['createduts'], true, false);
				  	}

				  	// if it's last one, make sure it has class:
				  	$notLast = true; if (count($logsToShow) == $i+1) $notLast = false;

                	?>
                <li class="zbs-timeline-item<?php 
                if ($sameDate && $notLast) echo '-contd'; 
                if (empty($logTitle)) echo ' zbs-timeline-item-notitle'; 
                if (!$notLast) echo ' zbs-last-item'; // last item (stop rolling padding)
                ?> zbs-single-log" <?php if (isset($log['id']) && $log['id'] !== -1) echo 'id="zbs-company-log-'. esc_attr( $log['id'] ).'"'; ?>>
                    <?php if (!$sameDate){ ?><div class="zbs-timeline-info">
                        <span><?php echo esc_html( $formatted_date ); ?></span>
                    </div><?php } ?>
                    <div class="zbs-timeline-marker"></div>
                    <div class="zbs-timeline-content"><?php

                        	// if multiple owners
                        	/* show "team member who enacted"?
                        	similar to https://semantic-ui.com/views/feed.html
                        	<div class="label">
					          <img src="/images/avatar/small/elliot.jpg">
					        </div> */

                        ?>
                        <h3 class="zbs-timeline-title"><?php
                         if (!empty($ico)) echo '<i class="fa '. esc_attr( $ico ) .'"></i> '; 
                         // DAL 2 saves type as permalinked
                         if ($zbs->isDAL2()){
                         	if (isset($zeroBSCRM_logTypes['zerobs_company'][$logKey])) echo esc_html( $zeroBSCRM_logTypes['zerobs_company'][$logKey]['label'] );
                         } else {
                         	if (isset($log['type'])) echo esc_html( $log['type'] ); 
                         }
                         ?></h3>
						<p>
						<?php
						if ( isset( $log['shortdesc'] ) ) {
							echo wp_kses( $log['shortdesc'], array( 'i' => array( 'class' => true ) ) );
							if ( isset( $log['author'] ) ) {
								echo ' &mdash; ' . esc_html( $log['author'] );
							}
							if ( isset( $log['nicetime'] ) ) {
								echo ' &mdash; <i class="clock icon"></i>' . esc_html( $log['nicetime'] );
							}
						}
						?>
						</p>
                    </div>
                </li>
                <?php $i++; } ?>
            </ul>
            <?php

    }
}


/* ======================================================
  / Company
   ====================================================== */



/* ======================================================
  Quotes
   ====================================================== */

	function zeroBSCRM_html_quoteStatusLabel($quote=array()){

		$statusInt = zeroBS_getQuoteStatus($quote,true);

		switch($statusInt){
		  case -2: // published not accepted
			  return 'ui orange label';
			  break;
		  case -1: // draft
			  return 'ui grey label';
			  break;
		}
		
		// accepted
		return 'ui green label';

	}

	function zeroBSCRM_html_QuoteDate($quote=array()){

		// v3.0:
		if (isset($quote['date_date'])) return "<span class='zbs-action'><strong>" . $quote['date_date'] . "</strong></span>";

		// <3.0
		if (isset($quote['meta']) && isset($quote['meta']['date'])){

			// wh fix, we're now saving this in format, no need to get it then resave it
			// also, with 22/06/18 it's in a format DateTime can't get.
			// use DateTime::createFromFormat('!'.zeroBSCRM_date_defaultFormat(), $dateInFormat)->getTimestamp();
			//$d = new DateTime($quote['meta']['date']);
			//$formatted_date = $d->format(zeroBSCRM_getDateFormat());  
			$formatted_date = $quote['meta']['date'];

			return "<span class='zbs-action'><strong>" . $formatted_date . "</strong></span>";

		}

		return '-';
	}

/* ======================================================
  /	Quotes
   ====================================================== */

/* ======================================================
  Invoices
   ====================================================== */

	function zeroBSCRM_html_invoiceStatusLabel($inv=array()){

		$status = ''; 

		// <3.0
		if (isset($inv['meta']) && isset($inv['meta']['status'])) $status = $inv['meta']['status'];
		// 3.0
		if (isset($inv['status'])) $status = $inv['status'];

		switch($status){
		  case __("Draft",'zero-bs-crm'):
			  return 'ui teal label';
			  break;
		  case __("Unpaid",'zero-bs-crm'):
			  return 'ui orange label';
			  break;
		  case __("Paid",'zero-bs-crm'): 
			  return 'ui green label';
			  break;
		  case __("Overdue",'zero-bs-crm'):
			  return 'ui red label';
			  break;
		  case __( "Deleted", 'zero-bs-crm' ):
			  return 'ui red label';
			  break;
		}

		return 'ui grey label';

	}

	function zeroBSCRM_html_invoiceDate($inv=array()){

		if (isset($inv['date_date'])){

			return "<span class='zbs-action'><strong>" . $inv['date_date'] . "</strong></span>";

		}

		// else <3.0

		if (isset($inv['meta']) && isset($inv['meta']['date'])){

			// wh fix, MS, you're saving this in format, no need to get it then resave it
			// also, with 22/06/18 it's in a format DateTime can't get.
			// use DateTime::createFromFormat('!'.zeroBSCRM_date_defaultFormat(), $dateInFormat)->getTimestamp();
			//$d = new DateTime($inv['meta']['date']);
			//$formatted_date = $d->format(zeroBSCRM_getDateFormat());  
			$formatted_date = $inv['meta']['date'];

			return "<span class='zbs-action'><strong>" . $formatted_date . "</strong></span>";

		}

		return '-';
	}

/* ======================================================
  /	Invoices
   ====================================================== */

/* ======================================================
  Transactions
   ====================================================== */

	function zeroBSCRM_html_transactionStatusLabel($trans=array()){

		$status = ''; 

		// <3.0
		if (isset($inv['meta']) && isset($inv['meta']['status'])) $status = $inv['meta']['status'];
		// 3.0
		if (isset($inv['status'])) $status = $inv['status'];


		switch($status){
		  case __("failed",'zero-bs-crm'):
			  return 'ui orange label';
			  break;
		  case __("refunded",'zero-bs-crm'):
			  return 'ui red label';
			  break;
		  case __("succeeded",'zero-bs-crm'):
			  return 'ui green label';
			  break;
		  case __("completed",'zero-bs-crm'): 
			  return 'ui green label';
			  break;

		}

		
		return 'ui grey label';
	}

function zeroBSCRM_html_transactionDate($transaction){

	// v3 no need for any of the below
	if (isset($transaction['date_date'])){

		return "<span class='zbs-action'><strong>" . $transaction['date_date']  . "</strong></span>";

	}

	// <3.0

	// saved in format, no need
	  //$d = new DateTime($transaction['created']);
		//$formatted_date = $d->format(zeroBSCRM_getDateFormat());  
	// zeroBSCRM_date_i18n('H:i', $log['createduts'], true, false);

	//transaction created in $post->post_date_gmt so will be the correct UTS for the below
	$transaction_uts = strtotime($transaction['created']);
	$formatted_date = zeroBSCRM_date_i18n(zeroBSCRM_getDateFormat() . " " . zeroBSCRM_getTimeFormat(), $transaction_uts, true, false);
  return "<span class='zbs-action'><strong>" . $formatted_date  . "</strong></span>";
}

/* ======================================================
  /	Transactions
   ====================================================== */




/* ======================================================
  Object Nav
   ====================================================== */

// Navigation block (usually wrapped in smt like:)
// $filterStr = '<div class="ui items right floated" style="margin:0">'.zeroBSCRM_getObjNav($zbsid,'edit','CONTACT').'</div>';
function zeroBSCRM_getObjNav( $id = -1, $key = '', $type = ZBS_TYPE_CONTACT ) {

	global $zbs;

	$html = '';
	$navigationMode = $zbs->settings->get( 'objnav' );

	// The first addition of a contact is actually 'edit' but gives the option to view.
	$id = !empty( $_GET['zbsid'] ) ? zeroBSCRM_io_sanitizeInt( $_GET['zbsid'] ) : -1;

	switch ($type) {

		case ZBS_TYPE_CONTACT:

			// contact nav
			$navigation = $zbs->DAL->contacts->getContactPrevNext( $id );

			$html = '<span class="ui navigation-quick-links">';

			$html .= '<a style="margin-right:6px;" href="' . jpcrm_esc_link( $zbs->slugs["managecontacts"] ) . '" class="ui button mini was-inverted basic" id="back-to-list">' . esc_html( __( 'Back to List', 'zero-bs-crm' ) ) . '</a>';

			// PREV
			if ( $navigation && $navigationMode === 1 ) {
				if( $navigation['prev'] !== null ) {
					$html .= '<a href="' . jpcrm_esc_link( $key, $navigation['prev'], 'zerobs_customer', false ) . '" class="ui labeled icon button mini" id="zbs-nav-prev"><i class="left chevron icon"></i>' . esc_html( __( 'Prev', 'zero-bs-crm' ) ) . '</a>';
				}
				if( $navigation['next'] !== null ) {
					$html .= '<a href="' . jpcrm_esc_link( $key, $navigation['next'], 'zerobs_customer', false ) . '" class="ui right labeled icon button mini" id="zbs-nav-next">' . esc_html( __( 'Next', 'zero-bs-crm' ) ) . '<i class="right chevron icon"></i></a>';
				}
			}

			#} If in edit mode, add in save + view
			if ( $key === 'edit' ) {
				if( $id > 0 ) {
					$html .= '<a style="margin-left:6px;" class="ui icon button blue mini labeled" href="' . jpcrm_esc_link( 'view', $id, 'zerobs_customer' ) . '" id="zbs-nav-view"><i class="eye left icon"></i> ' . esc_html( __( 'View', 'zero-bs-crm' ) ) . '</a>';
				}
				if ( zeroBSCRM_permsCustomers() ) {
					$html .= '<button class="ui icon button mini green labeled" type="button" id="zbs-edit-save" style="margin-right:5px;margin-left:5px;"><i class="icon save"></i>' . esc_html( __( 'Save', 'zero-bs-crm' ) ) . '</button>';
				}

			}

			$html .= '</span>';

			break;

		case ZBS_TYPE_COMPANY:

			// company nav
			$navigation = $zbs->DAL->companies->getCompanyPrevNext( $id );

			$html = '<span class="ui navigation-quick-links">';
			$html .= '<a style="margin-right:6px;" href="' . jpcrm_esc_link( $zbs->slugs["managecompanies"] ) . '" class="ui button mini was-inverted basic" id="back-to-list">' .  esc_html( __( 'Back to List', 'zero-bs-crm' ) ) . '</a>';

			// PREV
			if ( $navigation && $navigationMode === 1 ) {
				if ( $navigation['prev'] !== null ) {
					$html .= '<a href="' . jpcrm_esc_link( $key, $navigation['prev'], 'zerobs_company', false ) . '" class="ui labeled icon button mini"><i class="left chevron icon"></i>' . esc_html( __( 'Prev', 'zero-bs-crm' ) ) . '</a>';
				}
				if ( $navigation['next'] !== null ) {
					$html .= '<a href="' . jpcrm_esc_link( $key, $navigation['next'], 'zerobs_company', false ) . '" class="ui right labeled icon button mini">' . esc_html( __( 'Next', 'zero-bs-crm' ) ) . '<i class="right chevron icon"></i></a>';
				}
			}

			#} If in edit mode, add in save + view
			if ( $key === 'edit' ) {
				$html .= '<a style="margin-left:6px;" class="ui icon button blue mini labeled" href="' . jpcrm_esc_link( 'view', $id, ZBS_TYPE_COMPANY ) . '"><i class="eye left icon"></i> ' . esc_html( __( 'View', 'zero-bs-crm' ) ) . '</a>';
				if ( zeroBSCRM_permsCustomers() ) {
					// $html .= '<button class="ui icon button mini green labeled" type="button" id="zbs-edit-save" style="margin-right:5px;margin-left:5px;"><i class="icon save"></i>' . esc_html( __( 'Save', 'zero-bs-crm' ) ) . '</button>';
				}

			}

			$html .= '</span>';

			break;
	}

	return $html;

}
/* ======================================================
  /	Object Nav
   ====================================================== */



/* ======================================================
  Tasks
   ====================================================== */

	function zeroBSCRM_html_taskStatusLabel($task=array()){
		
		if (isset($task['complete']) && $task['complete'] === 1) return 'ui green label';

		return 'ui grey label';

	}

	function zeroBSCRM_html_taskDate($task=array()){

	    if (!isset($task['start'])){

	        // starting date
	        //$start_d = date('m/d/Y H') . ":00:00";
	        //$end_d =  date('m/d/Y H') . ":00:00";
	        // wh modified to now + 1hr - 2hr
	        $start_d = date('d F Y H:i:s',(time()+3600));
	        $end_d =  date('d F Y H:i:s',(time()+3600+3600));


	    } else {

			// Note: Because this continued to be use for task scheduler workaround (before we got to rewrite the locale timestamp saving)
			// ... we functionised in Core.Localisation.php to keep it DRY

			// temp pre v3.0 fix, forcing english en for this datepicker only.
			// requires js mod: search #forcedlocaletasks
			// (Month names are localised, causing a mismatch here (Italian etc.))
			// ... so we translate:
			// d F Y H:i:s (date - not locale based)
			// https://www.php.net/manual/en/function.date.php
			// ... into
			// %d %B %Y %H:%M:%S (strfttime - locale based date)
			// (https://www.php.net/manual/en/function.strftime.php)

			// phpcs:disable Squiz.PHP.CommentedOutCode.Found, Squiz.Commenting.BlockComment.NoCapital

			/*
			$start_d = zeroBSCRM_date_i18n('d F Y H:i:s', $taskObject['start']);
			$end_d = zeroBSCRM_date_i18n('d F Y H:i:s', $taskObject['end']);
			*/

			/*
			@todo - this is to be refactored.
			zeroBSCRM_locale_setServerLocale('en_US');
			$start_d = strftime("%d %B %Y %H:%M:%S",$task['start']);
			$end_d =  strftime("%d %B %Y %H:%M:%S",$task['end']);
			zeroBSCRM_locale_resetServerLocale();
			*/
			// phpcs:enable Squiz.PHP.CommentedOutCode.Found, Squiz.Commenting.BlockComment.NoCapital

	        $start_d = zeroBSCRM_date_forceEN($task['start']);
	        $end_d = zeroBSCRM_date_forceEN($task['end']);

	    }

	    return $start_d . ' - ' . $end_d;
	}

/* ======================================================
  /	Tasks
   ====================================================== */



/* ======================================================
  Email History
   ====================================================== */

function zeroBSCRM_outputEmailHistory($userID = -1){

	global $zbs;

	//get the last 50 (can add pagination later...)
    $email_hist = zeroBSCRM_get_email_history(0,50, $userID); 
    ?>
    <style>
    	.zbs-email-sending-record {
    		margin-bottom:0.8em;
    	}
    	.zbs-email-sending-record .avatar{
    		margin-left: 5px;
    		border-radius: 50%;
    	}
    	.zbs-email-detail {
		    width: 80%;
		    display: inline-block;
    	}
	</style>
    <?php

    if(count($email_hist) == 0){
    	echo "<div class='ui message'><i class='icon envelope outline'></i>" . esc_html( __('No Recent Emails','zero-bs-crm') ) . "</div>";
    }
    
    foreach($email_hist as $em_hist){

        $email_subject = zeroBSCRM_mailTemplate_getSubject($em_hist->zbsmail_type);
        $emoji = '🤖';
        if($email_subject ==''){
          //then this is a custom email
          $email_subject = $em_hist->zbsmail_subject;
          $emoji ='😀';
        }
        // if still empty
        if (empty($email_subject)) $email_subject = __('Untitled','zero-bs-crm');
        echo "<div class='zbs-email-sending-record'>";
		echo "<span class='label blue ui tiny hist-label' style='float:left'> " . esc_html( __('sent','zero-bs-crm') ) . ' </span>';
		echo '<div class="zbs-email-detail">'. esc_html( $emoji );
		echo " <strong>" . esc_html( $email_subject ) . "</strong><br />";
		echo "<span class='sent-to'>" . esc_html( __(" sent to ", 'zero-bs-crm') ) . "</span>";
		// -10 are the system emails sent to CUSTOMERS
		if($em_hist->zbsmail_sender_wpid == -10){
			$customer = zeroBS_getCustomerMeta($em_hist->zbsmail_target_objid);
			$link = admin_url('admin.php?page='.$zbs->slugs['addedit'].'&action=view&zbsid=' .$em_hist->zbsmail_target_objid);
			if($customer['fname'] == '' && $customer['lname'] == ''){
				echo "<a href='".esc_url( $link )."'>" . esc_html( $customer['email'] ) . "</a>";
			}else{ 
				echo "<a href='".esc_url( $link )."'>" . esc_html( $customer['fname'] . ' ' . $customer['lname'] ) . "</a>";
			}
		}else if($em_hist->zbsmail_sender_wpid == -11){
			//quote proposal accepted (sent to admin...)
			$userIDobj = get_user_by( 'ID', $em_hist->zbsmail_target_objid );
			echo esc_html( $userIDobj->data->display_name );
			echo jpcrm_get_avatar( $em_hist->zbsmail_target_objid, 20 ); 
		
		}else if($em_hist->zbsmail_sender_wpid == -12){
			//quote proposal accepted (sent to admin...) -12 is the you have a new quote...
			$customer = zeroBS_getCustomerMeta($em_hist->zbsmail_target_objid);
			$link = admin_url('admin.php?page='.$zbs->slugs['addedit'].'&action=view&zbsid=' .$em_hist->zbsmail_target_objid);
			if($customer['fname'] == '' && $customer['lname'] == ''){
				echo "<a href='".esc_url( $link )."'>" . esc_html( $customer['email'] ) . "</a>";
			}else{ 
				echo "<a href='".esc_url( $link )."'>" . esc_html( $customer['fname'] . ' ' . $customer['lname'] ) . "</a>";
			}
		}else if($em_hist->zbsmail_sender_wpid == -13){
			//-13 is the event notification (sent to the OWNER of the event) so a WP user (not ZBS contact)...
			$userIDobj = get_user_by( 'ID', $em_hist->zbsmail_target_objid );
			echo esc_html( $userIDobj->data->display_name );
			echo jpcrm_get_avatar( $em_hist->zbsmail_target_objid, 20 ); 
		}else{
			$customer = zeroBS_getCustomerMeta($em_hist->zbsmail_target_objid);

			//zbs_prettyprint($customer);

			//then it is a CRM team member [team member is quote accept]....
			$link = admin_url('admin.php?page='.$zbs->slugs['addedit'].'&action=view&zbsid=' .$em_hist->zbsmail_target_objid);
			if($customer['fname'] == '' && $customer['lname'] == ''){
				echo "<a href='".esc_url( $link )."'>" . esc_html( $customer['email'] ) . "</a>";
			}else{ 
				echo "<a href='".esc_url( $link )."'>" . esc_html( $customer['fname'] . " " . $customer['lname'] ) . "</a>";
			}

			$userIDobj = get_user_by( 'ID', $em_hist->zbsmail_sender_wpid );
			if (gettype($userIDobj) == 'object'){
				echo esc_html( __(' by ','zero-bs-crm') . $userIDobj->data->display_name );
				echo jpcrm_get_avatar( $em_hist->zbsmail_sender_wpid, 20 ); 
			}

		}
		$unixts =  date('U', $em_hist->zbsmail_created);
		$diff   = human_time_diff($unixts, time());
		echo "<time>". esc_html( $diff . __(' ago', 'zero-bs-crm') ) . "</time>";
		if($em_hist->zbsmail_opened == 1){
			echo "<span class='ui green basic label mini' style='margin-left:7px;'><i class='icon check'></i> ". esc_html( __('opened','zero-bs-crm') ) ."</span>";
		}
        echo "</div></div>";
    }
}

/* ======================================================
  /	Email History
   ====================================================== */


/* ======================================================
  Edit Pages Field outputter
   ====================================================== */

   // puts out edit fields for an object (e.g. quotes)
   // centralisd/genericified 20/7/18 wh 2.91+
   function zeroBSCRM_html_editFields($objArr=false,$fields=false,$postPrefix='zbs_',$skipFields=array()){

   		if (is_array($fields)){

	        foreach ($fields as $fieldK => $fieldV){

	        	// we skip some when we put them out specifically/manually in the metabox/ui
	        	if (!in_array($fieldK,$skipFields)) zeroBSCRM_html_editField($objArr,$fieldK,$fieldV,$postPrefix);

	        }

	    }
   }

   // puts out edit field for an object (e.g. quotes)
   // centralisd/genericified 20/7/18 wh 2.91+
   function zeroBSCRM_html_editField($dataArr=array(), $fieldKey = false, $fieldVal = false, $postPrefix = 'zbs_'){

   	/* debug
   	if ($fieldKey == 'house-type') {
   		echo '<tr><td colspan="2">'.$fieldKey.'<pre>'.print_r(array($fieldVal,$dataArr),1).'</pre></td></tr>';
   	} */

   		if (!empty($fieldKey) && is_array($fieldVal)){

	   		// infer a default (Added post objmodels v3.0 as a potential.)
	   		$default = ''; if (is_array($fieldVal) && isset($fieldVal['default'])) $default = $fieldVal['default'];

	   		// get a value (this allows field-irrelevant global tweaks, like the addr catch below...)
	   		// -99 = notset
	   		$value = -99; if (isset($dataArr[$fieldKey])) $value = $dataArr[$fieldKey];

	   		// custom classes for inputs
	   		$inputClasses = isset($fieldVal['custom-field']) ? ' zbs-custom-field' : '';

	   			// contacts got stuck in limbo as we upgraded db in 2 phases. 
	   			// following catches old str and modernises to v3.0
	   			// make addresses their own objs 3.0+ and do away with this.
	   			// ... hard typed to avoid custom field collisions, hacky at best.
	   			switch ($fieldKey){

	   				case 'secaddr1':
	   					 if (isset($dataArr['secaddr_addr1'])) $value = $dataArr['secaddr_addr1'];
	   					 break;

	   				case 'secaddr2':
	   					 if (isset($dataArr['secaddr_addr2'])) $value = $dataArr['secaddr_addr2'];
	   					 break;

	   				case 'seccity':
	   					 if (isset($dataArr['secaddr_city'])) $value = $dataArr['secaddr_city'];
	   					 break;

	   				case 'seccounty':
	   					 if (isset($dataArr['secaddr_county'])) $value = $dataArr['secaddr_county'];
	   					 break;

	   				case 'seccountry':
	   					 if (isset($dataArr['secaddr_country'])) $value = $dataArr['secaddr_country'];
	   					 break;

	   				case 'secpostcode':
	   					 if (isset($dataArr['secaddr_postcode'])) $value = $dataArr['secaddr_postcode'];
	   					 break;
	   			}
	   			/* old way, doesn't work reliably - more likely to break custom fields:
	   			if (strpos($fieldKey, 'secaddr') > -1){

	   				if ($value == -99){

	   					// try the alternate (secaddr_addr1 -> secaddr1)
	   					// ... really this fix is only req. for contacts, and will fudge up if users use custom fields with similar names..
	   					// ... def overcome more latterally v3.0+
	   					//$tempKey = str_replace('secaddr_','sec',$fieldKey);	   					
	   					if (isset($dataArr[$tempKey])) $value = $dataArr[$tempKey];secaddr_addr1
	   				}	   		
	   				
	   				//echo $fieldKey.' = '.$tempKey.' = '.$value.'!<br>';
	   			}*/

   			global $zbs;

	        switch ($fieldVal[0]){

	            case 'text':

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td>
	                	<div class="zbs-text-input <?php echo esc_attr( $fieldKey ); ?>">

	                    	<input type="text" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control widetext zbs-dc<?php echo esc_attr( $inputClasses ); ?>" placeholder="<?php if (isset($fieldVal[2])) echo esc_attr__($fieldVal[2],'zero-bs-crm'); ?>" value="<?php if ($value !== -99) echo esc_attr( $value ); else echo esc_attr( $default ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>" />

	                    </div>
	                </td></tr><?php

	                break;

	            case 'price':

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td>

	                    <?php echo esc_html( zeroBSCRM_getCurrencyChr() ); ?> <input style="width: 130px;display: inline-block;" type="text" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control numbersOnly zbs-dc<?php echo esc_attr( $inputClasses ); ?>" placeholder="<?php if (isset($fieldVal[2])) echo esc_attr__($fieldVal[2],'zero-bs-crm'); ?>" value="<?php if ($value !== -99) echo esc_attr( $value ); else echo esc_attr( $default );  ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>" />

	                </td></tr><?php

	                break;

                case 'numberfloat':

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td>

	                    <input style="width: 130px;display: inline-block;" type="text" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control numbersOnly zbs-dc<?php echo esc_attr( $inputClasses ); ?>" placeholder="<?php if (isset($fieldVal[2])) echo esc_attr__($fieldVal[2],'zero-bs-crm'); ?>" value="<?php if ($value !== -99) echo esc_attr( $value ); else echo esc_attr( $default ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>" />

	                </td></tr><?php

	                break;

                case 'numberint':

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td>

	                    <input style="width: 130px;display: inline-block;" type="text" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control intOnly zbs-dc<?php echo esc_attr( $inputClasses ); ?>" placeholder="<?php if (isset($fieldVal[2])) echo esc_attr__($fieldVal[2],'zero-bs-crm'); ?>" value="<?php if ($value !== -99) echo esc_attr( $value ); else echo esc_attr( $default ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>" />

	                </td></tr><?php

	                break;


	            case 'date':

								$datevalue = '';
								if ($value !== -99) {
									$datevalue = $value;
								}

								// if DAL3 we need to use translated dates here :)
								if ( $zbs->isDAL3() && $value != -99 ) {
									$datevalue = zeroBSCRM_date_i18n( -1, $datevalue, false, true );
								}

	            	// if this is a custom field, and is unset, we let it get passed as empty (gh-56)
	            	if ( isset( $fieldVal['custom-field'] ) && ( $value === -99 || $value === '' ) ) {
	            		$datevalue = '';
	            	}
								// if already blank, allow it to be blank
								else if ( $value === -99 ) {
									$inputClasses = ' zbs-empty-start';
	            	}
								

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td>
	                    <input type="text" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control jpcrm-date zbs-dc<?php echo esc_attr( $inputClasses ); ?>" placeholder="<?php if (isset($fieldVal[2])) echo esc_attr__($fieldVal[2],'zero-bs-crm'); ?>" value="<?php echo esc_attr( $datevalue ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>" />
	                </td></tr><?php

	                break;


	            case 'datetime':

	            	$datevalue = ''; if ($value !== -99) $datevalue = $value; 

	            	// if DAL3 we need to use translated dates here :)
	            	if ($zbs->isDAL3()) $datevalue = zeroBSCRM_date_i18n_plusTime(-1,$datevalue,true);

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td>

	                    <input type="text" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control jpcrm-date-time zbs-dc<?php echo esc_attr( $inputClasses ); ?>" placeholder="<?php if (isset($fieldVal[2])) echo esc_attr__($fieldVal[2],'zero-bs-crm'); ?>" value="<?php echo esc_attr( $datevalue ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>" />

	                </td></tr><?php

	                break;

	            case 'select':
									//don't load prefix select if prefix is hidden in settings
									if ($zbs->settings->get('showprefix') == 0 && $fieldKey == 'prefix') {
										break;
									}

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td>
	                    <select name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control zbs-watch-input zbs-dc<?php echo esc_attr( $inputClasses ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>">
	                        <?php
                                // pre DAL 2 = $fieldV[3], DAL2 = $fieldV[2]
                                $options = false; 
                                if (isset($fieldVal[3]) && is_array($fieldVal[3])) {
                                    $options = $fieldVal[3];
                                } else {
                                    // DAL2 these don't seem to be auto-decompiled?
                                    // doing here for quick fix, maybe fix up the chain later.
                                    if (isset($fieldVal[2])) $options = explode(',', $fieldVal[2]);
                                }

	                            //if (isset($fieldVal[3]) && count($fieldVal[3]) > 0){
                                if (isset($options) && is_array($options) && count($options) > 0 && $options[0] != ''){

                                	// if $default, use that
                                	$selectVal = '';
	                                if ($value !== -99 && !empty($value)){
	                                	$selectVal = $value;
	                                } elseif (!empty($default))
                                		$selectVal = $default;

	                                //catcher
																	echo '<option value=""' . ($fieldKey == 'prefix' ? '' :' disabled="disabled"');
	                                if (empty($default) && ($value == -99 || ($value !== -99 && empty($value)))) echo ' selected="selected"';
	                                echo '>'. esc_html__('Select','zero-bs-crm').'</option>';

	                                foreach ($options as $opt){

	                                    echo '<option value="' . esc_attr( $opt ) . '"';

	                                    if ($selectVal == $opt) echo ' selected="selected"'; 
	                                    echo '>' . esc_html( $opt ) . '</option>';

	                                }

	                            } else echo '<option value="">'. esc_html__('No Options','zero-bs-crm').'!</option>';

	                        ?>
	                    </select>
                        <input type="hidden" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>_dirtyflag" id="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>_dirtyflag" value="0" />
	                </td></tr><?php

	                break;

	            case 'tel':

			        // Click 2 call?
			        $click2call = $zbs->settings->get('clicktocall');

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td class="zbs-tel-wrap">

	                    <input type="text" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control zbs-tel zbs-dc<?php echo esc_attr( $inputClasses ); ?>" placeholder="<?php if (isset($fieldVal[2])) echo esc_attr__($fieldVal[2],'zero-bs-crm'); ?>" value="<?php if ($value !== -99) echo esc_attr( $value ); else echo esc_attr( $default ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>" />
	                     <?php if ($click2call == "1" && $value !== -99 && !empty($value)) echo '<a href="' . esc_attr( zeroBSCRM_clickToCallPrefix() . $value ) . '" class="button"><i class="fa fa-phone"></i> ' . esc_html( $value ) . '</a>'; ?>

                                        <?php 

                                            if ($fieldKey == 'mobtel'){

                                                $sms_class = 'send-sms-none';
                                                $sms_class = apply_filters('zbs_twilio_sms', $sms_class); 
                                                do_action('zbs_twilio_nonce');

                                                $customerMob = ''; 
                                                // wh genericified 
                                                //if (is_array($dataArr) && isset($dataArr[$fieldKey]) && isset($dataArr['id'])) $customerMob = zeroBS_customerMobile($dataArr['id'],$dataArr);
                                                if ($value !== -99) $customerMob = $value;
                                                
                                                if (!empty($customerMob)) echo '<a class="' . esc_attr( $sms_class ) . ' button" data-smsnum="' . esc_attr( $customerMob ) .'"><i class="mobile alternate icon"></i> '. esc_html__('SMS','zero-bs-crm').': ' . esc_html( $customerMob ) . '</a>';

                                            }

                                            ?>
	                </td></tr><?php

	                break;

	            case 'email':

                    // added zbs-text-input class 5/1/18 - this allows "linkify" automatic linking
                    // ... via js <div class="zbs-text-input">
                    // removed from email for now zbs-text-input

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td>
	                	<div class="<?php echo esc_attr( $fieldKey ); ?>">

	                    	<input type="text" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control zbs-email zbs-dc<?php echo esc_attr( $inputClasses ); ?>" placeholder="<?php if (isset($fieldVal[2])) echo esc_attr__($fieldVal[2],'zero-bs-crm'); ?>" value="<?php if ($value !== -99) echo esc_attr( $value ); else echo esc_attr( $default ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>" />

	                    </div>
	                </td></tr><?php

	                break;

	            case 'textarea':

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td>
	                    <textarea name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control zbs-dc<?php echo esc_attr( $inputClasses ); ?>" placeholder="<?php if (isset($fieldVal[2])) echo esc_attr__($fieldVal[2],'zero-bs-crm'); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>"><?php if ($value !== -99) echo esc_textarea( $value ); else echo esc_textarea( $default ); ?></textarea>
	                </td></tr><?php

	                break;

	            #} Added 1.1.19 
	            case 'selectcountry':

	                $countries = zeroBSCRM_loadCountryList();

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td>
	                    <select name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control zbs-dc<?php echo esc_attr( $inputClasses ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>">
	                        <?php

	                            #if (isset($fieldVal[3]) && count($fieldVal[3]) > 0){
	                            if (isset($countries) && count($countries) > 0){

	                                //catcher
	                                echo '<option value=""';
	                                if (empty($default) && ($value == -99 || ($value !== -99 && empty($value)))) echo ' selected="selected"';
	                                echo '>'. esc_html__('Select','zero-bs-crm').'</option>';

	                                foreach ($countries as $countryKey => $country){

	                                        // temporary fix for people storing "United States" but also "US"
	                                        // needs a migration to iso country code, for now, catch the latter (only 1 user via api)


	                                    echo '<option value="' . esc_attr( $country ) . '"';
	                                    if ($value !== -99 && (
	                                                strtolower($value) == strtolower($country)
	                                                ||
	                                                strtolower($value) == strtolower($countryKey)
	                                            )) echo ' selected="selected"'; 
	                                    echo '>' . esc_html( $country ) . '</option>';

	                                }
	                                

	                            } else echo '<option value="">'. esc_html__('No Countries Loaded','zero-bs-crm').'</option>';

	                        ?>
	                    </select>
	                </td></tr><?php

	                break;


	                // 2.98.5 added autonumber, checkbox, radio

	                // auto number - can't actually edit autonumbers, so its just outputting :)
		            case 'autonumber':

		                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
		                <td class="zbs-field-id">
		                	<?php

		                		// output any saved autonumber for this obj
		                		$str = ''; if ($value !== -99) $str = $value;

		                		// we strip the hashes saved in db for easy separation later
		                		$str = str_replace('#','',$str);

		                		// then output...
		                		if (empty($str)) 
		                			echo '~';
		                		else
		                			echo esc_html( $str );

		                		// we also output as input, which stops any overwriting + makes new ones for new records
		                		echo '<input type="hidden" value="' . esc_attr( $str ) . '" name="'. esc_attr( $postPrefix.$fieldKey ) .'" />';

		                	?>
		                </td></tr><?php

		                break;

		            // radio
		            case 'radio':

		                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
		                <td>
		                    <div class="zbs-field-radio-wrap">
		                        <?php

	                                // pre DAL 2 = $fieldV[3], DAL2 = $fieldV[2]
	                                $options = false; 
	                                if (isset($fieldVal[3]) && is_array($fieldVal[3])) {
	                                    $options = $fieldVal[3];
	                                } else {
	                                    // DAL2 these don't seem to be auto-decompiled?
	                                    // doing here for quick fix, maybe fix up the chain later.
	                                    if (isset($fieldVal[2])) $options = explode(',', $fieldVal[2]);
	                                }

		                            //if (isset($fieldVal[3]) && count($fieldVal[3]) > 0){
	                                if (isset($options) && is_array($options) && count($options) > 0 && $options[0] != ''){

	                                	$optIndex = 0;

		                                foreach ($options as $opt){

		                                	echo '<div class="zbs-radio"><input type="radio" name="'. esc_attr( $postPrefix.$fieldKey ) .'" id="'. esc_attr( $fieldKey.'-'.$optIndex ) .'" value="' . esc_attr( $opt ) . '"';

		                                    if ($value !== -99 && $value == $opt) echo ' checked="checked"'; 
		                                    echo ' /> <label for="'. esc_attr( $fieldKey.'-'.$optIndex ) .'">' . esc_html( $opt ) . '</label></div>';

		                                    $optIndex++;

		                                }

		                            } else echo '<label for="'. esc_attr( $fieldKey ) .'-0">'. esc_attr__('No Options','zero-bs-crm').'!</label>'; //<input type="radio" name="'.$postPrefix.$fieldKey.'" id="'.$fieldKey.'-0" value="" checked="checked" /> 

		                        ?>
		                    </div>
	                        <input type="hidden" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>_dirtyflag" id="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>_dirtyflag" value="0" />
		                </td></tr><?php

		                break;

		            // checkbox
		            case 'checkbox':

		                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
		                <td>
		                    <div class="zbs-field-checkbox-wrap">
		                        <?php

	                                // pre DAL 2 = $fieldV[3], DAL2 = $fieldV[2]
	                                $options = false; 
	                                if (isset($fieldVal[3]) && is_array($fieldVal[3])) {
	                                    $options = $fieldVal[3];
	                                } else {
	                                    // DAL2 these don't seem to be auto-decompiled?
	                                    // doing here for quick fix, maybe fix up the chain later.
	                                    if (isset($fieldVal[2])) $options = explode(',', $fieldVal[2]);
	                                }	
	                                
	                                // split fields (multi select)
	                                $dataOpts = array();
	                                if ($value !== -99 && !empty($value)){
	                                	$dataOpts = explode(',', $value);
	                                }

		                            //if (isset($fieldVal[3]) && count($fieldVal[3]) > 0){
	                                if (isset($options) && is_array($options) && count($options) > 0 && $options[0] != ''){

	                                	$optIndex = 0;

		                                foreach ($options as $opt){

		                                	echo '<div class="ui checkbox"><input type="checkbox" name="'. esc_attr( $postPrefix.$fieldKey.'-'.$optIndex ).'" id="'. esc_attr( $fieldKey.'-'.$optIndex ) .'" value="' . esc_attr( $opt ) . '"';
		                                    if (in_array($opt, $dataOpts)) echo ' checked="checked"'; 
		                                    echo ' /><label for="'. esc_attr( $fieldKey.'-'.$optIndex ) .'">' . esc_html( $opt ) . '</label></div>';

		                                    $optIndex++;

		                                }

		                            } else echo '<label for="'. esc_attr( $fieldKey ).'-0">'. esc_html__('No Options','zero-bs-crm').'!</label>';

		                        ?>
		                    </div>
	                        <input type="hidden" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>_dirtyflag" id="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>_dirtyflag" value="0" />
		                </td></tr><?php

		                break;

		            // tax
		            case 'tax':

	                ?><tr class="wh-large"><th><label for="<?php echo esc_attr( $fieldKey ); ?>"><?php esc_html_e($fieldVal[1],"zero-bs-crm"); ?>:</label></th>
	                <td>
	                    <select name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>" id="<?php echo esc_attr( $fieldKey ); ?>" class="form-control zbs-watch-input zbs-dc<?php echo esc_attr( $inputClasses ); ?>" autocomplete="zbs-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( $fieldKey ); ?>">
	                        <?php

	                        	// retrieve tax rates + cache
	                        	global $zbsTaxRateTable; if (!isset($zbsTaxRateTable)) $zbsTaxRateTable = zeroBSCRM_taxRates_getTaxTableArr();

	                            // if got em
                                if (isset($zbsTaxRateTable) && is_array($zbsTaxRateTable) && count($zbsTaxRateTable) > 0){

                                	// if $default, use that
                                	$selectVal = '';
	                                if ($value !== -99 && !empty($value)){
	                                	$selectVal = $value;
	                                } elseif (!empty($default))
                                		$selectVal = $default;

	                                //catcher
	                                echo '<option value=""';
	                                if (empty($default) && ($value == -99 || ($value !== -99 && empty($value)))) echo ' selected="selected"';
	                                echo '>' . esc_html( __( 'None', 'zero-bs-crm' ) ) . '</option>';

	                                foreach ($zbsTaxRateTable as $taxRate){

	                                    echo '<option value="'. esc_attr( $taxRate['id'] ) .'"';
	                                    if ($selectVal == $taxRate['id']) echo ' selected="selected"'; 
	                                    echo '>' . esc_html( $taxRate['name'] . ' (' . $taxRate['rate'] . '%)' ) . '</option>';

	                                }

	                            } else echo '<option value="">'. esc_html__('No Tax Rates Defined','zero-bs-crm').'!</option>';

	                        ?>
	                    </select>
                        <input type="hidden" name="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>_dirtyflag" id="<?php echo esc_attr( $postPrefix ); ?><?php echo esc_attr( $fieldKey ); ?>_dirtyflag" value="0" />
	                </td></tr><?php

	                break;

	        } // switch

    	} // if is legit params

   }

/* ======================================================
  /	Edit Pages Field outputter
   ====================================================== */






/* ======================================================
  Table Views (temporary)
  (These need moving into JS globals - something like bringing the listview js into 1 model js/php obj outputter)
   ====================================================== */

	// Temp here - takes a potential transaction column header
	// (can be a field key or a column key) and finds a str for title
	function zeroBS_objDraw_transactionColumnHeader($colKey=''){

			global $zbsTransactionFields, $zeroBSCRM_columns_transaction;

			$ret = ucwords(str_replace('_',' ',$colKey));

			// all fields (inc custom:)
			if (isset($zbsTransactionFields) && is_array($zbsTransactionFields) && isset($zbsTransactionFields[$colKey])){

				// key => name
				$ret = $zbsTransactionFields[$colKey][1];

			}
			// all columns (any with same key will override)					
			if (isset($zeroBSCRM_columns_transaction['all']) && is_array($zeroBSCRM_columns_transaction['all']) && isset($zeroBSCRM_columns_transaction['all'][$colKey])){

				// key => name
				$ret = $zeroBSCRM_columns_transaction['all'][$colKey][0];

			}

			return $ret;
	}

	// Temp here - takes a potential transaction column + returns html
	// these are mimics of js draw funcs, move into globals (eventually)
	// hacky at best... (WH wrote to quickly satisfy Borge freelance)
	function zeroBS_objDraw_transactionColumnTD($colKey='',$obj=false){

			$ret = '';

			if (!empty($colKey) && is_array($obj)){

				$linkOpen = jpcrm_esc_link('edit',$obj['id'],ZBS_TYPE_TRANSACTION);

				switch ($colKey){

					case 'id':
						$idRef = zeroBS_objDraw_generic_id($obj);
						if (isset($obj['ref'])){
							if (!empty($idRef)) $idRef .= ' - ';
							$idRef .= $obj['ref'];
						}
						$ret = '<a href="'.$linkOpen.'">'. $idRef .'</a>';
						$ret .= !empty($obj['title']) ? '<br>'.$obj['title'] : '';
						break;
					case 'editlink':
						$ret = '<a href="'.$linkOpen.'" class="ui button basic small">'. __('Edit','zero-bs-crm') . "</a>";
						break;
					case 'date':
						$ret = zeroBSCRM_html_transactionDate($obj);
						break;
					case 'item':
						$itemStr = ''; 
						if (isset($obj['meta'])) $itemStr = $obj['meta']['item']; // <3.0
						if (isset($obj['title'])) $itemStr = $obj['title']; // 3.0
						$ret = '<a href="'.$linkOpen.'">' . $itemStr . "</a>";
						break;
					case 'total':
						$total = 0;
						if (isset($obj['meta'])) $total = $obj['meta']['total']; // <3.0
						if (isset($obj['total'])) $total = $obj['total']; // 3.0
						$ret = zeroBSCRM_formatCurrency($total);
						break;
					case 'status':
						$status = '';
						if (isset($obj['meta'])) $status = $obj['meta']['status']; // <3.0
						if (isset($obj['status'])) $status = $obj['status']; // 3.0
						$ret = "<span class='".zeroBSCRM_html_transactionStatusLabel($obj)."'>" . ucfirst($status) . "</span>";
						break;

				}

				// if still empty, let's try generic text
				if (empty($ret)) $ret = zeroBS_objDraw_generic_text($colKey,$obj);

			}

			return $ret;
	}

	// Temp here
	// these are mimics of js draw funcs, move into globals (eventually)
	function zeroBS_objDraw_generic_id($obj=false){

			$ret = '';

			if (is_array($obj)){

				if (isset($obj['id'])) $ret = '#'.$obj['id'];
				if (isset($obj['zbsid'])) $ret = '#'.$obj['zbsid'];
				

			}

			return $ret;
	}
	function zeroBS_objDraw_generic_text($key='',$obj=false){

			$ret = '';

			if (!empty($key) && is_array($obj)){

				if (isset($obj[$key])) $ret = $obj[$key];
				if (isset($obj['meta']) && is_array($obj['meta']) && isset($obj['meta'][$key])) $ret = $obj['meta'][$key];

			}

			return $ret;
	}


/* ======================================================
  / Table Views (temporary)
   ====================================================== */

   // quick workaround to turn 29999 into 2.99.99
   // noting that the real issue here is our non delimited migration numbers :facepalm:
   function zeroBSCRM_format_migrationVersion($ver=''){

		// catch 3000
		$ver = str_replace( '000', '0', $ver);

   		switch ( strlen( $ver) ){

   			// catch x.x
   			case 2:
				$migrationName = substr($ver,0,1).'.'.substr($ver,1,1);
   				break;
   			// catch x.x.x
   			case 3: 
				$migrationName = substr($ver,0,1).'.'.substr($ver,1,1).'.'.substr($ver,2);
   				break;
   			case 4:

   				// if second char is 0
   				if ( substr( $ver, 1, 1 )  == 0 ){

   					// e.g. 3010 = 3.0.10
					$migrationName = substr($ver,0,1).'.'.substr($ver,1,1).'.'.substr($ver,2);


   				} else {

   					// e.g. 3111 = 3.11.1
					$migrationName = substr($ver,0,1).'.'.substr($ver,1,2).'.'.substr($ver,3);

   				}


   				break;

   			// catch edge case 29999
   			case 5:

				// e.g. 29999 = 2.99
				$migrationName = substr($ver,0,1).'.'.substr($ver,1,2);

   				break;

   			// 
   			default:
   				$migrationName = $ver;
   				break;


   		}

   		return $migrationName;
   		
   }