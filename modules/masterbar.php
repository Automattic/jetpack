<?php
/**
 * Module Name: WordPress.com Toolbar
 * Module Description: Replaces the admin bar with a useful toolbar to quickly manage your site via WordPress.com.
 * Sort Order: 38
 * Recommendation Order: 16
 * First Introduced: 4.8
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: General
 * Additional Search Queries: adminbar, masterbar
 */

include dirname( __FILE__ ) . '/masterbar/masterbar.php';

new A8C_WPCOM_Masterbar;
