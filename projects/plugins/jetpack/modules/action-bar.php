<?php
/**
 * Module Name: Action bar
 * Module Description: An easy to use way for visits to follow, like, and comment on your site.
 * Sort Order: 38
 * Recommendation Order: 16
 * First Introduced: $$next-version$$
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Sharing
 * Feature: Sharing
 * Additional Search Queries: adminbar, actionbar
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Action_Bar;

$action_bar = new Action_Bar();
$action_bar->init();
