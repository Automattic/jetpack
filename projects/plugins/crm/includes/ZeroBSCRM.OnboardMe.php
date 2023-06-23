<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/*!
 * Jetpack CRM - Onboard Me
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 27th December 2017
 *
 *
 * This is the "onboard me" plugin from the plugin hunt theme. The tour steps run from
 * /js/lib/zbs-welcome-tour.min.js
 * the tour runs using HOPSCOTCH
 * http://linkedin.github.io/hopscotch/
 * this seems the BEST one for multi page tours
 * tried bootstrap tour, but this struggles (and has redirect issues)
 * also hopscotch can re position bubbles when elements clicked (such as the hide WP menu nav bar)
 * can work on the tour steps TOGETHER as don't want to overload them but also want to tour them 
 * around the CRM so that they don't miss important features.
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */


function zeroBS_onboardme_scripts(){

	global $zbs;

	// Changed from bootstrap tour to hopscotch
	wp_enqueue_script( 'jquery' );
	wp_enqueue_script( 'onboardme-front', ZEROBSCRM_URL . 'js/lib/hopscotch.min.js', array( 'jquery' ), $zbs->version, true );
	wp_enqueue_style( 'onboardme-css', ZEROBSCRM_URL . 'css/lib/hopscotch.min.css', array(), $zbs->version );
	wp_enqueue_script( 'tour-front', ZEROBSCRM_URL . 'js/ZeroBSCRM.admin.tour' . wp_scripts_get_suffix() . '.js', array( 'jquery', 'onboardme-front' ), $zbs->version, true );

	$zbs_tour_root = admin_url();

	$zbs_tour = array(
		'admin_url' => $zbs_tour_root,
		'cta_url'   => $zbs->urls['upgrade'],
		'lang'      => array(
			'step1'  => array(
				'title'   => __( 'Welcome to your Jetpack CRM', 'zero-bs-crm' ),
				'content' => __( 'This quick tour will guide you through the basics.', 'zero-bs-crm' ) . '<hr />' . __( 'Clicking this logo will switch to full-screen mode. Try it!', 'zero-bs-crm' ),
			),
			'step2'  => array(
				'title'   => __( 'Learn More', 'zero-bs-crm' ),
				'content' => __( 'There are <strong>Learn</strong> buttons throughout the CRM. Use these to find out more about each area. Try clicking this one!', 'zero-bs-crm' ),
			),
			'step3'  => array(
				'title'   => __( 'Notifications', 'zero-bs-crm' ),
				'content' => __( 'Here is where your notifications can be found. This shows up-to-date events in your CRM', 'zero-bs-crm' ),
			),
			'step4'  => array(
				'title'   => __( 'Notification Alert', 'zero-bs-crm' ),
				'content' => __( 'When you have a notification, the icon will change. Next, we will look at what notifications are available.', 'zero-bs-crm' ),
			),
			'step5'  => array(
				'title'   => __( 'Example Notification', 'zero-bs-crm' ),
				'content' => __( 'Notifications are customised for your specific user. It\'s a great way to keep up-to-date (especially in teams!)', 'zero-bs-crm' ),
			),
			'step6'  => array(
				'title'   => __( 'Hi from Jetpack', 'zero-bs-crm' ),
				'content' => __( 'Here is another example of a notification. This time it\'s a greeting from all of us at Jetpack CRM.', 'zero-bs-crm' ),
			),
			'step7'  => array(
				'title'   => __( 'Tools (Extensions)', 'zero-bs-crm' ),
				'content' => __( 'When you install extensions they will appear here.', 'zero-bs-crm' ),
			),
			'step7a' => array(
				'title'   => __( 'Manage Modules', 'zero-bs-crm' ),
				'content' => __( 'You can enable/disable core modules such as invoices and quotes from here.', 'zero-bs-crm' ) . '<hr />',
			),
			'step7b' => array(
				'title'   => __( 'Manage Extensions', 'zero-bs-crm' ),
				'content' => __( 'You can manage your extensions from here.', 'zero-bs-crm' ) . '<hr />' . __( 'This is where Jetpack CRM shines as THE modular, "build-it-yourself" CRM!', 'zero-bs-crm' ),
			),
			'step9'  => array(
				'title'     => __( 'Paid extensions', 'zero-bs-crm' ),
				'content'   => __( 'Here are our paid extensions. Want them all? You can take advantage of our Entrepreneur bundle.', 'zero-bs-crm' ),
				'cta_label' => __( 'Upgrade to PRO', 'zero-bs-crm' ),
			),
			'step10' => array(
				'title'   => __( 'Jetpack CRM Settings', 'zero-bs-crm' ),
				'content' => __( 'Here are the settings for your CRM.', 'zero-bs-crm' ) . '<hr />' . __( 'When you install extensions their settings tabs will appear here.', 'zero-bs-crm' ),
			),
			'step12' => array(
				'title'   => __( 'Override WordPress', 'zero-bs-crm' ),
				'content' => __( 'If you only want Jetpack CRM to run on this WordPress install, you can enable "override mode", which removes all other WordPress sections.', 'zero-bs-crm' ),
			),
			'step13' => array(
				'title'   => __( 'Getting in touch', 'zero-bs-crm' ),
				'content' => __( 'That\'s it for this quick tour. If you have any other questions, check out the knowledge base or drop us an email.', 'zero-bs-crm' ) . '<hr />' . __( 'Hover over your avatar, and select an option on the menu any time you need support. Enjoy!', 'zero-bs-crm' ),
			),
		),
	);

	wp_localize_script( 'tour-front', 'zbs_tour', $zbs_tour );
}
// restricted this to admins in core.php so is safe to bluntly add here
add_action( 'zbs-global-admin-styles', 'zeroBS_onboardme_scripts' );

add_action('admin_footer','zeroBS_onboardme_helper');
function zeroBS_onboardme_helper(){ 

    global $zbs; ?>
<style type="text/css">
.tour-wrapper-footer {
    position: fixed;
    bottom: 10px;
    right: 20px;
    font-size: 50px;
    border-radius: 50%;
    height: 52px;
    width: 44px;
    padding: 0px;
    margin: 0px;
    line-height: 50px;
    cursor: pointer;
}
.tour-wrapper-footer a, .tour-wrapper-footer:hover a, .feedback-popup .title {
    color: #3f4347 !important;
}
.tour-wrapper-footer .fa {
    border-radius: 50%;
    height: 44px;
    width: 43px;
    padding: 0px;
    margin: 0px;
}
.tour-wrapper-footer a:focus{
    outline: none !important;
    border: none;
    outline-width: 0;
    box-shadow: none;
}
.hopscotch-cta {
    background: #ffa502 !important;
    border-color: #af9163 !important;
}
</style>



<?php
}