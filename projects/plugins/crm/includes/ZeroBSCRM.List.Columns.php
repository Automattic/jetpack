<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */


/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */


   #{ Wh NOTE: this should all be in 1 global, messy to ahve them all separate! }


/* ======================================================
  Hard Coded Columns for each list view (UI2.0)
  (Defaults which can be overriden by custom views)
   ====================================================== */

   /*
    // LABEL, column ??, grouping (in column manager)
      array('LABEL','zbsDefault_column_customerid','basefield')

   */


   /* ======================================================================================================
      ======================== Customers
      ===================================================================================================== */

      
   global $zeroBSCRM_columns_customer;

   $zeroBSCRM_columns_customer = array();
   $zeroBSCRM_columns_customer['default'] =  array(

                                          
                                                    'id' => array('ID',false,'basefield'),
                                                    'nameavatar' => array(__('Name and Avatar',"zero-bs-crm")),
                                                    //'email' => array('Email','zbsDefault_column_customeremail'),
                                                    'status' => array(__('Status',"zero-bs-crm"),false,'basefield','editinline'=>1),
                                                    'totalvalue' => array(__('Total Value',"zero-bs-crm")),
                                                    'added' => array(__('Added',"zero-bs-crm"),false,'basefield')
                                            );

   $zeroBSCRM_columns_customer['all'] = array(

                                                    'id' => array('ID',false,'basefield'),
                                                    'name' => array(__('Name',"zero-bs-crm"),false,'basefield'),
                                                    'nameavatar' => array(__('Name and Avatar',"zero-bs-crm")),
                                                    'email' => array(__('Email',"zero-bs-crm"),false,'basefield'),
                                                    'status' => array(__('Status',"zero-bs-crm"),false,'basefield','editinline'=>1),

                                                    'hasquote' => array(__('Has Quote',"zero-bs-crm")),
                                                    'hasinvoice' => array(__('Has Invoice',"zero-bs-crm")),
                                                    'hastransaction' => array(__('Has Transaction',"zero-bs-crm")),
                                                    
                                                    'quotecount' => array(__('Quote Count',"zero-bs-crm")),
                                                    'invoicecount' => array(__('Invoice Count',"zero-bs-crm")),
                                                    'transactioncount' => array(__('Transaction Count',"zero-bs-crm")),

                                                    'quotetotal' => array(__('Quotes Total',"zero-bs-crm")),
                                                    'invoicetotal' => array(__('Invoices Total',"zero-bs-crm")),
                                                    'transactiontotal' => array(__('Transactions Total',"zero-bs-crm")),

                                                    'totalvalue' => array(__('Total Value',"zero-bs-crm")),

                                                    'added' => array(__('Added',"zero-bs-crm"),false,'basefield'),
                                                    'lastupdated' => array(__('Last Updated',"zero-bs-crm"),false,'basefield'),
                                                    'assigned' => array(__('Assigned To',"zero-bs-crm"),false,'basefield','editinline'=>1),
                                                    'latestlog' => array(__('Latest Log',"zero-bs-crm")),
                                                    'tagged' => array(__('Tagged',"zero-bs-crm")),
                                                    'editlink' => array(__('View',"zero-bs-crm")),
                                                    'editdirectlink' => array(__('Edit',"zero-bs-crm")),
                                                    'phonelink' => array(__('Phone Link',"zero-bs-crm")),
                                                    
                                                    'lastcontacted' => array(__('Last Contacted',"zero-bs-crm")),

                                                    'company' => array(__('Company','zero-bs-crm')),
                                                    
                            );

    /**
     * Corrects label for 'Company' (could be Organisation) after the settings have loaded. 
     * Clunky workaround for now
     */
    add_action( 'after_zerobscrm_settings_preinit', 'jpcrm_list_columns_correct_labels', 10);
    function jpcrm_list_columns_correct_labels(){

      global $zeroBSCRM_columns_customer;

      $zeroBSCRM_columns_customer['all']['company'] = array(jpcrm_label_company());

    }

   /* ======================================================================================================
      ======================== / Customers
      ===================================================================================================== */

   /* ======================================================================================================
      ======================== Companies
      ===================================================================================================== */

      
   global $zeroBSCRM_columns_company;

   $zeroBSCRM_columns_company = array();
   $zeroBSCRM_columns_company['default'] =  array(

                                          
                                                    'id' => array('ID',false,'basefield'),
                                                    'name' => array(__('Name',"zero-bs-crm"),false,'basefield'),
                                                    'status' => array(__('Status',"zero-bs-crm"),false,'basefield'),
                                                    'contacts' => array(__('Contacts',"zero-bs-crm")),
                                                    'added' => array(__('Added',"zero-bs-crm"),false,'basefield'),
                                                    'viewlink' => array(__('View',"zero-bs-crm"))
                                            );

   $zeroBSCRM_columns_company['all'] = array(


                                                    'id' => array('ID',false,'basefield'),
                                                    'name' => array(__('Name',"zero-bs-crm"),false,'basefield'),
                                                    'email' => array(__('Email',"zero-bs-crm"),false,'basefield'),
                                                    'status' => array(__('Status',"zero-bs-crm"),false,'basefield'),


                                                    'hasinvoice' => array(__('Has Invoice',"zero-bs-crm")),
                                                    'hastransaction' => array(__('Has Transaction',"zero-bs-crm")),
                                                    
                                                    'invoicecount' => array(__('Invoice Count',"zero-bs-crm")),
                                                    'transactioncount' => array(__('Transaction Count',"zero-bs-crm")),

                                                    'invoicetotal' => array(__('Invoices Total',"zero-bs-crm")),
                                                    'transactiontotal' => array(__('Transactions Total',"zero-bs-crm")),

                                                    // When Company<->Quotes: 
                                                    //'hasquote' => array(__('Has Quote',"zero-bs-crm")),
                                                    //'quotecount' => array(__('Quote Count',"zero-bs-crm")),
                                                    //'quotetotal' => array(__('Quotes Total',"zero-bs-crm")),

                                                    'totalvalue' => array(__('Total Value',"zero-bs-crm")),

                                                    'contacts' => array(__('Contacts',"zero-bs-crm")),
                                                    'added' => array(__('Added',"zero-bs-crm"),false,'basefield'),
                                                    'lastupdated' => array(__('Last Updated',"zero-bs-crm"),false,'basefield'),
                                                    'viewlink' => array(__('View',"zero-bs-crm")),
                                                    'editlink' => array(__('Edit',"zero-bs-crm")),
                                                    'assigned' => array(__('Assigned To',"zero-bs-crm"),false,'basefield'),
                                                    'tagged' => array(__(__('Tagged',"zero-bs-crm"),"zero-bs-crm")),
                                                    'phonelink' => array(__('Phone Link',"zero-bs-crm")),
                                                    // Should this be in company? (removed 04/9/18, don't think wired up) ''latestlog' => array(__('Latest Log',"zero-bs-crm")),
                                                    // Should this be in company? (removed 04/9/18, don't think wired up) 'lastcontacted' => array(__('Last Contacted',"zero-bs-crm")),
                                                    
                            );

   /* ======================================================================================================
      ======================== / Companies
      ===================================================================================================== */

      /* ======================================================================================================
      ======================== Quotes
      ===================================================================================================== */

      
   global $zeroBSCRM_columns_quote;

   $zeroBSCRM_columns_quote = array();
   $zeroBSCRM_columns_quote['default'] =  array(
                                                    'id' => array('ID',false,'basefield'),
                                                    'title' => array(__('Quote Title','zero-bs-crm'),false,'basefield'),
													'customer' => array( __( 'Contact', 'zero-bs-crm' ) ), // phpcs:ignore WordPress.Arrays.ArrayIndentation.ItemNotAligned -- impossible to fix without fixing everything else.
                                                    'status' => array(__('Status','zero-bs-crm'),false,'basefield'),
                                                    'value' => array(__('Quote Value',"zero-bs-crm"),false,'basefield'),
                                                    'editlink' => array(__('Edit',"zero-bs-crm"))


                                            );

   $zeroBSCRM_columns_quote['all'] =  array(
                                                    'id' => array('ID',false,'basefield'),
                                                    'title' => array(__('Quote Title','zero-bs-crm'),false,'basefield'),
													'customer' => array( __( 'Contact', 'zero-bs-crm' ) ), // phpcs:ignore WordPress.Arrays.ArrayIndentation.ItemNotAligned -- impossible to fix without fixing everything else.
                                                    'status' => array(__('Status','zero-bs-crm'),false,'basefield'),
                                                    'value' => array(__('Quote Value',"zero-bs-crm"),false,'basefield'),
                                                    'editlink' => array(__('Edit',"zero-bs-crm")),
                                                    // not user-configurable, so disabling for now
                                                    //'assignedobj' => array(__('Assigned To',"zero-bs-crm"),false,'basefield'),
                                            );

   /* ======================================================================================================
      ======================== / Quotes
      ===================================================================================================== */


      /* ======================================================================================================
      ======================== Invoices
      ===================================================================================================== */

        
     global $zeroBSCRM_columns_invoice;

     $zeroBSCRM_columns_invoice = array();
     $zeroBSCRM_columns_invoice['default'] =  array(
                                                      'id' => array('ID',false,'basefield'),

                                                      'ref' => array(__('Reference','zero-bs-crm'),false,'basefield'),
														'customer' => array( __( 'Contact', 'zero-bs-crm' ) ), // phpcs:ignore WordPress.Arrays.ArrayIndentation.ItemNotAligned -- impossible to fix without fixing everything else.
                                                      'status' => array(__('Status','zero-bs-crm'),false,'basefield'),
                                                      'value' => array(__('Value',"zero-bs-crm"),false,'basefield'),
                                                      'date' => array(__('Date',"zero-bs-crm"),false,'basefield'),
                                                      'editlink' => array(__('Edit',"zero-bs-crm"))
                                              );

	$zeroBSCRM_columns_invoice['all'] = array( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase,Generic.WhiteSpace.ScopeIndent.Incorrect
                                                      'id' => array('ID',false,'basefield'),
                                                      'ref' => array(__('Reference','zero-bs-crm'),false,'basefield'),
														'customer' => array( __( 'Contact', 'zero-bs-crm' ) ), // phpcs:ignore WordPress.Arrays.ArrayIndentation.ItemNotAligned -- impossible to fix without fixing everything else.
                                                      'status' => array(__('Status','zero-bs-crm'),false,'basefield'),
                                                      'value' => array(__('Value',"zero-bs-crm"),false,'basefield'),
                                                      'date' => array(__('Date',"zero-bs-crm"),false,'basefield'),
                                                      'due' => array(__('Due date',"zero-bs-crm"),false,'basefield'),

                                                      'editlink' => array(__('Edit',"zero-bs-crm")),

                                                      // not user-configurable, so disabling for now
                                                      //'assignedobj' => array(__('Assigned To',"zero-bs-crm"),false,'basefield'),

                                              );


   /* ======================================================================================================
      ======================== / Invoices
      ===================================================================================================== */



