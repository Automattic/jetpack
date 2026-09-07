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

/**
 * Registers feature flags owned by Jetpack AI.
 */
class Jetpack_AI_Feature_Flags {

	const SCHEDULED_TASKS = 'ai-hub-scheduled-tasks';

	/**
	 * Register Jetpack AI feature flags.
	 *
	 * @return void
	 */
	public static function register() {
		Feature_Flags::register(
			self::SCHEDULED_TASKS,
			array(
				'default'     => false,
				'description' => 'Enable the Scheduled tasks tab and Agents Manager sidebar in AI Hub.',
				'owner'       => 'jetpack-ai',
			)
		);
	}
}

Jetpack_AI_Feature_Flags::register();
