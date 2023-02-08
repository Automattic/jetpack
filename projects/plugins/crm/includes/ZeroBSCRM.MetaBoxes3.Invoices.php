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

function zeroBSCRM_InvoicesMetaboxSetup() {

	// main detail
	$zeroBS__Metabox_Invoice = new zeroBS__Metabox_Invoice( __FILE__ );

	// actions (status + save)
	$zeroBS__Metabox_InvoiceActions = new zeroBS__Metabox_InvoiceActions( __FILE__ );

	// invoice tags box
	$zeroBS__Metabox_InvoiceTags = new zeroBS__Metabox_InvoiceTags( __FILE__ );

	// external sources
	$zeroBS__Metabox_ExtSource = new zeroBS__Metabox_ExtSource( __FILE__, 'invoice', 'zbs-add-edit-invoice-edit' );

	// files
	$zeroBS__Metabox_InvoiceFiles = new zeroBS__Metabox_InvoiceFiles( __FILE__ );
}

add_action( 'admin_init', 'zeroBSCRM_InvoicesMetaboxSetup' );

/* ======================================================
   / Init Func
   ====================================================== */

/* ======================================================
  Invoicing Metabox
   ====================================================== */

class zeroBS__Metabox_Invoice extends zeroBS__Metabox {

	// this is for catching 'new' invoice
	private $newRecordNeedsRedir = false;

	public function __construct( $plugin_file ) {

		// set these
		$this->objType = 'invoice';
		$this->metaboxID = 'zerobs-invoice-edit';
		$this->metaboxTitle = __( 'Invoice Information', 'zero-bs-crm' ); // will be headless anyhow
		$this->headless = true;
		$this->metaboxScreen = 'zbs-add-edit-invoice-edit';
		$this->metaboxArea = 'normal';
		$this->metaboxLocation = 'high';
		$this->saveOrder = 1;
		$this->capabilities = array(

			'can_hide'        => false,             // can be hidden
			'areas'           => array( 'normal' ), // areas can be dragged to - normal side = only areas currently
			'can_accept_tabs' => true,              // can/can't accept tabs onto it
			'can_become_tab'  => false,             // can be added as tab
			'can_minimise'    => true,              // can be minimised
			'can_move'        => true,              // can be moved

		);

		// call this
		$this->initMetabox();

	}

