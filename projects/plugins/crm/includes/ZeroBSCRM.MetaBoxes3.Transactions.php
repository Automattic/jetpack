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





/* ======================================================
   Init Func
   ====================================================== */

   function zeroBSCRM_TransactionsMetaboxSetup(){

        // main detail
        $zeroBS__Metabox_Transaction = new zeroBS__Metabox_Transaction( __FILE__ );

        // save
        $zeroBS__Metabox_TransactionActions = new zeroBS__Metabox_TransactionActions( __FILE__ );

        // Tags
        $zeroBS__Metabox_TransactionTags = new zeroBS__Metabox_TransactionTags( __FILE__ );

        // external sources
        $zeroBS__Metabox_ExtSource = new zeroBS__Metabox_ExtSource( __FILE__, 'transaction','zbs-add-edit-transaction-edit');
   }

   add_action( 'admin_init','zeroBSCRM_TransactionsMetaboxSetup');

/* ======================================================
   / Init Func
   ====================================================== */


/* ======================================================
  Transaction Metabox
   ====================================================== */

    class zeroBS__Metabox_Transaction extends zeroBS__Metabox{ 
        
        // this is for catching 'new' transactions
        private $newRecordNeedsRedir = false;

        public function __construct( $plugin_file ) {

            // set these
            $this->objType = 'transaction';
            $this->metaboxID = 'zerobs-transaction-edit';
            $this->metaboxTitle = __('Transaction Information','zero-bs-crm'); // will be headless anyhow
            $this->headless = true;
            $this->metaboxScreen = 'zbs-add-edit-transaction-edit';
            $this->metaboxArea = 'normal';
            $this->metaboxLocation = 'high';
            $this->saveOrder = 1;
            $this->capabilities = array(

                'can_hide'          => false, // can be hidden
                'areas'             => array('normal'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => true,  // can/can't accept tabs onto it
                'can_become_tab'    => false, // can be added as tab
                'can_minimise'      => true, // can be minimised
                'can_move'          => true // can be moved

            );

            // call this 
            $this->initMetabox();

        }

        public function html( $transaction, $metabox ) {

                // localise ID
                $transactionID = -1; if (is_array($transaction) && isset($transaction['id'])) $transactionID = (int)$transaction['id'];

                // if new + $zbsObjDataPrefill passed, use that instead of loaded trans.
                if ($transactionID == -1){
                	global $zbsObjDataPrefill;
                	$transaction = $zbsObjDataPrefill;
                }

                // debug echo '<pre>'; print_r(array($transaction,$metabox)); echo '</pre>'; exit();
                global $zbs;


                #} Prefill ID and OBJ are added to the #zbs_invoice to aid in prefilling the data (when drawn with JS)
                $prefill_id = -1; $prefill_obj = -1; $prefill_email = '';
                if (isset($_GET['zbsprefillcust']) && !empty($_GET['zbsprefillcust'])){
                    $prefill_id = (int)$_GET['zbsprefillcust'];
                    $prefill_obj = ZBS_TYPE_CONTACT;
                    $prefill_email = zeroBS_customerEmail($prefill_id);  
                }   
                if (isset($_GET['zbsprefillco']) && !empty($_GET['zbsprefillco'])){
                    $prefill_id = (int)$_GET['zbsprefillco'];
                    $prefill_obj = ZBS_TYPE_COMPANY;
                    $prefill_email = zeroBS_companyEmail($prefill_id);  
                }    

		    	// DAL2 legacy, patched through			    
		    	$contactID = -1;  if (is_array($transaction) && isset($transaction['contact']) && is_array($transaction['contact']) && count($transaction['contact']) > 0) $contactID = $transaction['contact'][0]['id'];
		    	$companyID = -1;  if (is_array($transaction) && isset($transaction['company']) && is_array($transaction['company']) && count($transaction['company']) > 0) $companyID = $transaction['company'][0]['id'];                
		    	$contactName = ''; $companyName = '';
		    	if ($contactID > 0) $contactName = $zbs->DAL->contacts->getContactNameWithFallback( $contactID );
	            if (empty($contactName) || $contactName == -1) $contactName = '';
				if (!empty($companyID) && $companyID > 0){
					$companyName = $zbs->DAL->companies->getCompanyNameEtc($companyID);
					if (empty($companyName)) $companyName = jpcrm_label_company().' #'.$companyID;
				} 

				// prefill if not assigned:
				if ($contactID == -1 && $companyID == -1){

					switch ($prefill_obj){

						case ZBS_TYPE_CONTACT:

							if ($prefill_id > 0){
								
								// dump into contactID etc.
								$contactID = $prefill_id;
								$contactName = $zbs->DAL->contacts->getContactNameWithFallback( $contactID );

							}

							break;

						case ZBS_TYPE_COMPANY:

							if ($prefill_id > 0){
								
								// dump into contactID etc.
								$companyID = $prefill_id;
								$companyName = $zbs->DAL->companies->getCompanyNameEtc($companyID);
								if (empty($companyName)) $companyName = jpcrm_label_company().' #'.$companyID;

							}


							break;

					}

				}


				?>
                <script type="text/javascript">var zbscrmjs_secToken = '<?php echo esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ); ?>';</script>
               
                <style>
                        @media all and (max-width:699px){
                        table.wh-metatab{
                            min-width:100% !important;
                        }
                    }  
                </style>
	    		<?php

                    // New transaction?
                    if (gettype($transaction) != "array") echo '<input type="hidden" name="zbscrm_newtransaction" value="1" />';

                ?>
				<table class="form-table wh-metatab wptbp" id="wptbpMetaBoxMainItem">

					<tr class="wh-large">
						<th style="min-width:240px"><label for="ref"><?php echo esc_html( __( 'Transaction unique ID', 'zero-bs-crm' ) );?>:</label></th>
						<td><input type="text" id="ref" name="zbst_ref" class="form-control" value="<?php echo esc_attr( isset( $transaction['ref'] ) ? $transaction['ref'] : zeroBSCRM_uniqueID() ); ?>" autocomplete="zbstra-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( rand(0,100) ); ?>" /></td>
					</tr>

					<?php

					// Refunds show a notice

					if (
						// has Refund Type
						isset( $transaction['type'] ) && $transaction['type'] == __( 'Refund', 'zero-bs-crm' )
						&&
						// has parent ID based transaction
						isset( $transaction['parent'] ) && $zbs->DAL->transactions->transaction_exists( $transaction['parent'] )
					) {

						// get parent ref
						$parent_ref = $zbs->DAL->transactions->get_transaction_ref( $transaction['parent'] );

						?>
						<tr class="wh-large">
							<th></th>
							<td>
								<p style="text-align: center;">
									<?php echo esc_html( sprintf( __( 'This transaction is a refund against transaction #%s', 'zero-bs-crm' ), $parent_ref ) ); ?>
									<a href="<?php echo jpcrm_esc_link( 'edit', $transaction['parent'], ZBS_TYPE_TRANSACTION ); ?>" class="ui compact teal button" style="margin-left:10px"><?php echo esc_html( __( 'View Original Transaction', 'zero-bs-crm' ) ); ?></a>
								</p>
							</td>
						</tr>
						<?php

					}

					?>

					<tr>
						<td colspan="2"><hr /></td>
					</tr>

					<tr class="wh-large">
						<th><label for="title"><?php echo esc_html( __( 'Transaction Name:', 'zero-bs-crm' ) ); ?></label>
							<span class="zbs-infobox" style="margin-top:3px"><?php echo esc_html( __( 'If possible, keep these the same if you routinely use common products here (they are used in the transaction index)', 'zero-bs-crm' ) );?></span>
						</th>
						<td><input id="title" name="zbst_title" value="<?php if(isset($transaction['title'])){ echo esc_attr( $transaction['title'] ); }?>" class="form-control widetext" autocomplete="zbstra-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( rand(0,100) ); ?>" /></td>
					</tr>

					<tr class="wh-large">
						<th><label for="total"><?php echo esc_html( __( 'Transaction Value', 'zero-bs-crm' ) ); ?><?php echo ' ('. esc_html( zeroBSCRM_getCurrencyChr() ) . "):"; ?></label></th>
						<td><input id="total" name="zbst_total" value="<?php if(isset($transaction['total'])){ echo esc_attr( $transaction['total'] ); } else echo '0.00'; ?>" class="form-control numbersOnly" style="width: 130px;display: inline-block;" autocomplete="zbstra-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( rand(0,100) ); ?>" /></td>
					</tr>

					<tr class="wh-large">
						<th>
							<label><?php echo esc_html( __( 'Transaction Date', 'zero-bs-crm' ) );?>:</label>
							<span class="zbs-infobox" style="margin-top:3px"><?php echo esc_html( __( 'The transaction date will default to the initial save date if left blank.', 'zero-bs-crm' ) );?></span>
						</th>
						<td>
							<input type="date" name="zbst_date_datepart" id="transactionDate" value="<?php echo isset( $transaction['date'] ) ? esc_attr( jpcrm_uts_to_date_str( $transaction['date'], 'Y-m-d' ) ) : ''; ?>" autocomplete="zbstra-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( rand(0,100) ); ?>" >
							@
							<input type="time" name="zbst_date_timepart" value="<?php echo isset( $transaction['date'] ) ? esc_attr( jpcrm_uts_to_time_str( $transaction['date'], 'H:i' ) ) : ''; ?>" autocomplete="zbstra-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( rand(0,100) ); ?>" >
						</td>
					</tr>

					<?php
					// Custom Fields

					global $zbsTransactionFields;

					// had to add this, because other fields are put out separately here
					// TODO resolve zbsTransactionFields global for new DAL
					$skipList = array( 'ref', 'customer', 'status', 'total', 'customer_name', 'date', 'currency', 'title', 'tax_rate', 'taxes', 'date_paid', 'date_completed' );

					if ( zeroBSCRM_getSetting( 'transaction_fee' ) !== 1 ) {
						$skipList[] = 'fee';
					}

					if ( zeroBSCRM_getSetting( 'transaction_net' ) !== 1 ) {
						$skipList[] = 'net';
					}

					if ( zeroBSCRM_getSetting( 'transaction_discount' ) !== 1 ) {
						$skipList[] = 'discount';
					}

					if ( zeroBSCRM_getSetting( 'transaction_tax' ) !== 1 ) {
						$skipList[] = 'tax';
					}

					// shipping?
					$useShipping = zeroBSCRM_getSetting('shippingfortransactions');
					if ($useShipping != 1){
						$skipList[] = 'shipping';
						$skipList[] = 'shipping_taxes';
					} 

					// output additional fields
					zeroBSCRM_html_editFields( $transaction, $zbsTransactionFields,'zbst_', $skipList );

					// use paid/completed dates?
					$usePaidDates = zeroBSCRM_getSetting('paiddatestransaction');
					if ( $usePaidDates === 1 ) {
						?>

						<tr class="wh-large">
							<th>
								<label><?php echo esc_html( __( 'Date Paid', 'zero-bs-crm' ) );?>:</label>
								<span class="zbs-infobox" style="margin-top:3px"><?php echo esc_html( __( 'This will default to the transaction date if left blank.', 'zero-bs-crm' ) );?></span>
							</th>
							<td>
								<input type="date" name="zbst_date_paid_datepart" value="<?php echo isset( $transaction['date_paid'] ) ? esc_attr( jpcrm_uts_to_date_str( $transaction['date_paid'], 'Y-m-d' ) ) : ''; ?>" autocomplete="zbstra-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( rand(0,100) ); ?>" >
								@
								<input type="time" name="zbst_date_paid_timepart" value="<?php echo isset( $transaction['date_paid'] ) ? esc_attr( jpcrm_uts_to_time_str( $transaction['date_paid'], 'H:i' ) ) : ''; ?>" autocomplete="zbstra-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( rand(0,100) ); ?>" >
							</td>
						</tr>

						<tr class="wh-large">
							<th>
								<label><?php echo esc_html( __( 'Date Completed', 'zero-bs-crm' ) );?>:</label>
								<span class="zbs-infobox" style="margin-top:3px"><?php echo esc_html( __( 'This will default to the transaction date if left blank.', 'zero-bs-crm' ) );?></span>
							</th>
							<td>
								<input type="date" name="zbst_date_completed_datepart" value="<?php echo isset( $transaction['date_completed'] ) ? esc_attr( jpcrm_uts_to_date_str( $transaction['date_completed'], 'Y-m-d' ) ) : ''; ?>" autocomplete="zbstra-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( rand(0,100) ); ?>" >
								@
								<input type="time" name="zbst_date_completed_timepart" value="<?php echo isset( $transaction['date_completed'] ) ? esc_attr( jpcrm_uts_to_time_str( $transaction['date_completed'], 'H:i' ) ) : ''; ?>" autocomplete="zbstra-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( rand(0,100) ); ?>" >
							</td>
						</tr>
						<?php
					}

					?>

				</table>

			    <?php // ========== Line Items 
			    if (isset($transactions['lineitems']) && is_array($transaction['lineitems'])){ ?>

			    <div class="ui divider"></div>
			    <h5><?php echo esc_html( __( 'Line Items', 'zero-bs-crm' ) );?></h5>
			    <table class="ui table green">
			    	<thead>
              <tr>
    		    		<th><?php echo esc_html( __( 'Name', 'zero-bs-crm' ) );?></th>
    		    		<th><?php echo esc_html( __( 'Quantity', 'zero-bs-crm' ) );?></th>
    		    		<th><?php echo esc_html( __( 'Tax', 'zero-bs-crm' ) );?></th>
    		    		<th><?php echo esc_html( __( 'Shipping', 'zero-bs-crm' ) );?></th>
    		    		<th><?php echo esc_html( __( 'Handling', 'zero-bs-crm' ) );?></th>
    		    		<th><?php echo esc_html( __( 'Amount', 'zero-bs-crm' ) );?></th>
              </tr>
			    	</thead>
			    	<tbody><?php

				    	if (count($transaction['lineitems']) > 0){

				    		// res
				    		foreach ($transaction['lineitems'] as $item){
				    			echo "<tr>";
				    				if (isset($item["name"])) echo "<td>" . esc_html( $item["name"] ) . "</td>";
				    				if (isset($item["quantity"])) echo "<td>" . esc_html( $item["quantity"] ) . "</td>";
				    				if (isset($item["tax"])) echo "<td>" . esc_html( $item["tax"] ) . "</td>";
				    				if (isset($item["ship"])) echo "<td>" . esc_html( $item["ship"] ) . "</td>";
				    				if (isset($item["handle"])) echo "<td>" . esc_html( $item["handle"] ) . "</td>";
				    				if (isset($item["amount"])) echo "<td>" . esc_html( $item["amount"] ) . "</td>";
				    			echo "</tr>";
				    		}

				    	} else {

				    		// no res
				    		?><tr><td colspan="6"><?php echo esc_html( __( 'No Line Items Found', 'zero-bs-crm' ) ); ?></td></tr><?php
				    		
				    	} ?>
				    </tbody>

			    </table>


			   	<?php }
			   	// / ========== Line Items ?>

			    <table class="form-table wh-metatab wptbp">

			        <tr><td><hr /></td></tr>

			        <tr><td>
			        	<h2 style="font-size: 20px"><i class="linkify icon"></i> <?php echo esc_html( __( 'Assign Transaction to', 'zero-bs-crm' ) );?></h2></td></tr>

			        <tr class="wh-large" id="zbs-transaction-assignment-wrap">
			        	<td>	
			        		<?php // hidden inputs dictating any assignment typeaheads ?>
			        		<input id="customer" name="customer" value="<?php echo esc_attr( $contactID ); ?>" class="form-control widetext" type="hidden">
			             	<input id="customer_name" name="customer_name" value="<?php echo esc_attr( $contactName ); ?>" class="form-control widetext" type="hidden">
			             	<input type="hidden" name="zbsct_company" id="zbsct_company" value="<?php echo esc_attr( $companyID ); ?>" />
		                    <?php 
		                    	if (zeroBSCRM_getSetting('companylevelcustomers') != "1"){ 

		                    		// Just contact
								?>
									<div id="zbs-customer-title"><label><?php echo esc_html( __( 'Contact', 'zero-bs-crm' ) ); ?></label></div>
									<?php
		                    		echo zeroBSCRM_CustomerTypeList('zbscrmjs_transaction_setCustomer', $contactName,false,'zbscrmjs_transaction_unsetCustomer');

		                    		// mikes inv selector
								?>
									<div class="assignInvToCust" style="display:none;max-width:658px" id="invoiceSelectionTitle"><label><?php echo esc_html( __( 'Contact invoice:', 'zero-bs-crm' ) ); ?></label><span class="zbs-infobox" style="margin-top:3px"><?php echo esc_html( __( 'Is this transaction a payment for an invoice? If so, enter the Invoice ID. Otherwise leave blank.', 'zero-bs-crm' ) ); ?></span></div>
		                    		<div id="invoiceFieldWrap" style="position:relative;display:none;max-width:658px" class="assignInvToCust"><input style="max-width:200px" id="invoice_id" name="invoice_id" value="<?php if(isset($transaction['invoice_id'])){ echo esc_attr( $transaction['invoice_id'] ); } ?>" class="form-control" autocomplete="zbstra-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( rand(0,100) ); ?>" /></div><?php

		                    	} else {

		                    		// contact or co
								?>
									<div class="ui grid"><div class="seven wide column">
										<div id="zbs-customer-title"><label>
											<?php
											echo esc_html( __( 'Contact', 'zero-bs-crm' ) );
										?>
										</label></div>
										<?php

			                    		// contact
										echo zeroBSCRM_CustomerTypeList( 'zbscrmjs_transaction_setCustomer', $contactName, false, 'zbscrmjs_transaction_unsetCustomer' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped,WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			                    		
			                    		// mikes inv selector
										?>
										<div class="assignInvToCust" style="display:none;max-width:658px" id="invoiceSelectionTitle"><label><?php echo esc_html( __( 'Contact invoice:', 'zero-bs-crm' ) ); ?></label><span class="zbs-infobox" style="margin-top:3px"><?php echo esc_html( __( 'Is this transaction a payment for an invoice? If so, enter the Invoice ID. Otherwise leave blank.', 'zero-bs-crm' ) ); ?></span></div>
			                    		<div id="invoiceFieldWrap" style="position:relative;display:none;max-width:658px" class="assignInvToCust"><input style="max-width:200px" id="invoice_id" name="invoice_id" value="<?php if(isset($transaction['invoice_id'])){ echo esc_attr( $transaction['invoice_id'] ); } ?>" class="form-control" autocomplete="zbstra-<?php echo esc_attr( time() ); ?>-<?php echo esc_attr( rand(0,100) ); ?>" /></div><?php

			                    		 ?></div><div class="two wide column centered"><?php echo esc_html( __( 'Or', 'zero-bs-crm' ) ); ?></div><div class="seven wide column"><div id="zbs-company-title"><label><?php echo esc_html( jpcrm_label_company() ); ?></label></div><?php

			                    		// company
				                       	echo zeroBSCRM_CompanyTypeList('zbscrmjs_transaction_setCompany',$companyName,true,'zbscrmjs_transaction_unsetCompany'); 
				                          
				                        ?></div>
				                    </div><?php 
				                } 

				            ?>

			        	</td>
			        </tr>

			    </table>

	  
		<script type="text/javascript">

			// v3.0 Moved into it's own JS for optimal perf.
			// js/ZeroBSCRM.admin.transactioneditor.js
			var zeroBSCRMJS_transactionedit_lang = {

                    'noinvoices': '<?php echo esc_html( zeroBSCRM_slashOut(__('No Invoices Found!',"zero-bs-crm")) ); ?>',
                    'none': '<?php echo esc_html( zeroBSCRM_slashOut(__('None',"zero-bs-crm") )); ?>',
                    'view': '<?php echo esc_html( zeroBSCRM_slashOut(__('View',"zero-bs-crm")) ); ?>',
                    'contact': '<?php echo esc_html( zeroBSCRM_slashOut(__('Contact',"zero-bs-crm")) ); ?>',
                    'company': '<?php echo esc_html( zeroBSCRM_slashOut(jpcrm_label_company()) ); ?>',
                    'selectinv': '<?php echo esc_html( zeroBSCRM_slashOut(__('Select Invoice',"zero-bs-crm")) ); ?>',
			}
			var zeroBSCRMJS_transactionedit_links = {

				'editinvprefix': '<?php echo jpcrm_esc_link( 'edit', -1, 'zerobs_invoice', true ); ?>',
				'editcontactprefix': '<?php echo jpcrm_esc_link( 'edit', -1, 'zerobs_customer', true ); ?>',
				'editcompanyprefix': '<?php echo jpcrm_esc_link( 'edit', -1, 'zerobs_company', true ); ?>',
			}

		</script>
		<?php

              
        }

        public function save_data( $transactionID, $transaction ) {

            if (!defined('ZBS_T_SAVED')){

                define('ZBS_T_SAVED',1);

                // DAL3.0+
                global $zbs;

                // check this
                if (empty($transactionID) || $transactionID < 1)  $transactionID = -1;

	                // ====== DAL 3 way
                    $autoGenAutonumbers = true; // generate if not set
					$transaction = zeroBS_buildObjArr($_POST,array(),'zbst_','',false,ZBS_TYPE_TRANSACTION,$autoGenAutonumbers);

	                // Use the tag-class function to retrieve any tags so we can add inline.
	                // Save tags against objid
					$transaction['tags'] = zeroBSCRM_tags_retrieveFromPostBag(true,ZBS_TYPE_TRANSACTION); 

					$date = jpcrm_datetime_post_keys_to_uts( 'zbst_date' );
					$transaction['date'] = empty( $date ) ? time() : $date;

					$date_paid = jpcrm_datetime_post_keys_to_uts( 'zbst_date_paid' );
					$transaction['date_paid'] = empty( $date_paid ) ? $transaction['date'] : $date_paid;

					$date_completed = jpcrm_datetime_post_keys_to_uts( 'zbst_date_completed' );
					$transaction['date_completed'] = empty( $date_completed ) ? $transaction['date'] : $date_completed;

					// currency wasn't set when storing manually too
					$transaction['currency'] = zeroBSCRM_getCurrencyStr();


			            // assignments
			            $zbsTransactionContact = (int)sanitize_text_field($_POST['customer']);
			            $transaction['contacts'] = ($zbsTransactionContact > 0) ? array($zbsTransactionContact) : array();
			            $zbsTransactionCompany = (int)sanitize_text_field($_POST['zbsct_company']);
			            $transaction['companies'] = ($zbsTransactionCompany > 0) ? array($zbsTransactionCompany) : array();
						

					  	#} Invoice allocation:
						$transaction['invoice_id'] = ''; 	if(isset($_POST['invoice_id'])) 	$transaction['invoice_id'] = (int)sanitize_text_field($_POST["invoice_id"]);


		                // add/update
		                $addUpdateReturn = $zbs->DAL->transactions->addUpdateTransaction(array(

		                            'id'    => $transactionID,
		                            'data'  => $transaction,
		                            'limitedFields' => -1,

		                    ));

		                // Note: For NEW objs, we make sure a global is set here, that other update funcs can catch 
		                // ... so it's essential this one runs first!
		                // this is managed in the metabox Class :)
		                if ($transactionID == -1 && !empty($addUpdateReturn) && $addUpdateReturn != -1) {
		                    
		                    $transactionID = $addUpdateReturn;
		                    global $zbsJustInsertedMetaboxID; $zbsJustInsertedMetaboxID = $transactionID;

		                    // set this so it redirs
		                    $this->newRecordNeedsRedir = true;
		                }

		                // success?
		                if ($addUpdateReturn != -1 && $addUpdateReturn > 0){

			                // Update Msg
			                // this adds an update message which'll go out ahead of any content
			                // This adds to metabox: $this->updateMessages['update'] = zeroBSCRM_UI2_messageHTML('info olive mini zbs-not-urgent',__('Contact Updated',"zero-bs-crm"),'','address book outline','contactUpdated');
			                // This adds to edit page
			                $this->updateMessage();

			                // catch any non-critical messages
			            	$nonCriticalMessages = $zbs->DAL->getErrors(ZBS_TYPE_TRANSACTION);
			            	if (is_array($nonCriticalMessages) && count($nonCriticalMessages) > 0) $this->dalNoticeMessage($nonCriticalMessages);


			            } else {

			            	// fail somehow
			            	$failMessages = $zbs->DAL->getErrors(ZBS_TYPE_TRANSACTION);

			            	// show msg (retrieved from DAL err stack)
			            	if (is_array($failMessages) && count($failMessages) > 0)
			            		$this->dalErrorMessage($failMessages);
			            	else
			            		$this->dalErrorMessage(array(__('Insert/Update Failed with general error','zero-bs-crm')));

			            	// pass the pre-fill:
			            	global $zbsObjDataPrefill; $zbsObjDataPrefill = $transaction;

	            
			            }

	            

            }

            return $transaction;
        }

        // This catches 'new' contacts + redirs to right url
        public function post_save_data($objID,$obj){

            if ($this->newRecordNeedsRedir){

                global $zbsJustInsertedMetaboxID;
                if (!empty($zbsJustInsertedMetaboxID) && $zbsJustInsertedMetaboxID > 0){

                    // redir
                    wp_redirect( jpcrm_esc_link('edit',$zbsJustInsertedMetaboxID,$this->objType) );
                    exit;

                }

            }

        }

        public function updateMessage(){

            global $zbs;

            // zbs-not-urgent means it'll auto hide after 1.5s
            // genericified from DAL3.0
            $msg = zeroBSCRM_UI2_messageHTML('info olive mini zbs-not-urgent',$zbs->DAL->typeStr($zbs->DAL->objTypeKey($this->objType)).' '.__('Updated',"zero-bs-crm"),'','address book outline','contactUpdated');

            $zbs->pageMessages[] = $msg;

        }

    }


/* ======================================================
  / Transaction Metabox
   ====================================================== */


/* ======================================================
  Create Tags Box
   ====================================================== */

class zeroBS__Metabox_TransactionTags extends zeroBS__Metabox_Tags{


    public function __construct( $plugin_file ) {
    
        $this->objTypeID = ZBS_TYPE_TRANSACTION;
        $this->objType = 'transaction';
        $this->metaboxID = 'zerobs-transaction-tags';
        $this->metaboxTitle = __('Transaction Tags',"zero-bs-crm");
        $this->metaboxScreen = 'zbs-add-edit-transaction-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
        $this->metaboxArea = 'side';
        $this->metaboxLocation = 'high';
        $this->showSuggestions = true;
        $this->capabilities = array(

            'can_hide'          => true, // can be hidden
            'areas'             => array('side'), // areas can be dragged to - normal side = only areas currently
            'can_accept_tabs'   => false,  // can/can't accept tabs onto it
            'can_become_tab'    => false, // can be added as tab
            'can_minimise'      => true // can be minimised

        );

        // call this 
        $this->initMetabox();

    }

    // html + save dealt with by parent class :) 

}

/* ======================================================
  / Create Tags Box
   ====================================================== */


/* ======================================================
    Transaction Actions Metabox
   ====================================================== */

    class zeroBS__Metabox_TransactionActions extends zeroBS__Metabox{ 

        public function __construct( $plugin_file ) {

            // set these
            $this->objType = 'transaction';
            $this->metaboxID = 'zerobs-transaction-actions';
            $this->metaboxTitle = __('Transaction','zero-bs-crm').' '.__('Actions','zero-bs-crm'); // will be headless anyhow
            $this->headless = true;
            $this->metaboxScreen = 'zbs-add-edit-transaction-edit';
            $this->metaboxArea = 'side';
            $this->metaboxLocation = 'high';
            $this->saveOrder = 1;
            $this->capabilities = array(

                'can_hide'          => false, // can be hidden
                'areas'             => array('side'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => true,  // can/can't accept tabs onto it
                'can_become_tab'    => false, // can be added as tab
                'can_minimise'      => true, // can be minimised
                'can_move'          => true // can be moved

            );

            // call this 
            $this->initMetabox();

        }

        public function html( $transaction, $metabox ) {

            ?><div class="zbs-generic-save-wrap">

                    <div class="ui medium dividing header"><i class="save icon"></i> <?php echo esc_html( __( 'Transaction Actions', 'zero-bs-crm' ) ); ?></div>

            <?php

            // localise ID & content
            $transactionID = -1; if (is_array($transaction) && isset($transaction['id'])) $transactionID = (int)$transaction['id'];
            
            	#} Status either way
                $potentialStatuses = zeroBSCRM_getTransactionsStatuses(true);

            	$status = ''; if (is_array($transaction) && isset($transaction['status'])) $status = $transaction['status'];

                ?>
                <div>
                    <label for="zbst_status"><?php echo esc_html( __( 'Status', 'zero-bs-crm' ) ); ?>: </label>
                    <select id="zbst_status" name="zbst_status">
                            <?php foreach($potentialStatuses as $z){
                                if($z == $status){$sel = ' selected'; }else{ $sel = '';}
                                echo '<option value="'.esc_attr( $z ).'"'. esc_attr( $sel ) .'>'.esc_html__($z,"zero-bs-crm").'</option>';
                            } ?>
                    </select>
                </div>

                <div class="clear"></div>
                <?php


                #} if a saved post...
                //if (isset($post->post_status) && $post->post_status != "auto-draft"){
                if ($transactionID > 0){ // existing

                	?>

                    <div class="zbs-transaction-actions-bottom zbs-objedit-actions-bottom">

                        <button class="ui button green" type="button" id="zbs-edit-save"><?php echo esc_html( __( 'Update Transaction', 'zero-bs-crm' ) ); ?></button>

                        <?php

                            // delete?

                         // for now just check if can modify, later better, granular perms.
                         if ( zeroBSCRM_permsTransactions() ) { 
                        ?><div id="zbs-transaction-actions-delete" class="zbs-objedit-actions-delete">
                             <a class="submitdelete deletion" href="<?php echo jpcrm_esc_link( 'delete', $transactionID, 'transaction' ); ?>"><?php echo esc_html( __( 'Delete Permanently', 'zero-bs-crm' ) ); ?></a>
                        </div>
                        <?php } // can delete  ?>
                        
                        <div class='clear'></div>

                    </div>
                <?php


                } else {

                    // NEW transaction ?>

                    <div class="zbs-transaction-actions-bottom zbs-objedit-actions-bottom">
                    	
                    	<button class="ui button green" type="button" id="zbs-edit-save"><?php echo esc_html( __( 'Save Transaction','zero-bs-crm' ) ); ?></button>

                    </div>

                 <?php

                }

            ?></div><?php // / .zbs-generic-save-wrap
              
        } // html

        // saved via main metabox

    }


/* ======================================================
  / Transaction Action Metabox
   ====================================================== */