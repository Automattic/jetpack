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

namespace Automattic\Jetpack\Dashboard_Customizations;

require dirname( __FILE__ ) . '/masterbar/masterbar/masterbar.php';
require dirname( __FILE__ ) . '/masterbar/admin-color-schemes/admin-color-schemes.php';

new Masterbar();
new Admin_Color_Schemes();