	public function html( $invoice, $metabox ) {

		// localise ID
		$invoiceID = is_array( $invoice ) && isset( $invoice['id'] ) ? (int)$invoice['id'] : -1;

		global $zbs;

		// Prefill ID and OBJ are added to the #zbs_invoice to aid in prefilling the data (when drawn with JS)
		$prefill_id = -1;
		$prefill_obj = -1;
		$prefill_email = '';
		$prefill_name = '';

		if ( !empty( $_GET['zbsprefillcust'] ) ) {
			$prefill_id = (int)$_GET['zbsprefillcust'];
			$prefill_obj = ZBS_TYPE_CONTACT;
			$prefill_email = zeroBS_customerEmail( $prefill_id );
			$prefill_name = $zbs->DAL->contacts->getContactNameWithFallback( $prefill_id );
		}
		if ( !empty( $_GET['zbsprefillco'] ) ) {
			$prefill_id = (int)$_GET['zbsprefillco'];
			$prefill_obj = ZBS_TYPE_COMPANY;
			$prefill_email = zeroBS_companyEmail( $prefill_id );
			$prefill_name = $zbs->DAL->companies->getCompanyNameEtc( $prefill_id );
		}
		?>
		<?php /* AJAX NONCE */ ?>
		<script type="text/javascript">var zbscrmjs_secToken = '<?php echo esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ); ?>';</script>
		<?php /* END OF NONCE */ ?>
		<?php
		// AJAX NONCE for inv sending... defunct v3.0?
		echo '<input type="hidden" name="inv-ajax-nonce" id="inv-ajax-nonce" value="' . esc_attr( wp_create_nonce( 'inv-ajax-nonce' ) ) . '" />';

		// invoice UI divs (loader and canvas)
		echo '<div id="zbs_loader"><div class="ui active dimmer inverted"><div class="ui text loader">' . esc_html( __( 'Loading Invoice...', 'zero-bs-crm' ) ) . '</div></div><p></p></div>';
		echo "<div id='zbs_invoice' class='zbs_invoice_html_canvas' data-invid='" . esc_attr( $invoiceID ) . "'></div>";

		// we pass the hash along the chain here too :)
		if ( isset( $invoice['hash'] ) ) {
			echo '<input type="hidden" name="zbsi_hash" id="zbsi_hash" value="' . esc_attr( $invoice['hash'] ) . '" />';
		}

		// custom fields
		$customFields = $zbs->DAL->getActiveCustomFields( array( 'objtypeid' => ZBS_TYPE_INVOICE ) );
		if ( !is_array( $customFields ) ) {
			$customFields = array();
		}

		// pass data:
		?>
		<script type="text/javascript">

			<?php
			if ( $prefill_obj > 0 ) {
				echo 'var zbsJS_prefillobjtype = ' . esc_js( $prefill_obj ) . ';';
			}
			if ( $prefill_id > 0 ) {
				echo 'var zbsJS_prefillid = ' . esc_js( $prefill_id ) . ';';
			}
			echo 'var zbsJS_prefillemail = \'' . esc_js( $prefill_email ) . '\';';
			echo 'var zbsJS_prefillname = \'' . esc_js( $prefill_name ) . '\';';

			// only sendemail if have active template :)
			echo 'var zbsJS_invEmailActive = ' . ( zeroBSCRM_get_email_status( ZBSEMAIL_EMAILINVOICE ) == 1 ? '1' : '-1' ) . ';';
			?>
		</script>
		<div id="zbs-invoice-custom-fields-holder" style="display:none">
			<table>
				<?php

				// here we put the fields out then:
				// 1) copy the fields into the UI
				foreach ( $customFields as $cfK => $cF ) {

					zeroBSCRM_html_editField( $invoice, $cfK, $cF, 'zbsi_' );

				}
				?>
			</table>
		</div>
		<?php

		// allow hook-ins from invoicing pro etc.
		do_action( 'zbs_invoicing_append' );
	}

