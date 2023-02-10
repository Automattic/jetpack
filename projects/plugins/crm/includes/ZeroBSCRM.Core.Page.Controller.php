<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.5
 *
 * Copyright 2020 Automattic
 *
 * Date: 09/01/18
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */



/* ======================================================
  	Page Controllers
   ====================================================== */

/*
* Sets $zbs-pageKey based on $_GET parameters
* e.g. `admin.php?page=zbs-add-edit&action=edit&zbstype=contact&zbsid=101`
* sets `$zbs->pageKey` to `zbs-add-edit-contact-edit`
*/
function jpcrm_pages_admin_addedit_set_pagekey(){

  global $zbs;

  // defaults 

  // retrieve vars
  $zbsid = $zbs->zbsvar('zbsid');
  $type = $zbs->zbsvar('zbstype');
  if ($type == -1) {
    $type = 'contact';
  }
  $action = $zbs->zbsvar('action');

  // note here we append type + action to pageKey, if they're here (so we can differentiate between them for screenoptions)
  // This overrides the setting of pageKey in CoreMenusLearn
  $pageKey = $zbs->slugs['addedit']; // makes it zbs-add-edit
  $pageKey .= '-'.$type.'-'.$action;
  $zbs->pageKey = $pageKey;

}

/*
*   Translates $_GET variables into zeroBSCRM_pages_admin_addedit_page call
*/
function zeroBSCRM_pages_admin_addedit(){

  global $zbs;

	zeroBSCRM_pages_admin_addedit_page( ( $zbs->zbsvar('zbstype' ) == -1) ? 'contact' : $zbs->zbsvar('zbstype'), $zbs->zbsvar('action'), $zbs->zbsvar('zbsid'));

}

#} This is a slow general move to new UI (and new DB) and moving away from the custom post add / edit links
function zeroBSCRM_pages_admin_addedit_page($type='contact', $action='new', $id=-1){

  #} learn script (for this page)

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




  <?php
  switch ($type){

      case 'contact':
        //pass them this way..
        zeroBSCRM_pages_admin_addedit_page_contact($id, $action);
        break;

      case 'company':
        zeroBSCRM_pages_admin_addedit_page_company($id,$action);
        break;

      case 'segment':
        zeroBSCRM_pages_admin_addedit_page_segment($id,$action);
        break;

      // DAL3.0 + the rest can be fired via zeroBSCRM_pages_admin_addedit_page_generic
      case 'quote':
      case 'invoice':
      case 'transaction':
      case 'event':
      case 'form':
      case 'quotetemplate':
        zeroBSCRM_pages_admin_addedit_page_generic($id,$action);
        break;

  }


}

