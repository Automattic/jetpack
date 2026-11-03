<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Module Name: AI
 * Module Description: Turn your ideas into ready-to-publish content and generate images with the power of AI.
 * Sort Order: 40
 * Recommendation Order: 15
 * First Introduced: 16.2-a.3
 * Requires Connection: Yes
 * Requires User Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: ai, artificial intelligence, jetpack ai, ai assistant, generate, content, images
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/*
 * This module is intentionally a toggle only: it bootstraps no code of its own.
 *
 * Jetpack AI enforcement already lives in `_inc/lib/class-jetpack-ai-settings.php`,
 * which self-initializes on load, so there is nothing to wire up here. The module
 * exists so that Jetpack AI can be turned on and off site-wide through the standard
 * Jetpack module machinery (and, for existing sites, keep auto-enabling on connection
 * via the normal module upgrade routine). Deliberately leave the body empty.
 */
