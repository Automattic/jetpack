<?php
/**
 * Register and check blocks availability depending on the site plan.
 *
 * @package Automattic\Jetpack\Extended_Blocks
 */

// RequireBlocks_Availability class.
require_once __DIR__ . '/class-blocks-availability.php';
Automattic\Jetpack\Extended_Blocks\Blocks_Availability::get_instance();
