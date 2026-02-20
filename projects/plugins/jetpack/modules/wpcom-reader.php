<?php
/**
 * Module Name: WordPress.com Reader
 * Module Description: Quickly access the WordPress.com Reader from your site's admin bar.
 * Sort Order: 12
 * First Introduced: 15.5
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Social
 * Feature: Engagement
 * Additional Search Queries: read, subscriptions, subscribe, reader, follow
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Newsletter\Reader_Link;

Reader_Link::init();
