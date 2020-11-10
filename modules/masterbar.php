<?php
/**
 * Module Name: WordPress.com Toolbar and Dashboard customizations
 * Module Description: Replaces the admin bar with a useful toolbar to quickly manage your site via WordPress.com. Also adds additional customizations to the WPAdmin dashboard experience for better compatibility with WP.com.
 * Sort Order: 38
 * Recommendation Order: 16
 * First Introduced: 4.8
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: General
 * Additional Search Queries: adminbar, masterbar, colorschemes
 */

require dirname( __FILE__ ) . '/masterbar/masterbar.php';
require dirname( __FILE__ ) . '/masterbar/unified-admin-color-schemes.php';

new A8C_WPCOM_Masterbar();
new A8C_WPCOM_Unified_Admin_Color_Schemes();
