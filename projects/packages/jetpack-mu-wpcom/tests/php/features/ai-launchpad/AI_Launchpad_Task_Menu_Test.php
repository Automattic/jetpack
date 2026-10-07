<?php
/**
 * Guards against drift between the AI Launchpad prompt's annotated task table (JS) and the
 * canonical launchpad task catalog (PHP).
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';

/**
 * The prompt's hardcoded `TASK_ANNOTATIONS` table (js/lib/prompts.ts) is maintained apart from the catalog and
 * the AI Launchpad registry that resolve every id it offers.
 */
class AI_Launchpad_Task_Menu_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up: register the default launchpad checklists so the catalog resolves.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
	}

	/**
	 * Every ID in the prompt's task table must be defined by the catalog or the AI Launchpad registry.
	 */
	public function test_task_menu_is_subset_of_catalog_or_registry() {
		$known   = array_merge(
			array_keys( wpcom_launchpad_get_task_definitions() ),
			AI_Launchpad_Task_Registry::task_ids()
		);
		$unknown = array_values( array_diff( $this->menu_ids(), $known ) );

		$this->assertSame(
			array(),
			$unknown,
			'The task table offers IDs defined by neither the catalog nor the AI Launchpad registry (they would be dropped at validation/enrichment): ' . implode( ', ', $unknown )
		);
	}

	/**
	 * Every task the registry defines must be annotated on the menu, or the model can never pick it.
	 */
	public function test_every_registry_task_is_offered_on_the_menu() {
		$unoffered = array_values( array_diff( AI_Launchpad_Task_Registry::task_ids(), $this->menu_ids() ) );

		$this->assertSame(
			array(),
			$unoffered,
			'The registry defines tasks the model is never offered, so they can only ever be backfilled: ' . implode( ', ', $unoffered )
		);
	}

	/**
	 * Every menu task annotated with exactly one goal must be restricted to that goal in PHP: the annotation
	 * is a hint for the model, GOAL_RESTRICTED_TASK_IDS is the rule.
	 */
	public function test_single_goal_annotations_are_restricted_to_that_goal() {
		$annotated = array();
		// Split on the `id:` line, so each chunk holds one task's remaining fields.
		foreach ( array_slice( preg_split( "/\bid: '/", $this->task_annotations_block() ), 1 ) as $entry ) {
			if ( preg_match( "/^([a-z0-9_]+)',.*?\bgoals: \[ '([a-z]+)' \],/s", $entry, $found ) ) {
				$annotated[ $found[1] ] = $found[2];
			}
		}
		$this->assertNotEmpty( $annotated, 'Could not parse the annotated goals from prompts.ts.' );

		foreach ( $annotated as $task_id => $goal ) {
			$this->assertArrayHasKey(
				$task_id,
				AI_Launchpad_REST::GOAL_RESTRICTED_TASK_IDS,
				"$task_id is annotated for '$goal' alone but nothing restricts it to that goal."
			);
		}
	}

	/**
	 * The task ids the prompt's table offers.
	 *
	 * @return string[]
	 */
	private function menu_ids() {
		preg_match_all( "/\bid: '([a-z0-9_]+)'/", $this->task_annotations_block(), $ids );
		$this->assertNotEmpty( $ids[1], 'Could not parse TASK_ANNOTATIONS from prompts.ts.' );

		return $ids[1];
	}

	/**
	 * The body of the TASK_ANNOTATIONS table in prompts.ts, or '' when it cannot be read.
	 *
	 * Ends on the closing `];` at column zero, so the inline `goals: [ ... ]` arrays do not end the match early.
	 *
	 * @return string
	 */
	private function task_annotations_block() {
		$path = __DIR__ . '/../../../../src/features/ai-launchpad/js/lib/prompts.ts';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local package file.
		$source = file_get_contents( $path );
		if ( false === $source || ! preg_match( '/TASK_ANNOTATIONS[^=]*=\s*\[(.*?)^\];/ms', $source, $block ) ) {
			return '';
		}

		return $block[1];
	}
}