	public function save_data( $invoiceID, $invoice ) {

		if ( !defined( 'ZBS_OBJ_SAVED' ) ) {

			define( 'ZBS_OBJ_SAVED', 1 );

			global $zbs;

			// check this
			if ( empty( $invoiceID ) || $invoiceID < 1 ) {
				$invoiceID = -1;
			}

			// retrieve existing
			$existing_invoice = $zbs->DAL->invoices->getInvoice( $invoiceID );

			$autoGenAutonumbers = true; // generate if not set :)
			$removeEmpties = false; // req for autoGenAutonumbers
			$invoice = zeroBS_buildObjArr( $_POST, array(), 'zbsi_', '', $removeEmpties, ZBS_TYPE_INVOICE, $autoGenAutonumbers );

			// Use the tag-class function to retrieve any tags so we can add inline.
			// Save tags against objid
			$invoice['tags'] = zeroBSCRM_tags_retrieveFromPostBag( true, ZBS_TYPE_INVOICE );

			// pay via
			$invoice['pay_via'] = isset( $_POST['pay_via'] ) && (int)$_POST['pay_via'] === -1 ? -1 : 0;

			// new way.. now not limited to 30 lines as now they are stored in [] type array in JS draw
			$zbsInvoiceLines = array();

			// gather lineitem data from POST
			// really this could use a refactor on the JS side so the POST data is structured how we want
			foreach ( $_POST['zbsli_itemname'] as $k => $v ) {

				$ks = sanitize_text_field( $k ); // at least this

				if ( !isset( $zbsInvoiceLines[$ks]['net'] ) ) {
					$zbsInvoiceLines[$ks]['net'] = 0.0;
				}
				$zbsInvoiceLines[$ks]['title']    = sanitize_text_field( $_POST['zbsli_itemname'][$k] );
				$zbsInvoiceLines[$ks]['desc']     = sanitize_textarea_field( $_POST['zbsli_itemdes'][$k] );
				$zbsInvoiceLines[$ks]['quantity'] = sanitize_text_field( $_POST['zbsli_quan'][$k] );
				$zbsInvoiceLines[$ks]['price']    = sanitize_text_field( $_POST['zbsli_price'][$k] );

				// calc a net, if have elements
				if ( !empty( $zbsInvoiceLines[$ks]['quantity'] ) && !empty( $zbsInvoiceLines[$ks]['price'] ) ) {

					$zbsInvoiceLines[$ks]['net'] = $zbsInvoiceLines[$ks]['quantity'] * $zbsInvoiceLines[$ks]['price'];

				} else {

					// leave net as empty :)

				}

				// taxes now stored as csv in 'taxes', 'tax' contains a total, but that's not passed by MS UI (yet? not needed?)
				$zbsInvoiceLines[$ks]['tax']   = 0;
				$zbsInvoiceLines[$ks]['taxes'] = empty( $_POST['zbsli_tax'][$k] ) ? '' : sanitize_text_field( $_POST['zbsli_tax'][$k] );

				/* as at 22/2/19, each lineitem here could hold:
					'order' => '',
					'title' => '',
					'desc' => '',
					'quantity' => '',
					'price' => '',
					'currency' => '',
					'net' => '',
					'discount' => '',
					'fee' => '',
					'shipping' => '',
					'shipping_taxes' => '',
					'shipping_tax' => '',
					'taxes' => '',
					'tax' => '',
					'total' => '',
					'created' => '',
					'lastupdated' => '',
				*/
			}

			if ( count( $zbsInvoiceLines ) > 0 ) {
				$invoice['lineitems'] = $zbsInvoiceLines;
			}

			// other items to update

			// hours or quantity switch
			if ( !empty( $_POST['invoice-customiser-type'] ) ) {
				$invoice['hours_or_quantity'] = $_POST['invoice-customiser-type'] === 'hours' ? 0 : 1;
			}

			// totals passed
			$invoice['discount'] = empty( $_POST['invoice_discount_total'] ) ? 0 : (float)sanitize_text_field( $_POST['invoice_discount_total'] );
			$invoice['discount_type'] = empty( $_POST['invoice_discount_type'] ) ? 0 : sanitize_text_field( $_POST['invoice_discount_type'] );
			$invoice['shipping'] = empty( $_POST['invoice_postage_total'] ) ? 0 : (float)sanitize_text_field( $_POST['invoice_postage_total'] );
			$invoice['shipping_tax'] = empty( $_POST['zbsli_tax_ship'] ) ? 0 : (float)sanitize_text_field( $_POST['zbsli_tax_ship'] );
			// or shipping_taxes (not set by MS script)

			// ... js pass through :o Will be overwritten on php calc on addUpdate, actually, v3.0+
			$invoice['total'] = empty( $_POST['zbs-inv-grand-total-store'] ) ? 0 : (float)sanitize_text_field( $_POST['zbs-inv-grand-total-store'] );

			// assignments
			$zbsInvoiceContact = (int)$_POST['zbs_invoice_contact'];
			$invoice['contacts'] = $zbsInvoiceContact > 0 ? array( $zbsInvoiceContact ) : array();
			$zbsInvoiceCompany = (int)$_POST['zbs_invoice_company'];
			$invoice['companies'] = $zbsInvoiceCompany > 0 ? array( $zbsInvoiceCompany ) : array();
			// Later use: 'address_to_objtype'

			// other fields
			if ( isset( $_POST['invoice_status'] ) ) {
				$invoice['status'] = sanitize_text_field( $_POST['invoice_status'] );
			}
			if ( isset( $_POST['zbsi_logo'] ) ) {
				$invoice['logo_url'] = sanitize_url( $_POST['zbsi_logo'] );
			}

			$ref_type = $zbs->settings->get( 'reftype' );
			if ( $invoiceID === -1 && $ref_type === 'autonumber' ) {
				$next_number = $zbs->settings->get( 'refnextnum' );
				$prefix = $zbs->settings->get( 'refprefix' );
				$suffix = $zbs->settings->get( 'refsuffix' );
				$invoice['id_override'] = $prefix . $next_number . $suffix;
				$next_number++;
				$zbs->settings->update( 'refnextnum', $next_number );
			} elseif ( isset( $_POST['zbsi_ref'] ) ) {
				$invoice['id_override'] = sanitize_text_field( $_POST['zbsi_ref'] );
			} else {

				// ref should exist
				if ( empty( $invoice['id_override'] ) && isset( $existing_invoice['id_override'] ) ) {

					// override empty with existing
					$invoice['id_override'] = $existing_invoice['id_override'];

				}

			}

			// this needs to be translated to UTS (GMT)
			if ( isset( $_POST['zbsi_date'] ) ) {
				$invoice['date'] = sanitize_text_field( $_POST['zbsi_date'] );
				$invoice['date'] = jpcrm_date_str_to_uts( $invoice['date'] );
			}

			// due date is now calculated on save, then stored as UTS, if passed this way:
			// ... if due_date not set, editor will keep showing "due in x days" select
			// ... once set, that'll always show as a datepicker, based on the UTS in due_date
			if ( isset( $_POST['zbsi_due'] ) ) {

				// days (-1 - 90)
				$dueInDays = sanitize_text_field( $_POST['zbsi_due'] );

				// got date + due days?
				if ( isset( $invoice['date'] ) && $dueInDays >= 0 ) {

					// project it forward
					$invoice['due_date'] = $invoice['date'] + ( $dueInDays * 60 * 60 * 24 );

				}

			}
			// ... this then catches datepicker-picked dates (if passed by datepicker variant to due_days)
			if ( isset( $_POST['zbsi_due_date'] ) ) {
				$invoice['due_date'] = sanitize_text_field( $_POST['zbsi_due_date'] );
				$invoice['due_date'] = jpcrm_date_str_to_uts( $invoice['due_date'] );
			}

			// Custom Fields.
			/*$customFields = $zbs->DAL->getActiveCustomFields(array('objtypeid' => ZBS_TYPE_INVOICE));
			if (!is_array($customFields)) $customFields = array();
			foreach ($customFields as $cfK => $cfV){

				if (isset($_POST['zbsi_'.$cfK]))    $invoice[$cfK]      = sanitize_text_field($_POST['zbsi_'.$cfK]);

			}*/

			// add/update
			$addUpdateReturn = $zbs->DAL->invoices->addUpdateInvoice(
				array(
					'id'               => $invoiceID,
					'data'             => $invoice,
					'limitedFields'    => -1,

					// here we want PHP to calculate the total, tax etc. where we don't calc all the specifics in js
					'calculate_totals' => 1,
				)
			);

			// Note: For NEW objs, we make sure a global is set here, that other update funcs can catch
			// ... so it's essential this one runs first!
			// this is managed in the metabox Class :)
			if ( $invoiceID === -1 && !empty( $addUpdateReturn ) && $addUpdateReturn != -1 ) {

				$invoiceID = $addUpdateReturn;
				global $zbsJustInsertedMetaboxID;
				$zbsJustInsertedMetaboxID = $invoiceID;

				// set this so it redirs
				$this->newRecordNeedsRedir = true;
			}

			// success?
			if ( $addUpdateReturn > 0 ) {

				// Update Msg
				// this adds an update message which'll go out ahead of any content
				// This adds to metabox: $this->updateMessages['update'] = zeroBSCRM_UI2_messageHTML('info olive mini zbs-not-urgent',__('Contact Updated',"zero-bs-crm"),'','address book outline','contactUpdated');
				// This adds to edit page
				$this->updateMessage();

				// catch any non-critical messages
				$nonCriticalMessages = $zbs->DAL->getErrors( ZBS_TYPE_INVOICE );
				if ( is_array( $nonCriticalMessages ) && count( $nonCriticalMessages ) > 0 ) {
					$this->dalNoticeMessage( $nonCriticalMessages );
				}

			} else {

				// fail somehow
				$failMessages = $zbs->DAL->getErrors( ZBS_TYPE_INVOICE );

				// show msg (retrieved from DAL err stack)
				if ( is_array( $failMessages ) && count( $failMessages ) > 0 ) {
					$this->dalErrorMessage( $failMessages );
				} else {
					$this->dalErrorMessage( array( __( 'Insert/Update Failed with general error', 'zero-bs-crm' ) ) );
				}

				// pass the pre-fill:
				global $zbsObjDataPrefill;
				$zbsObjDataPrefill = $invoice;

			}

		}

		return $invoice;
	}