/* ======================================================================================================
      ======================== Transactions
      ===================================================================================================== */

      
   global $zeroBSCRM_columns_transaction;

   $zeroBSCRM_columns_transaction = array();
		$zeroBSCRM_columns_transaction['default'] = array( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
                                                    'id' => array('ID','zbsDefault_column_customerid','basefield'),
													'customer' => array( __( 'Contact', 'zero-bs-crm' ) ), // phpcs:ignore WordPress.Arrays.ArrayIndentation.ItemNotAligned -- impossible to fix without fixing everything else.
                                                    'status' => array(__('Status',"zero-bs-crm"),false,'basefield'),
                                                    'total' => array(__('Value',"zero-bs-crm"),false,'basefield'),
                                                    'item' => array(__('Item',"zero-bs-crm"),false,'basefield'),
                                                    'added' => array(__('Added',"zero-bs-crm"),false,'basefield'),
                                                    'editlink' => array(__('Edit Link',"zero-bs-crm"))

                                            );

   $zeroBSCRM_columns_transaction['all'] = array(
                                                    'id' => array('ID','zbsDefault_column_customerid','basefield'),
													'customer' => array( __( 'Contact', 'zero-bs-crm' ) ), // phpcs:ignore WordPress.Arrays.ArrayIndentation.ItemNotAligned -- impossible to fix without fixing everything else.
                                                    'customeremail' => array(__('Email',"zero-bs-crm")),
                                                    'tagged' => array(__(__('Tagged',"zero-bs-crm"),"zero-bs-crm")),
                                                    'status' => array(__('Status',"zero-bs-crm"),false,'basefield'),
                                                    'total' => array(__('Value',"zero-bs-crm"),false,'basefield'),
                                                    'item' => array(__('Item',"zero-bs-crm"),false,'basefield'),
                                                    
                                                    'added' => array(__('Added',"zero-bs-crm"),false,'basefield'),
                                                    'editlink' => array(__('Edit Link',"zero-bs-crm")),
                                                    'external_source' => array(__('External Source',"zero-bs-crm")),

													// not user-configurable, so disabling for now
                                                    //'assignedobj' => array(__('Assigned To',"zero-bs-crm"),false,'basefield'),

                            );

   /* ======================================================================================================
      ======================== / Transactions
      ===================================================================================================== */


