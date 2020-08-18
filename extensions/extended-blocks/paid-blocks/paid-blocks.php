<?php
/**
 * Block Editor functionality for Blocks with require a site with a paid plan.
 *
 * @package Automattic\Jetpack\Extended_Blocks
 */

// RequirePaid_Blocks class.
require_once './class-paid-blocks.php';
Automattic\Jetpack\Extended_Blocks\Paid_Blocks::get_instance();
