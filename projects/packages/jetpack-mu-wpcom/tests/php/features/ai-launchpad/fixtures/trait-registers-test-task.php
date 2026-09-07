<?php
/**
 * Shared registry-definition seeding for the AI Launchpad tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds a second, test-only definition to AI_Launchpad_Task_Registry through the filter the registry
 * runs its definitions map through.
 *
 * The registry ships one entry (`add_gallery_page`), which is deliberately universally renderable and so
 * declares no `is_visible`. Without an injected definition the visibility gate could only be exercised by
 * giving a real task a visibility it does not have, which would test the fixture rather than the gate.
 */
trait AI_Launchpad_Registers_Test_Task {

	/**
	 * The id the injected definition is registered under.
	 *
	 * @var string
	 */
	private static $test_task_id = 'ai_launchpad_test_task';

	/**
	 * Registers a test-only registry task for the duration of one test. WorDBless restores hooks after
	 * each test, so the definition disappears with the filter.
	 *
	 * @param bool|null $is_visible True/false to give the definition an `is_visible` callable returning
	 *                              that, or null to omit the key entirely (the default-visible path).
	 * @return string The registered task id.
	 */
	private function register_test_task( $is_visible = null ) {
		$definition = array(
			'title'            => static function () {
				return 'A test task';
			},
			'default_subtitle' => static function () {
				return 'A test subtitle.';
			},
			'is_complete'      => static function () {
				return false;
			},
		);

		if ( null !== $is_visible ) {
			$definition['is_visible'] = static function () use ( $is_visible ) {
				return $is_visible;
			};
		}

		add_filter(
			'wpcom_ai_launchpad_task_registry_definitions',
			static function ( $definitions ) use ( $definition ) {
				$definitions[ self::$test_task_id ] = $definition;
				return $definitions;
			}
		);

		return self::$test_task_id;
	}
}
