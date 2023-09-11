<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 20/02/2019
 */

/* ======================================================
  Breaking Checks ( stops direct access )
====================================================== */

if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

/* ======================================================
  / Breaking Checks
====================================================== */

class zeroBS__Metabox_Ownership extends zeroBS__Metabox {

	public $saveAutomatically = false; // if this is true, this'll automatically update the object owner- this is off by default as most objects save owners themselves as part of addUpdateWhatever so that IA hooks fire correctly

	public function __construct( $plugin_file, $typeInt = ZBS_TYPE_CONTACT ) {

		global $zbs;

		// set these via init (defaults)
		$this->typeInt = $typeInt;
		
		// these then use objtypeint to generate:
		$typeStr = $zbs->DAL->objTypeKey( $typeInt );
		$this->objType = $typeStr;
		$this->metaboxID = 'zerobs-'.$typeStr.'-owner'; // zerobs-contact-owner
		$this->metaboxScreen = 'zbs-add-edit-'.$typeStr.'-edit'; //'zbs-add-edit-contact-edit'

		$this->metaboxArea = 'side';
		$this->metaboxLocation = 'low';
		$this->metaboxTitle = __( 'Assigned To', 'zero-bs-crm' );

		// call this 
		$this->initMetabox();

	}

	public function html( $obj, $metabox ) {

		global $zbs;

		// localise ID
		if ( is_array( $obj ) && isset( $obj['id'] ) ) {
			$objID = (int)$obj['id'];
			$zbsThisOwner = zeroBS_getOwnerObj( $obj['owner'] );
		} else {
			$objID = -1;
			$zbsThisOwner = array();
		}

		// can even change owner?
		$canGiveOwnership = $zbs->settings->get( 'usercangiveownership' );
		$canChangeOwner = ( $canGiveOwnership == "1" || current_user_can( 'administrator' ) );

		// init
		$zbsPossibleOwners = array();

		switch ($this->typeInt){

			case ZBS_TYPE_CONTACT:
				// If allowed to change assignment, load other possible users
				if ($canChangeOwner) $zbsPossibleOwners = zeroBS_getPossibleCustomerOwners();
				break;

			case ZBS_TYPE_COMPANY:
				// If allowed to change assignment, load other possible users
				if ($canChangeOwner) $zbsPossibleOwners = zeroBS_getPossibleCompanyOwners();
				break;

			default:
				$zbsThisOwner = array();
				break;

		}

		// Can change owner, or has owner details, then show... (this whole box will be hidden if setting says no ownerships)
		if ($canChangeOwner || isset($zbsThisOwner['ID'])){

			// Either: "assigned to DAVE" or "assigned to DAVE (in drop down list)"
			if (!$canChangeOwner) {

				// simple unchangable
				?>
				<div style="text-align:center">
					<?php echo esc_html( $zbsThisOwner['OBJ']->display_name ); ?>
				</div>
				<?php

			} else {

				// DDL
				?>
				<div style="text-align:center">
					<select class="" id="zerobscrm-owner" name="zerobscrm-owner">
						<option value="-1"><?php esc_html_e('None',"zero-bs-crm");?></option>
						<?php
						if ( is_array( $zbsPossibleOwners ) && count( $zbsPossibleOwners ) > 0 ) {
							foreach ( $zbsPossibleOwners as $possOwner ) {
								$is_selected = isset($zbsThisOwner['ID']) && $possOwner->ID == $zbsThisOwner['ID'];
								echo '<option value="' . esc_attr( $possOwner->ID ) . '"' . ($is_selected ? ' selected="selected"' : '') . '>' . esc_html( $possOwner->display_name ) . '</option>';
							}
						}
						?>
					</select>
				</div>
				<?php

			}

		}

	}

	public function save_data( $objID, $obj ) {

		// Note: Most objects save owners as part of their own addUpdate routines.
		// so this now only fires where saveAutomatically = true
		if ($this->saveAutomatically){

			$newOwner = -1;
			if (isset( $_POST['zerobscrm-owner'] ) && !empty( $_POST['zerobscrm-owner'] ) ) {
				$newOwner = (int)sanitize_text_field( $_POST['zerobscrm-owner'] );
			}

			// If newly created and no new owner specified, use self:
			if ( isset( $_POST['zbscrm_newcustomer'] ) && $newOwner === -1 ){
				$newOwner = get_current_user_id();
			} 

			// Save
			if ( $objID > 0 && $this->typeInt > 0 ){
				$zbs->DAL->setObjectOwner(
					array(
					'objID'         => $objID,
					'objTypeID'     => $this->typeInt,
					'ownerID'       => $newOwner
					)
				);
			}

		}

		return $obj;
	} 
}