#} This function runs before any HTML has been output (after admin_init)
#} ... it catches add_edit pages + initiates the right edit class, if needed
#} ... This allows us to SAVE DATA before HTML has been output + therefor redirect with http headers
#} e.g. New contact -> added -> redir to /..&zbsid=1
#} Edit view is added to a global var, so draw can be called in page func :)
function zeroBSCRM_prehtml_pages_admin_addedit(){

  global $zbs;

  // get from zbsvar - so long as pre admin_init, this is fine to do. (This func is called a few funcs after globalise_vars() in Core, so is legit)
  $zbsid = $zbs->zbsvar('zbsid');
  $action = $zbs->zbsvar('action');
  $type = $zbs->zbsvar('zbstype'); if (empty($type) || $type == -1) $type = 'contact';

  // set the pageKey var
  jpcrm_pages_admin_addedit_set_pagekey();

  // proceed to class factory
  if ($action == 'edit'){

    global $zbsEditView;

    switch ($type){

          case 'contact':

              #} sell smt?
              $upsellBoxHTML = ''; 
              
              $zbsEditView = new zeroBSCRM_Edit(array(

                    'objID'         => $zbsid,
                    'objTypeID'     => ZBS_TYPE_CONTACT,

                    /* all of this was centralised via objTypeID^^ based on DAL from DAL3+
                    'objType'       => 'contact',
                    'singular'      => $lang[0], // Contact
                    'plural'        => $lang[1], // Contacts
                    'tag'           => 'zerobscrm_customertag',
                    'postType'      => 'zerobs_customer',
                    'postPage'      => 'manage-customers', */

                    'langLabels'    => array(

                        // labels
                        //'what' => __('WHAT',"zero-bs-crm"),

                    ),
                    'extraBoxes' => $upsellBoxHTML

              ));

              break;

          case 'company':
          
              $upsellBoxHTML = ''; 
              $zbsEditView = new zeroBSCRM_Edit(array(
                    'objID'         => $zbsid,
                    'objTypeID'     => ZBS_TYPE_COMPANY,
                    'langLabels'    => array(),
                    'extraBoxes' => $upsellBoxHTML
              ));

              break;

          case 'quote':
          
              $upsellBoxHTML = ''; 
              $zbsEditView = new zeroBSCRM_Edit(array(
                    'objID'         => $zbsid,
                    'objTypeID'     => ZBS_TYPE_QUOTE,
                    'langLabels'    => array(
                      // send email modal
                      'send_email'        => __('Email Quote', 'zero-bs-crm'),
                      'sendthisemail'        => __('Send this quote via email:', 'zero-bs-crm'),
                      'toemail'        => __('To Email:', 'zero-bs-crm'),
                      'toemailplaceholder'        => __('e.g. mike@example.com', 'zero-bs-crm'),
                      'attachassoc'        => __('Attach associated files', 'zero-bs-crm'),
                      'attachpdf'        => __('Attach as PDF', 'zero-bs-crm'),
                      'sendthemail'        => __('Send', 'zero-bs-crm'),
                      'sendneedsassignment'        => __('To send an email, this quote needs to be assigned to a contact or company with a valid email address', 'zero-bs-crm'),
                      'sendingemail'        => __('Sending Email...', 'zero-bs-crm'),
                      'senttitle'        => __('Quote Sent', 'zero-bs-crm'),
                      'sent'        => __('Your quote has been sent by Email', 'zero-bs-crm'),
                      'senderrortitle'        => __('Error Sending', 'zero-bs-crm'),
                      'senderror'        => __('There was an error sending this quote via email.', 'zero-bs-crm')
                    ),
                    'extraBoxes' => $upsellBoxHTML
              ));

              break;

          case 'invoice':
          
              $upsellBoxHTML = ''; 
              $zbsEditView = new zeroBSCRM_Edit(array(
                    'objID'         => $zbsid,
                    'objTypeID'     => ZBS_TYPE_INVOICE,
                    'langLabels'    => array(),
                    'extraBoxes' => $upsellBoxHTML
              ));

              break;

          case 'transaction':
          
              $upsellBoxHTML = ''; 
              $zbsEditView = new zeroBSCRM_Edit(array(
                    'objID'         => $zbsid,
                    'objTypeID'     => ZBS_TYPE_TRANSACTION,
                    'langLabels'    => array(),
                    'extraBoxes' => $upsellBoxHTML
              ));

              break;

          case 'form':
          
              $upsellBoxHTML = ''; 
              $zbsEditView = new zeroBSCRM_Edit(array(
                    'objID'         => $zbsid,
                    'objTypeID'     => ZBS_TYPE_FORM,
                    'langLabels'    => array(),
                    'extraBoxes' => $upsellBoxHTML
              ));

              break;

          case 'event':
          
              $upsellBoxHTML = ''; 
              $zbsEditView = new zeroBSCRM_Edit(array(
                    'objID'         => $zbsid,
                    'objTypeID'     => ZBS_TYPE_EVENT,
                    'langLabels'    => array(),
                    'extraBoxes' => $upsellBoxHTML
              ));

              break;

          case 'quotetemplate':
          
              $upsellBoxHTML = ''; 
              $zbsEditView = new zeroBSCRM_Edit(array(
                    'objID'         => $zbsid,
                    'objTypeID'     => ZBS_TYPE_QUOTETEMPLATE,
                    'langLabels'    => array(),
                    'extraBoxes' => $upsellBoxHTML
              ));

              break;

        }


    } elseif ($action == 'delete'){

      global $zbsDeleteView;

      switch ($type){

            case 'contact':
                
                $zbsDeleteView = new zeroBSCRM_Delete(array(

                      'objID'         => $zbsid,
                      'objTypeID'     => ZBS_TYPE_CONTACT,
                      'langLabels'    => array(),

                ));

                break;

            case 'company':
            
                $zbsDeleteView = new zeroBSCRM_Delete(array(
                      'objID'         => $zbsid,
                      'objTypeID'     => ZBS_TYPE_COMPANY,
                      'langLabels'    => array()
                ));

                break;

            case 'quote':
            
                $zbsDeleteView = new zeroBSCRM_Delete(array(
                      'objID'         => $zbsid,
                      'objTypeID'     => ZBS_TYPE_QUOTE,
                      'langLabels'    => array()
                ));

                break;

            case 'invoice':
            
                $zbsDeleteView = new zeroBSCRM_Delete(array(
                      'objID'         => $zbsid,
                      'objTypeID'     => ZBS_TYPE_INVOICE,
                      'langLabels'    => array()
                ));

                break;

            case 'transaction':
            
                $zbsDeleteView = new zeroBSCRM_Delete(array(
                      'objID'         => $zbsid,
                      'objTypeID'     => ZBS_TYPE_TRANSACTION,
                      'langLabels'    => array()
                ));

                break;

            case 'form':
            
                $zbsDeleteView = new zeroBSCRM_Delete(array(
                      'objID'         => $zbsid,
                      'objTypeID'     => ZBS_TYPE_FORM,
                      'langLabels'    => array()
                ));

                break;

            case 'event':
            
                $zbsDeleteView = new zeroBSCRM_Delete(array(
                      'objID'         => $zbsid,
                      'objTypeID'     => ZBS_TYPE_EVENT,
                      'langLabels'    => array()
                ));

                break;

            case 'quotetemplate':
            
                $zbsDeleteView = new zeroBSCRM_Delete(array(
                      'objID'         => $zbsid,
                      'objTypeID'     => ZBS_TYPE_QUOTETEMPLATE,
                      'langLabels'    => array()
                ));

                break;

          }

    }


}


