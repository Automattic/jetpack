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
	const MASTER_CONTROLS = 'ai-master-controls';

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
		Feature_Flags::register(
			self::MASTER_CONTROLS,
			array(
				'default'     => false,
				'description' => 'Enforce the AI master switch and the AI Hub feature toggles off WordPress.com Simple.',
				'owner'       => 'jetpack-ai',
			)
		);
	}
}

Jetpack_AI_Feature_Flags::register();