/* ======================================================================================================
      ======================== Forms
      ===================================================================================================== */

      
   global $zeroBSCRM_columns_form;

   $zeroBSCRM_columns_form = array();
   $zeroBSCRM_columns_form['default'] =  array(
                                                    'id' => array('ID',false,'basefield'),
                                                    'title' => array(__('Title','zero-bs-crm'),false,'basefield'),
                                                    'style' => array(__('Style',"zero-bs-crm"),false,'basefield'),
                                                    'views' => array(__('Views',"zero-bs-crm")),
                                                    'conversions' => array(__('Conversions',"zero-bs-crm")),
                                                    'added' => array(__('Added',"zero-bs-crm"),false,'basefield'),
                                                    'editlink' => array(__('Edit',"zero-bs-crm"))
                                            );

   $zeroBSCRM_columns_form['all'] =  array(
                                                    'id' => array('ID',false,'basefield'),
                                                    'title' => array(__('Title','zero-bs-crm'),false,'basefield'),
                                                    'style' => array(__('Style',"zero-bs-crm"),false,'basefield'),
                                                    'views' => array(__('Views',"zero-bs-crm")),
                                                    'conversions' => array(__('Conversions',"zero-bs-crm")),
                                                    'added' => array(__('Added',"zero-bs-crm"),false,'basefield'),
                                                    'editlink' => array(__('Edit',"zero-bs-crm"))
                                            );

   /* ======================================================================================================
      ======================== / Forms
      ===================================================================================================== */

   /* ======================================================================================================
      ======================== Segments
      ===================================================================================================== */


   global $zeroBSCRM_columns_segment;

   $zeroBSCRM_columns_segment = array();
   $zeroBSCRM_columns_segment['default'] =  array(
                                                    'id' => array('ID',false,'basefield'),
                                                    'name' => array(__('Name','zero-bs-crm'),false,'basefield'),
                                                    'audiencecount' => array(__('Contact Count','zero-bs-crm')),
                                                    'action' => array(__('Action','zero-bs-crm'))
                                            );

   $zeroBSCRM_columns_segment['all'] = array(
                                                    'id' => array('ID',false,'basefield'),
                                                    'name' => array(__('Name','zero-bs-crm'),false,'basefield'),
                                                    'audiencecount' => array(__('Contact Count','zero-bs-crm')),
                                                    'action' => array(__('Action','zero-bs-crm')),
                                                    'added' => array(__('Added','zero-bs-crm'))
                                                    
                            );



   /* ======================================================================================================
      ======================== / Segments
      ===================================================================================================== */

   /* ======================================================================================================
      ======================== Quote Templates
      ===================================================================================================== */


   global $zeroBSCRM_columns_quotetemplate;

   $zeroBSCRM_columns_quotetemplate = array();
   $zeroBSCRM_columns_quotetemplate['default'] =  array(

                                          
                                                    'id' => array('ID',false,'basefield'),
                                                    'title' => array(__('Title','zero-bs-crm'),false,'basefield'),
                                                    'action' => array(__('Action','zero-bs-crm'))
                                            );

   $zeroBSCRM_columns_quotetemplate['all'] = array(

                                          
                                                    'id' => array('ID',false,'basefield'),
                                                    'title' => array(__('Title','zero-bs-crm'),false,'basefield'),
                                                    'action' => array(__('Action','zero-bs-crm'))
                                                    
                            );



   /* ======================================================================================================
      ======================== / Quote Templates
      ===================================================================================================== */

   /* ======================================================================================================
      ======================== Tasks
      ===================================================================================================== */


   global $zeroBSCRM_columns_event;

   $zeroBSCRM_columns_event = array();
   $zeroBSCRM_columns_event['default'] =  array(

                                          
                                                    'id' => array('ID',false,'basefield'),
                                                    'title' => array( __('Name','zero-bs-crm'), false, 'basefield' ),
                                                    'start' => array( __('Starting', 'zero-bs-crm' ) ),
                                                    'end' => array( __('Finishing', 'zero-bs-crm' ) ),
                                                    'status' => array( __('Status', 'zero-bs-crm' ) ),
                                                    'assigned' => array(__('Assigned To',"zero-bs-crm"), false, 'basefield' ),
                                                    'action' => array( __('Action', 'zero-bs-crm') )
                                            );

   $zeroBSCRM_columns_event['all'] = array(

                                                    'id' => array('ID',false,'basefield'),
                                                    'title' => array( __('Name','zero-bs-crm'), false, 'basefield' ),
                                                    'desc' => array( __('Description', 'zero-bs-crm' ) ),
                                                    'start' => array( __('Starting', 'zero-bs-crm' ) ),
                                                    'end' => array( __('Finishing', 'zero-bs-crm' ) ),
                                                    'status' => array( __('Status', 'zero-bs-crm' ) ),
                                                    'remind' => array( __('Reminder', 'zero-bs-crm' ) ),
                                                    'showcal' => array( __('Show on Cal', 'zero-bs-crm' ) ),
                                                    //'showportal' => array( __('Show on Portal', 'zero-bs-crm' ) ),
                                                    'contact' => array( __('Contact', 'zero-bs-crm' ) ),
                                                    'company' => array( __('Company', 'zero-bs-crm' ) ),
                                                    'assigned' => array(__('Assigned To',"zero-bs-crm"), false, 'basefield' ),
                                                    'action' => array( __('Action', 'zero-bs-crm') )
                                                    
                            );



   /* ======================================================================================================
      ======================== / Tasks
      ===================================================================================================== */

