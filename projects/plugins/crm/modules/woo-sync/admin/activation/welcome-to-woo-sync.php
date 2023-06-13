<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Welcome Wizard
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;


##WLREMOVE

// this relates to core welcome wizard code, presumably stops both firing at once
global $zeroBSCRM_killDenied; $zeroBSCRM_killDenied = true;

// js
wp_enqueue_script('jpcrm-woo-sync-jquery-blockui', plugins_url('/js/lib/jquery.blockUI.min.js',JPCRM_WOO_SYNC_ROOT_FILE), array( 'jquery' ));
wp_enqueue_script('jpcrm-woo-sync-bootstrap', plugins_url('/js/lib/bootstrap.min.js',JPCRM_WOO_SYNC_ROOT_FILE), array( 'jquery' ));
wp_enqueue_script('jpcrm-woo-sync-welcome-wizard', plugins_url('/js/jpcrm-woo-sync-welcome-wizard'.wp_scripts_get_suffix().'.js',JPCRM_WOO_SYNC_ROOT_FILE), array( 'jquery' ));

// css - bootstrap
wp_enqueue_style('woozbswelcomebootstrap',         plugins_url('/css/lib/bootstrap.min.css',JPCRM_WOO_SYNC_ROOT_FILE) );

// css - all of the below sheets were beautified and put into partials
//  which now get merged into this one css file.
wp_enqueue_style('jpcrm-woo-sync-welcome-wizard',         plugins_url('/css/jpcrm-woo-sync-welcome-wizard'.wp_scripts_get_suffix().'.css',JPCRM_WOO_SYNC_ROOT_FILE) );

// dequeue admin bar css
wp_dequeue_style('admin-bar-css'); 

global $zbs;


