<?php
/**
 * Module Name: AI Experiments
 * Module Description: Experimental features that make your site work better with AI agents and large language models.
 * Sort Order: 40
 * First Introduced: 15.6
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Developers
 * Feature: Traffic
 * Additional Search Queries: ai, agents, llm, markdown, content negotiation, bot detection
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require __DIR__ . '/ai-experiments/class-jetpack-ai-experiments.php';

Jetpack_AI_Experiments::init();
