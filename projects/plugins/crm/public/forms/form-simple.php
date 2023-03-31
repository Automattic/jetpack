<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.99.12+
 *
 * Copyright 2019+ ZeroBSCRM.com
 *
 * Date: 29/10/2019
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

    global $zbs;    

if (isset($_GET['fid'])) {

    #} Assets we need specifically here
    zeroBSCRM_forms_scriptsStylesRegister();
    zeroBSCRM_forms_enqueuements();

    // attempt retrieval
    $formid = (int)sanitize_text_field($_GET['fid']);
    $zbsForm = zeroBS_getForm($formid);
    if (is_array($zbsForm) && isset($zbsForm['id'])){
        
        $formhandler =  esc_url( admin_url('admin-ajax.php') );

?><!DOCTYPE html>
<html lang="en-US" class="no-js">
<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name='robots' content='noindex,nofollow' />

    <title>ZBSCRM Form</title>

    <?php 

        wp_print_styles();
        wp_print_scripts(); //wp_scripts

        zeroBSCRM_forms_formHTMLHeader(); 

    ?>

</head><body>

<?php echo zeroBSCRM_forms_build_form_html($formid, 'simple');  ?>

</body></html><?php 

    } // / if form exists

}  // / if fid 

exit (); ?>
