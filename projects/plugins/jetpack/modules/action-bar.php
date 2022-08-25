<?php
/**
 * Module Name: (Experimental) Action Bar
 * Module Description: An easy to use way for visits to follow, like, and comment on your site.
 * Sort Order: 40
 * Recommendation Order: 18
 * First Introduced: $$next-version$$
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Social
 * Feature: Engagement
 * Additional Search Queries: adminbar, actionbar, comments, likes, follow, sharing
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Action_Bar;

$action_bar = new Action_Bar();
$action_bar->init();