// phpcs:disable Generic.WhiteSpace.ScopeIndent.Incorrect, Generic.WhiteSpace.ScopeIndent.IncorrectExact
/**
 * Unpacks listview settings
 */
function zeroBSCRM_unpackListViewSettings() {

      // ALL FIELD TYPES
      global $zeroBSCRM_columns_customer, $zbsCustomerFields;
      global $zeroBSCRM_columns_company, $zbsCompanyFields;
      global $zeroBSCRM_columns_quote, $zbsCustomerQuoteFields;
      global $zeroBSCRM_columns_invoice, $zbsCustomerInvoiceFields;
      global $zeroBSCRM_columns_transaction, $zbsTransactionFields;
      global $zeroBSCRM_columns_form, $zbsFormFields;

          $useSecondAddress = zeroBSCRM_getSetting('secondaddress');
          $second_address_label = zeroBSCRM_getSetting( 'secondaddresslabel' );
          if ( empty( $second_address_label ) ) {
            $second_address_label = __( 'Second Address', 'zero-bs-crm' );
          }

          // Cycle through each + add
          $mappings = array(

              'zeroBSCRM_columns_customer' => 'zbsCustomerFields',
              'zeroBSCRM_columns_company' => 'zbsCompanyFields',
              'zeroBSCRM_columns_quote' => 'zbsCustomerQuoteFields', // not sure why naming convention lost here
              'zeroBSCRM_columns_invoice' => 'zbsCustomerInvoiceFields', // not sure why naming convention lost here
              'zeroBSCRM_columns_transaction' => 'zbsTransactionFields',
              'zeroBSCRM_columns_form' => 'zbsFormFields',

            );

            foreach ($mappings as $columnsObjName => $fieldsObjName){

                // add all normal fields to columns (DAL2) from 2.95
                if (is_array(${$fieldsObjName}) && count(${$fieldsObjName}) > 0){ 
                  foreach (${$fieldsObjName} as $fKey => $fDetail){
                    if (!isset(${$columnsObjName}['all'][$fKey])){

                      // some need hiding (just for api/behind scenes:)
                      $hideCol = false; if (is_array($fDetail) && isset($fDetail['nocolumn']) && $fDetail['nocolumn']) $hideCol = true;

                      if (!$hideCol){

                        $skip = false;  // skip addr 2 if off

                        // add it
                        $cfTitle = $fKey; if (is_array($fDetail) && isset($fDetail[1])) $cfTitle = $fDetail[1];

                        // secaddr get's dealt with:
												if ( str_starts_with( $fKey, 'secaddr_' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
                          $cfTitle .= ' (' . esc_html( $second_address_label ) . ')';
                          if ($useSecondAddress !== 1) $skip = true;
                        }

                        if (!$skip) ${$columnsObjName}['all'][$fKey] = array($cfTitle,false,'basefield'); // note adding as basefield :)
                      }

                    }
                  }
                }

            }

        // Auto-add 'edit link' to quotes invs (somehow it wasn't always adding)
        $customviews2 = zeroBSCRM_getSetting('customviews2'); $cv2Changed = false;
        if (isset($customviews2['quote']) && !array_key_exists('editlink', $customviews2['quote'])){

            // add it
            $customviews2['quote']['editlink'] = array(__('Edit',"zero-bs-crm"));
            $cv2Changed = true;

        }
        if (isset($customviews2['invoice']) && !array_key_exists('editlink', $customviews2['invoice'])){

            // add it
            $customviews2['invoice']['editlink'] = array(__('Edit',"zero-bs-crm"));
            $cv2Changed = true;

        }
        if ($cv2Changed && is_array($customviews2)){

            // Save setting
            global $zbs;
            return $zbs->settings->update('customviews2',$customviews2);
        

        }


    }

// phpcs:enable Generic.WhiteSpace.ScopeIndent.Incorrect, Generic.WhiteSpace.ScopeIndent.IncorrectExact