	// This catches 'new' contacts + redirs to right url
	public function post_save_data( $objID, $obj ) {

		if ( $this->newRecordNeedsRedir ) {

			global $zbsJustInsertedMetaboxID;
			if ( !empty( $zbsJustInsertedMetaboxID ) && $zbsJustInsertedMetaboxID > 0 ) {

				// redir
				wp_redirect( jpcrm_esc_link( 'edit', $zbsJustInsertedMetaboxID, $this->objType ) );
				exit;

			}

		}

	}

	public function updateMessage() {

		global $zbs;

		// zbs-not-urgent means it'll auto hide after 1.5s
		// genericified from DAL3.0
		$msg = zeroBSCRM_UI2_messageHTML( 'info olive mini zbs-not-urgent', $zbs->DAL->typeStr( $zbs->DAL->objTypeKey( $this->objType ) ) . ' ' . __( 'Updated', 'zero-bs-crm' ), '', 'address book outline', 'contactUpdated' );

		$zbs->pageMessages[] = $msg;

	}

}


/* ======================================================
  / Invoicing Metabox
   ====================================================== */


/* ======================================================
  Invoice Files Metabox
   ====================================================== */

    class zeroBS__Metabox_InvoiceFiles extends zeroBS__Metabox{

        public function __construct( $plugin_file ) {

            // DAL3 switched for objType $this->postType = 'zerobs_customer';
            $this->objType = 'invoice';
            $this->metaboxID = 'zerobs-invoice-files';
            $this->metaboxTitle = __('Associated Files',"zero-bs-crm");
            $this->metaboxScreen = 'zbs-add-edit-invoice-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
            $this->metaboxArea = 'normal';
            $this->metaboxLocation = 'low';
            $this->capabilities = array(

                'can_hide'          => true, // can be hidden
                'areas'             => array('normal'), // areas can be dragged to - normal side = only areas currently
                'can_accept_tabs'   => true,  // can/can't accept tabs onto it
                'can_become_tab'    => true, // can be added as tab
                'can_minimise'      => true // can be minimised

            );

            // call this 
            $this->initMetabox();

        }

        public function html( $invoice, $metabox ) {

                global $zbs;

                $html = '';

                // localise ID
                $invoiceID = -1; if (is_array($invoice) && isset($invoice['id'])) $invoiceID = (int)$invoice['id'];

                #} retrieve
                $zbsFiles = array(); if ($invoiceID > 0) $zbsFiles = zeroBSCRM_files_getFiles('invoice',$invoiceID);

                ?><table class="form-table wh-metatab wptbp" id="wptbpMetaBoxMainItemFiles">

                    <?php 

                        // WH only slightly updated this for DAL3 - could do with a cleanup run (contact file edit has more functionality)

                        #} Any existing
                        if (is_array($zbsFiles) && count($zbsFiles) > 0){ 
                          ?><tr class="wh-large"><th><label><?php printf( esc_html( _n( '%s associated file', '%s associated files', count($zbsFiles), 'text-domain' ) ), esc_html( number_format_i18n( count($zbsFiles) ) ) ); ?></label></th>
                                    <td id="zbsFileWrapInvoices">
                                        <?php $fileLineIndx = 1; foreach($zbsFiles as $zbsFile){

                                            $file = zeroBSCRM_files_baseName($zbsFile['file'],isset($zbsFile['priv']));

                                            echo '<div class="zbsFileLine" id="zbsFileLineInvoice'. esc_attr( $fileLineIndx ) .'"><a href="'. esc_url( $zbsFile['url'] ) .'" target="_blank">'. esc_html( $file ) .'</a> (<span class="zbsDelFile" data-delurl="'. esc_attr( $zbsFile['url'] ) .'"><i class="fa fa-trash"></i></span>)</div>';
                                            $fileLineIndx++;

                                        } ?>
                                    </td></tr><?php

                        } 
                    ?>

                    <?php #adapted from http://code.tutsplus.com/articles/attaching-files-to-your-posts-using-wordpress-custom-meta-boxes-part-1--wp-22291

                            $html .= '<input type="file" id="zbsobj_file_attachment" name="zbsobj_file_attachment" size="25" class="zbs-dc">';

                            ?><tr class="wh-large"><th><label><?php esc_html_e('Add File',"zero-bs-crm");?>:</label><br />(<?php esc_html_e('Optional',"zero-bs-crm");?>)<br /><?php esc_html_e('Accepted File Types',"zero-bs-crm");?>:<br /><?php echo esc_html( zeroBS_acceptableFileTypeListStr() ); ?></th>
                                <td><?php
                            wp_nonce_field(plugin_basename(__FILE__), 'zbsobj_file_attachment_nonce');
                            echo $html;
                    ?></td></tr>
            
            </table>
            <script type="text/javascript">

                var zbsInvoicesCurrentlyDeleting = false;
                var zbsMetaboxFilesLang = {
                    'err': '<?php echo esc_html( zeroBSCRM_slashOut(__('Error',"zero-bs-crm")) ); ?>',
                    'unabletodel' : '<?php echo esc_html( zeroBSCRM_slashOut(__('Unable to delete this file',"zero-bs-crm")) ); ?>',

                }

                jQuery(function(){

                    jQuery('.zbsDelFile').on( 'click', function(){

                        if (!window.zbsInvoicesCurrentlyDeleting){

                            // blocking
                            window.zbsInvoicesCurrentlyDeleting = true;

                            var delUrl = jQuery(this).attr('data-delurl');
                            var lineIDtoRemove = jQuery(this).closest('.zbsFileLine').attr('id');

                            if (typeof delUrl != "undefined" && delUrl != ''){



                                  // postbag!
                                  var data = {
                                    'action': 'delFile',
                                    'zbsfType': 'invoices',
                                    'zbsDel':  delUrl, // could be csv, never used though
                                    'zbsCID': <?php echo esc_html( $invoiceID ); ?>,
                                    'sec': window.zbscrmjs_secToken
                                  };

                                  // Send it Pat :D
                                  jQuery.ajax({
                                          type: "POST",
                                          url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
                                          "data": data,
                                          dataType: 'json',
                                          timeout: 20000,
                                          success: function(response) {

                                            // visually remove
                                            jQuery('#' + lineIDtoRemove).remove();

                                            // file deletion errors, show msg:
                                            if (typeof response.errors != "undefined" && response.errors.length > 0){

                                                jQuery.each(response.errors,function(ind,ele){

                                                    jQuery('#zerobs-invoice-files-box').append('<div class="ui warning message" style="margin-top:10px;">' + ele + '</div>');

                                                });
                                                     

                                            }

                                          },
                                          error: function(response){

                                            jQuery('#zerobs-invoice-files-box').append('<div class="ui warning message" style="margin-top:10px;"><strong>' + window.zbsMetaboxFilesLang.err + ':</strong> ' + window.zbsMetaboxFilesLang.unabletodel + '</div>');

                                          }

                                        });

                            }

                            window.zbsInvoicesCurrentlyDeleting = false;

                        } // / blocking

                    });

                });


            </script><?php

        }

        public function save_data( $invoiceID, $invoice ) {

            global $zbsobj_justUploadedObjFile;
            $id = $invoiceID;

            if(!empty($_FILES['zbsobj_file_attachment']['name']) && 
                (!isset($zbsobj_justUploadedObjFile) ||
                    (isset($zbsobj_justUploadedObjFile) && $zbsobj_justUploadedObjFile != $_FILES['zbsobj_file_attachment']['name'])
                )
                ) {


		            /* --- security verification --- */
		            if(!wp_verify_nonce($_POST['zbsobj_file_attachment_nonce'], plugin_basename(__FILE__))) {
		              return $id;
		            } // end if


		            if(defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
		              return $id;
		            } // end if
		               
		            if (!zeroBSCRM_permsInvoices()){
		                return $id;
		            }
		            /* - end security verification - */

		            // Blocking repeat-upload bug
		            $zbsobj_justUploadedObjFile = $_FILES['zbsobj_file_attachment']['name'];

            		// verify file extension and mime type
                if ( jpcrm_file_check_mime_extension( $_FILES['zbsobj_file_attachment'] ) ){

                    $invoice_dir_info = jpcrm_storage_dir_info_for_invoices( $invoiceID );
                    $upload           = jpcrm_save_admin_upload_to_folder( 'zbsobj_file_attachment', $invoice_dir_info['files'] );

                    if ( isset( $upload['error'] ) && $upload['error'] != 0 ) {
                        wp_die('There was an error uploading your file. The error is: ' . esc_html( $upload['error'] ) );
                    } else {
                            // w mod - adds to array :)
                            $zbsFiles = zeroBSCRM_files_getFiles('invoice',$invoiceID);
               
                            if (is_array($zbsFiles)){

                                //add it
                                $zbsFiles[] = $upload;

                            } else {

                                // first
                                $zbsFiles = array($upload);

                            }
 
                            // update
                            zeroBSCRM_files_updateFiles('invoice',$invoiceID, $zbsFiles);

                            // Fire any 'post-upload-processing' (e.g. CPP makes thumbnails of pdf, jpg, etc.)
                            // not req invoicing: do_action('zbs_post_upload_contact',$upload);
                    }
                } else {
                    wp_die("The file type that you've uploaded is not an accepted file format.");
                }
            }

            return $invoice;
        }
    }


