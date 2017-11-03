<?php

/**
 * Module Name: Performance
 * Module Description: Web site performance optimisations
 * Sort Order: 24
 * Recommendation Order: 13
 * First Introduced: 5.5
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Appearance, Mobile, Recommended
 * Feature: Appearance
 * Additional Search Queries: mobile, performance
 */

include dirname( __FILE__ ) . "/perf/perf.php";
Jetpack_Perf::instance();