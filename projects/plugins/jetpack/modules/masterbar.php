<?php
/**
 * Module Name: WordPress.com Toolbar and Dashboard customizations
 * Module Description: Replaces the admin bar with a useful toolbar to quickly manage your site via WordPress.com. Also adds additional customizations to the WPAdmin dashboard experience for better compatibility with WP.com.
 * Sort Order: 38
 * Recommendation Order: 16
 * First Introduced: 4.8
 * Requires Connection: Yes
 * Requires User Connection: Yes
 * Auto Activate: No
 * Module Tags: General
 * Additional Search Queries: adminbar, masterbar, colorschemes, profile-edit
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Masterbar\Main as Jetpack_Masterbar;

Jetpack_Masterbar::init();
