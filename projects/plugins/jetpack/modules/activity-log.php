<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Module Name: Activity Log
 * Module Description: A record of every event on your site, so you can see what happened and roll back when something goes wrong.
 * Sort Order: 38
 * Recommendation Order: 12
 * First Introduced: 15.9
 * Requires Connection: Yes
 * Requires User Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Recommended
 * Feature: Security
 * Additional Search Queries: activity, log, activity log, history, events, audit, audit log, rewind, restore, roll back, rollback
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Activity_Log\Jetpack_Activity_Log;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Bootstrap the Activity Log package. This file is only loaded by
// Jetpack::load_modules() when the `activity-log` module is active, so the
// admin page and REST routes are wired up only while the module is on.
Jetpack_Activity_Log::initialize();
