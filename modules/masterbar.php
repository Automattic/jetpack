<?php
/**
 * Module Name: WordPress.com Toolbar
 * Module Description: An admin bar providing similar experience to the front-end navigation on WordPress.com.
 * Sort Order: 38
 * Recommendation Order: 16
 * First Introduced: 4.7
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: General
 * Additional Search Queries: adminbar
 */

include dirname( __FILE__ ) . '/masterbar/masterbar.php';

new A8C_WPCOM_Masterbar;
