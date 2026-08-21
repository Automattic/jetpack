<?php
/**
 * Jetpack AI feature flags.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

Feature_Flags::register(
	'ai-hub-scheduled-tasks',
	array(
		'default'     => false,
		'description' => 'Enable the Scheduled tasks tab and Agents Manager sidebar in AI Hub.',
		'owner'       => 'jetpack-ai',
	)
);