/* ======================================================
  / Attach files to invoice metabox
   ====================================================== */


/* ======================================================
    Invoicing Metabox Helpers
   ====================================================== */
function zeroBS__InvoicePro(){

        $upTitle = __('Want more from invoicing?',"zero-bs-crm");
        $upDesc = __('Accept Payments Online with Invoicing Pro.',"zero-bs-crm");
        $upButton = __('Buy Now',"zero-bs-crm");
        $upTarget = "https://jetpackcrm.com/product/invoicing-pro/";

        echo zeroBSCRM_UI2_squareFeedbackUpsell($upTitle,$upDesc,$upButton,$upTarget); 
            
}

/* ======================================================
  / Invoicing Metabox Helpers
   ====================================================== */


/* ======================================================
  Create Tags Box
   ====================================================== */

class zeroBS__Metabox_InvoiceTags extends zeroBS__Metabox_Tags{


    public function __construct( $plugin_file ) {
    
        $this->objTypeID = ZBS_TYPE_INVOICE;
        // DAL3 switched for objType $this->postType = 'zerobs_customer';
        $this->objType = 'invoice';
        $this->metaboxID = 'zerobs-invoice-tags';
        $this->metaboxTitle = __('Invoice Tags',"zero-bs-crm");
        $this->metaboxScreen = 'zbs-add-edit-invoice-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
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
    Invoice Actions Metabox
   ====================================================== */

    class zeroBS__Metabox_InvoiceActions extends zeroBS__Metabox{ 

        public function __construct( $plugin_file ) {

            // set these
            $this->objType = 'invoice';
            $this->metaboxID = 'zerobs-invoice-actions';
            $this->metaboxTitle = __('Invoice Actions','zero-bs-crm'); // will be headless anyhow
            $this->headless = true;
            $this->metaboxScreen = 'zbs-add-edit-invoice-edit';
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

        public function html( $invoice, $metabox ) {

            // debug print_r($invoice); exit();

            ?><div class="zbs-generic-save-wrap">

                    <div class="ui medium dividing header"><i class="save icon"></i> <?php esc_html_e('Invoice Actions','zero-bs-crm'); ?></div>

            <?php

            // localise ID & content
            $invoiceID = -1; if (is_array($invoice) && isset($invoice['id'])) $invoiceID = (int)$invoice['id'];
            
                #} if a saved post...
                //if (isset($post->post_status) && $post->post_status != "auto-draft"){
                if ($invoiceID > 0){ // existing

                    $potentialStatuses = zeroBSCRM_getInvoicesStatuses();
                    //print_r($potentialStatuses); exit();

                    // status
                    $zbs_stat = __('Draft','zero-bs-crm'); $sel='';
                    if (is_array($invoice) && isset($invoice['status'])) $zbs_stat = $invoice['status'];


                    /* grid doesn't work great for long-named:

                    <div class="ui grid">
                        <div class="six wide column">
                        </div>
                        <div class="ten wide column">
                        </div>
                    </div>

                    */
                    ?>
                    <div>
                        <label for="invoice_status"><?php esc_html_e('Status',"zero-bs-crm"); ?>: </label>
                        <select id="invoice_status" name="invoice_status">
                                <?php foreach($potentialStatuses as $z){
                                    if($z == $zbs_stat){$sel = ' selected'; }else{ $sel = '';}
                                    echo '<option value="'. esc_attr( $z ) .'"'. esc_attr( $sel ) .'>'. esc_html__($z,"zero-bs-crm").'</option>';
                                } ?>
                        </select>
                    </div>

                    <div class="clear"></div>

                    <?php do_action('zbs_invpro_itemlink'); ?>

                    <div class="clear"></div>


                    <div class="zbs-invoice-actions-bottom zbs-objedit-actions-bottom">
                        <button class="ui button green" type="button" id="zbs-edit-save"><?php esc_html_e("Update","zero-bs-crm"); ?> <?php esc_html_e("Invoice","zero-bs-crm"); ?></button>
                        <?php

                            #} Quick ver of this: http://themeflection.com/replace-wordpress-submit-meta-box/

                        ?><div id="zbs-invoice-actions-delete" class="zbs-objedit-actions-delete"><?php
                             // for now just check if can modify invs, later better, granular perms.
                             if ( zeroBSCRM_permsInvoices() ) {
                                
                                /* WP Deletion: 
                                      no trash (at least v3.0)
                                       if ( !EMPTY_TRASH_DAYS )
                                            $delete_text = __('Delete Permanently', "zero-bs-crm");
                                       else
                                            $delete_text = __('Move to Trash', "zero-bs-crm");
                            
                                ?><a class="submitdelete deletion" href="<?php echo get_delete_post_link($post->ID); ?>"><?php echo $delete_text; ?></a><?php
                                */

                                $delete_text = __('Delete Permanently', "zero-bs-crm");
                                ?><a class="submitdelete deletion" href="<?php echo jpcrm_esc_link( 'delete', $invoiceID, 'invoice' ); ?>"><?php echo esc_html( $delete_text ); ?></a><?php
                                

                             } //if ?>
                        </div>
                        
                        <div class='clear'></div>

                    </div>
                <?php


                } else {

                    ?>

                    <?php do_action('zbs_invpro_itemlink'); ?>

                    <button class="ui button green" type="button" id="zbs-edit-save"><?php esc_html_e("Save","zero-bs-crm"); ?> <?php esc_html_e("Invoice","zero-bs-crm"); ?></button>

                 <?php

                    #} If it's a new post 

                    #} Gross hide :/


            }

            ?></div><?php // / .zbs-generic-save-wrap
              
        }

        // saved via main metabox

    }


/* ======================================================
  / Invoice Actions Metabox
   ====================================================== */



/*#} Currently not used. Started to get confusing. To chat through as part of v3.1+ (and Recurring Invoices work?)
 function zerBSCRM_invoice_admin_submenu(){
     ?>
    <div class="ui menu" id="invoice_menu_ui">
    <div class="ui simple dropdown link item">
        <span class="text"><?php _e("Manage Invoices","zero-bs-crm");?></span>
        <i class="dropdown icon"></i>
        <div class="menu">
            <div class="item"><?php _e("Manage Invoices","zero-bs-crm");?></div>
            <div class="item"><?php _e("Manage Recurring Invoices","zero-bs-crm");?></div>
        </div>
    </div>
    <a class="item">
        <?php _e("Create Invoice", "zero-bs-crm"); ?>
    </a>
    <a class="item">
        <?php _e("Invoice Items", "zero-bs-crm"); ?>
    </a>

    <div class="ui simple dropdown item">
        <span class="text"><?php _e("Settings","zero-bs-crm");?></span>
        <i class="dropdown icon"></i>
        <div class="menu">
            <div class="item"><?php _e("Invoice Settings","zero-bs-crm");?></div>
            <div class="item"><?php _e("Business Information","zero-bs-crm");?></div>
            <div class="item"><?php _e("Tax Information","zero-bs-crm");?></div>
            <div class="item"><?php _e("Templates","zero-bs-crm");?></div>
        </div>
    </div>

    <a class="item right">
        <i class='ui icon info circle'></i><?php _e("Help", "zero-bs-crm"); ?>
    </a>

    </div>
     <?php
 }  */