?><!DOCTYPE html>
<html lang="en-US">
    <head>
    	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    	<meta name="viewport" content="width=device-width">
    	<title><?php esc_html_e( 'Welcome to Jetpack CRM: WooCommerce Sync', 'zerobscrm' );?></title>
        <?php 

            // output css and js
            wp_print_styles();
            wp_print_scripts();

         ?>
        <script type="text/javascript">
            var ajaxurl = '<?php echo esc_html( admin_url('admin-ajax.php') ); ?>';
        </script>
    </head>
    <body class="zbscrm-setup wp-core-ui">
    <h1 id="jpcrm-woo-logo">
        <a href="<?php echo jpcrm_esc_link( $zbs->slugs['dash'] ); ?>">
            <img id="zbslogo" src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/jpcrm-logo-horizontal-black.png';?>" alt="Jetpack CRM logo">
            <i class="plus icon"></i>
            <img id="jpcrm-woosync-woo-logo" src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/woocommerce-logo-color-black@2x.png" alt="WooCommerce logo">
        </a>
    </h1>
    		<div class="zbscrm-setup-content" id="firstPage">
    <div class="container">
    <div class="stepwizard">
        <div class="stepwizard-row setup-panel">
            <div class="stepwizard-step">
                <a href="#step-1" id="step-1-button" type="button" class="btn btn-primary btn-circle">1</a>
                <p><?php esc_html_e("Choose Setup Type","zero-bs-crm");?></p>
            </div>
            <div class="stepwizard-step">
                <a href="#step-2" id="step-2-button" type="button" class="btn btn-default btn-circle">2</a>
                <p><?php esc_html_e("API Information","zero-bs-crm");?></p>
            </div>
            <div class="stepwizard-step">
                <a href="#step-3" id="step-3-button" type="button" class="btn btn-default btn-circle">3</a>
                <p><?php esc_html_e("Options","zero-bs-crm");?></p>
            </div>
            <div class="stepwizard-step">
                <a href="#step-4" type="button" class="btn btn-default btn-circle">4</a>
                <p><?php esc_html_e("Finish","zero-bs-crm");?></p>
            </div>
        </div>
    </div>
        <div class="row setup-content" id="step-1">
            <div class="col-xs-12">
                <div class="col-md-12">
                    <h3><?php esc_html_e( 'Setup Type', 'zero-bs-crm' ); ?></h3>
                    <div class="wizopt">

                        <div class='col-md-6'>
                            <div class='setup-choice setup-selected' id='sc-0'>
                                <h5><?php esc_html_e( 'WooCommerce on this website', 'zero-bs-crm' ); ?></h5>
                                <p><?php esc_html_e( 'Choose this option if your WooCommerce install is on the same website as your install of Jetpack CRM', 'zero-bs-crm' ); ?></p>
                                <ul>
                                    <li><?php esc_html_e( 'No API setup required', 'zero-bs-crm' ); ?></li>
                                    <li><?php esc_html_e( 'Syncs data from WooCommerce instantly', 'zero-bs-crm' ); ?></li>
                                    <li><?php esc_html_e( 'Jetpack CRM and WooCommerce on the same WordPress install', 'zero-bs-crm' ); ?></li>
                                </ul>
                                <div id='jpcrm-woo-setup-0'>
                                    <div class='choose'>
                                        <span class='btn btn-warning' data-setup='0'><?php esc_html_e( 'Choose', 'zero-bs-crm' ); ?></span>
                                    </div>
                                    <div class='selected'>
                                        <span class='btn btn-green'><i class='fa fa-check'></i> <?php esc_html_e( 'Selected', 'zero-bs-crm' ); ?></span>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div class='col-md-6'>
                            <div class='setup-choice' id='sc-1'>
                                <h5><?php esc_html_e( 'WooCommerce on an external website', 'zero-bs-crm' ); ?></h5>
                                <p><?php esc_html_e( 'Choose this option if your WooCommerce install is on a different website than your Jetpack CRM install', 'zero-bs-crm' ); ?></p>
                                <ul>
                                    <li><?php esc_html_e( 'Woo API setup information required', 'zero-bs-crm' ); ?></li>
                                    <li><?php esc_html_e( 'Syncs data from WooCommerce every 5 minutes via cron', 'zero-bs-crm' ); ?></li>
                                    <li><?php esc_html_e( 'Jetpack CRM and WooCommerce are on separate WordPress installs', 'zero-bs-crm' ); ?></li>
                                </ul>
                                <div id='jpcrm-woo-setup-1'>
                                    <div class='choose'>
                                        <span class='btn btn-warning' data-setup='1'><?php esc_html_e( 'Choose', 'zero-bs-crm' ); ?></span>
                                    </div>
                                    <div class='selected'>
                                        <span class='btn btn-green'><i class='fa fa-check'></i> <?php esc_html_e( 'Selected', 'zero-bs-crm' ); ?></span>
                                    </div>

                                </div>


                            </div>
                        </div>
                        <div class='clear'></div>
                    </div>

                    <hr />

                    <div class='clear'></div>
                    <button class="btn btn-primary nextBtn btn-lg pull-right" type="button" ><?php esc_html_e( 'Next', 'zero-bs-crm' ); ?></button>
                </div>
            </div>
        </div>
        <div class="row setup-content" id="step-2" style="display:none;">
            <div class="col-xs-12">
                <div class="col-md-12">

                    <!-- ingest -->
                    <h3><?php esc_html_e( 'API information', 'zero-bs-crm' ); ?></span></h3>
                    <div id="same-install">
                        <p>
                            <?php esc_html_e( 'You have indicated that Jetpack CRM and WooCommerce are installed on the same WordPress website, so no WooCommerce API information is needed. Click "Next" to continue or click "Back" to change your choice.', 'zero-bs-crm' ); ?>
                        </p>
                    </div>
                    <div id="external-install">
                        <p>
                            <?php esc_html_e( 'You have indicated that Jetpack CRM and WooCommerce are installed on different WordPress websites. If WooCommerce is installed on the same website as Jetpack CRM, click "Back" to change your choice.', 'zero-bs-crm' ); ?>
                        </p>
                        <p>
                            <?php esc_html_e( 'For Jetpack CRM to connect to your external WooCommerce site, you will need to get API credentials from the WooCommerce install.', 'zero-bs-crm' ); ?> <a href="<?php echo esc_url( $zbs->modules->woosync->urls['kb-woo-api-keys'] ); ?>" target="_blank"><?php esc_html_e( 'Learn more here.', 'zero-bs-crm' ); ?></a>
                        </p>
                        <input class="form-control" type="text" id="jpcrm_wcdomain" value="" placeholder="https://yourwoosite.com" />
                        <p class='small'><?php esc_html_e( 'Enter the site URL of your WooCommerce site here.', 'zero-bs-crm' ); ?></p>

                        <input class="form-control" type="text" id="jpcrm_wckey" value="" placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                        <p class='small'><?php esc_html_e( 'Enter your WooCommerce API key here.', 'zero-bs-crm' ); ?></p>

                        <input class="form-control" type="text" id="jpcrm_wcsecret" value="" placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                        <p class='small'><?php esc_html_e( 'Enter your WooCommerce API secret here.', 'zero-bs-crm' ); ?></p>

                        <input class="form-control" type="text" id="jpcrm_wcprefix" value="" placeholder="e.g. my_woo_site" />
                        <p class='small'><?php esc_html_e( 'Enter a unique order prefix here to identify your external WooCommerce store.', 'zero-bs-crm' ); ?></p>
                    </div>

                    <hr />

                    <div class='clear'></div>
                    <button id="back-to-setup-type" class="btn btn-secondary prevBtn btn-lg pull-left" type="button" ><?php esc_html_e( 'Back', 'zero-bs-crm' ); ?></button>
                    <button class="btn btn-primary nextBtn btn-lg pull-right" type="button" ><?php esc_html_e( 'Next', 'zero-bs-crm' ); ?></button>
                </div>
            </div>
        </div>

        <div class="row setup-content" id="step-3" style="display:none">
            <div class="col-xs-12">
                <div class="col-md-12">

                    <h3><?php esc_html_e( 'Optional Features', 'zero-bs-crm' ); ?></h3>

                    <div style='text-align:center'>
                        <p><?php echo wp_kses( sprintf( __( 'Note that WooCommerce Sync settings can be changed at any time by going <a href="%s">here</a>.', 'zero-bs-crm' ), jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=' . $zbs->modules->woosync->slugs['settings'] ) ), $zbs->acceptable_restricted_html ); ?></p>
                    </div>

                    <div class="wizopt">

                        <div class="switchbox-right">
                            
                            <div class="switchBox">
                                <div class="switchCheckbox">
                                    <input type="checkbox" id="jpcrm_wcinv" value="jpcrm_wcinv" checked="checked" />
                                    <label for="jpcrm_wcinv"></label>
                                </div>
                            </div>

                        </div>

                        <label><?php esc_html_e( 'Create Invoices', 'zero-bs-crm' ); ?></label>
                        <p><?php esc_html_e( 'WooSync can create invoices for each customer from their WooCommerce order information. This is useful if you want to give your WooCommerce customers access to their invoices in the Client Portal.', 'zero-bs-crm' ); ?></p>

                    </div>

                    <hr />

                    <div class="wizopt">

                        <div class="switchbox-right">  
                            
                            <div class="switchBox">
                                <div class="switchCheckbox">
                                    <input type="checkbox" id="jpcrm_wctagcust" value="jpcrm_wctagcust" checked="checked" />
                                    <label for="jpcrm_wctagcust"></label>
                                </div>
                            </div>

                        </div>

                        <label><?php esc_html_e( 'Tag Customers with Product Name', 'zero-bs-crm' ); ?></label>
                        <p><?php esc_html_e( 'Enable this to tag imported customers with the name of the product they purchased. This can be used to make segments of customers that purchased a given item.', 'zero-bs-crm' ); ?></p>

                    </div>

                    <hr />

                    <div class="wizopt">

                        <div class="switchbox-right">  

                            <div class="switchBox">
                                <div class="switchCheckbox">
                                    <input type="checkbox" id="jpcrm_wcacc" value="jpcrm_wcacc" checked="checked" />
                                    <label for="jpcrm_wcacc"></label>
                                </div>
                            </div>

                        </div>

                        <label><?php esc_html_e( 'Show Invoices in WooCommerce My Account', 'zero-bs-crm' ); ?></label>
                        <p><?php esc_html_e( 'This will add an "Invoice" menu item within the "My Account" section of WooCommerce, allowing the customer to see all their CRM invoices.', 'zero-bs-crm' ); ?></p>

                    </div>

                    <hr />

                    <div class='clear'></div>
                    <button id="back-to-api-info" class="btn btn-secondary prevBtn btn-lg pull-left" type="button" ><?php esc_html_e( 'Back', 'zero-bs-crm' ); ?></button>
                    <button class="btn btn-primary nextBtn btn-lg pull-right" type="button" ><?php esc_html_e( 'Next', 'zero-bs-crm' ); ?></button>
                </div>
            </div>
        </div>
        <div class="row setup-content" id="step-4" style="display:none;">
            <div class="col-xs-12">
                <div class="col-md-12 laststage">
                    <h3><?php esc_html_e( 'Setup Wizard Complete', 'zero-bs-crm' ); ?></h3>

                    <p style="text-align:center"><?php esc_html_e( 'Congratulations! You have completed the WooCommerce Sync setup wizard. Click "Finish" to save the options you selected.', 'zero-bs-crm' ); ?>

                    <hr />

                    <div class='clear'></div>

                    <button id="back-to-options" class="btn btn-secondary prevBtn btn-lg pull-left" type="button" ><?php esc_html_e( 'Back', 'zero-bs-crm' ); ?></button>
                    <button class="btn btn-primary btn-lg pull-right jpcrm-gogogo" type="button" ><?php esc_html_e( 'Finish', 'zero-bs-crm' ); ?></button>
                </div>


                <div class="col-md-12 finishingupblock" style="display:none;">
                    <h3><?php esc_html_e( 'Saving your WooSync settings', 'zero-bs-crm' ); ?></h3>
                    <div style='text-align:center'>
                    <img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/go.gif" alt="Jetpack CRM" style="margin:40px">
                    <p><?php esc_html_e( 'Just sorting out your new Jetpack CRM setup using the information you have provided. This shouldn\'t take a moment...', 'zero-bs-crm' ); ?></p>
                    </div>
                </div>

                <div class="col-md-12 finishblock" style="display:none;">
                    <h3> <?php esc_html_e( 'Almost Finished', 'zerobscrm' ); ?></h3>
                    <div style='text-align:center;'>
                    <p><?php esc_html_e( 'That\'s it, you\'re good to go. Now check your settings and start importing orders!', 'zero-bs-crm' ); ?></p>


                    </div>
                    <p>
                        <?php esc_html_e( 'Make sure to double-check your WooSync settings. One option people like to adjust is the contact status mapping (default is lead).', 'zero-bs-crm' ); ?> <a href="<?php echo esc_url( $zbs->modules->woosync->urls['kb-woo-map-status'] ); ?>" target="_blank"><?php esc_html_e( 'Learn more here.', 'zero-bs-crm' ); ?></a>
                    </p>
                    <?php
                        $loc = 'admin.php?page=' . $zbs->slugs['settings'] . '&tab=' . $zbs->modules->woosync->slugs['settings'];

                        echo '<input type="hidden" name="jpcrm-woo-wizard-ajax-nonce" id="jpcrm-woo-wizard-ajax-nonce" value="' . esc_attr( wp_create_nonce( 'jpcrm-woo-wizard-ajax-nonce' ) ) . '" />';
                        echo '<input type="hidden" name="phf-finish" id="phf-finish" value="' . esc_attr( admin_url($loc) ) . '" />';  
                    ?>
                    <div style="text-align: right">
                        <a class="btn btn-info btn-lg zbs-finito" href="<?php echo jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=' . $zbs->modules->woosync->slugs['settings'] ); ?>"><?php esc_html_e("Review Settings","zero-bs-crm");?></a>
                        &nbsp;&nbsp;
                        <a class="btn btn-success btn-lg" href="<?php echo jpcrm_esc_link( $zbs->slugs['woosync'] ); ?>"><?php esc_html_e("Start Importing","zero-bs-crm");?></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </div>
    </body>
</html>
<?php

##/WLREMOVE