function zeroBSCRM_pages_admin_addedit_page_contact($id = -1, $action = 'new'){

    global $zbs;

    if ($action == 'view'){

        // return view page
        zeroBSCRM_pages_admin_view_page_contact($id);

    } elseif ($action == 'edit'){

      /* ================================================================================
      =============================== EDIT OBJECT ==================================== */

          global $zbs,$zbsEditView;

          /* Edit Class now initiated above (in zeroBSCRM_prehtml_pages_admin_addedit) for pre-html saving 
          .. so we can just draw here :) */
          $zbsEditView->drawEditView();

      /* ============================== / EDIT OBJECT ==================================== 
      ================================================================================ */

    } elseif ($action == 'delete'){

      /* ================================================================================
      ================================ DEL OBJECT ==================================== */

          global $zbsDeleteView;

          /* Delete Class now initiated above (in zeroBSCRM_prehtml_pages_admin_addedit) for pre-html saving 
          .. so we can just draw here :) */
          $zbsDeleteView->drawView();

      /* ============================== /  DEL OBJECT ==================================== 
      ================================================================================ */

    }


}

function zeroBSCRM_pages_admin_addedit_page_company($id = -1, $action = 'new'){

    global $zbs;

    if ($action == 'view'){

        // return view page
        zeroBSCRM_pages_admin_view_page_company($id);

    } elseif ($action == 'edit'){

      // super simple draw, as class would have been initiated into global, here: zeroBSCRM_prehtml_pages_admin_addedit
      global $zbsEditView; $zbsEditView->drawEditView();

    } elseif ($action == 'delete'){

      /* ================================================================================
      ================================ DEL OBJECT ==================================== */

          global $zbsDeleteView;

          /* Delete Class now initiated above (in zeroBSCRM_prehtml_pages_admin_addedit) for pre-html saving 
          .. so we can just draw here :) */
          $zbsDeleteView->drawView();

      /* ============================== /  DEL OBJECT ==================================== 
      ================================================================================ */

    }

}

function zeroBSCRM_pages_admin_addedit_page_segment($id,$action=''){


    if ($action == 'view'){

        // return view page
        // for now, none
        //zeroBSCRM_pages_addEditSegment($id);

    } elseif ($action == 'edit'){

    	// edit page
        zeroBSCRM_pages_addEditSegment($id);

    } elseif ($action == 'delete'){

      /* ================================================================================
      ================================ DEL OBJECT ==================================== */

          global $zbsDeleteView;

          /* Delete Class now initiated above (in zeroBSCRM_prehtml_pages_admin_addedit) for pre-html saving 
          .. so we can just draw here :) */
          $zbsDeleteView->drawView();

      /* ============================== /  DEL OBJECT ==================================== 
      ================================================================================ */

    } 

}


function zeroBSCRM_pages_admin_addedit_page_generic($id = -1, $action = 'new'){

    global $zbs;

    if ($action == 'view'){

        // return view page
        // Generic objs (quotes, invs, trans etc.) 
        echo zeroBSCRM_UI2_messageHTML('warning',__('Error #101','zero-bs-crm'),__('This page does not exist.','zero-bs-crm'));

    } elseif ($action == 'edit'){

      // super simple draw, as class would have been initiated into global, here: zeroBSCRM_prehtml_pages_admin_addedit
      global $zbsEditView; $zbsEditView->drawEditView();

    } elseif ($action == 'delete'){

      /* ================================================================================
      ================================ DEL OBJECT ==================================== */

          global $zbsDeleteView;

          /* Delete Class now initiated above (in zeroBSCRM_prehtml_pages_admin_addedit) for pre-html saving 
          .. so we can just draw here :) */
          $zbsDeleteView->drawView();

      /* ============================== /  DEL OBJECT ==================================== 
      ================================================================================ */

    }

}
/* ======================================================
  	/ Page Controllers
   ====================================================== */


/* ======================================================
  Page Titles (for our custom pages e.g. edit contact)
   ====================================================== */
add_filter('admin_title', 'zeroBSCRM_pages_titleModifier', 999, 2);

function zeroBSCRM_pages_titleModifier($admin_title, $title)
{
    return apply_filters('zbs_admin_title_modifier', $admin_title, $title);
}
/* this is hooked into in page setup


add_filter( 'zbs_admin_title_modifier' , 'cut_the_boasting',10,2);
function cut_the_boasting($admin_title,$title) {
	return 'ZBS'.$title.' AND '.$admin_title;
}

*/
/* ======================================================
  / Page Titles (for our custom pages e.g. edit contact)
   ====================================================== */
