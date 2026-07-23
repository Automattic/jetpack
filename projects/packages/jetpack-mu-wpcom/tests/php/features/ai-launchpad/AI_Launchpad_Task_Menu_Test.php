<?php
/**
 * Guards against drift between the AI Launchpad prompt's annotated task table (JS) and the
 * canonical launchpad task catalog (PHP).
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-gallery-page-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-task-registry.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-rest.php';

/**
 * The prompt offers the model a hardcoded `TASK_ANNOTATIONS` table (js/lib/prompts.ts)
 * while titles, CTAs, and completion resolve through the canonical catalog
 * (`wpcom_launchpad_get_task_definitions()`) or, for the AI Launchpad's own tasks,
 * `AI_Launchpad_Task_Registry`. The lists are maintained separately today — see the
 * catalog-as-single-source refactor (DOTOBRD-472). This test fails if the menu ever offers
 * an ID neither source defines, which would be silently dropped at `PUT /tailored`
 * validation and GET enrichment.
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
		$menu_ids = $this->parse_task_menu_ids();
		$this->assertNotEmpty( $menu_ids, 'Could not parse TASK_ANNOTATIONS from prompts.ts.' );

		$known   = array_merge(
			array_keys( wpcom_launchpad_get_task_definitions() ),
			AI_Launchpad_Task_Registry::task_ids()
		);
		$unknown = array_values( array_diff( $menu_ids, $known ) );

		$this->assertSame(
			array(),
			$unknown,
			'The task table offers IDs defined by neither the catalog nor the AI Launchpad registry (they would be dropped at validation/enrichment): ' . implode( ', ', $unknown )
		);
	}

	/**
	 * Every menu task annotated with exactly one goal must be restricted to that goal in PHP.
	 *
	 * The annotation is soft affinity for the model; GOAL_RESTRICTED_TASK_IDS is the rule. A single-goal
	 * annotation with no matching entry means a task the annotation itself calls goal-specific can be
	 * picked and persisted on any goal — the inappropriate-task problem in miniature. Derived from the
	 * table rather than listed here, so a newly annotated task cannot quietly skip the map.
	 */
	public function test_single_goal_annotations_are_restricted_to_that_goal() {
		$annotated = $this->parse_single_goal_annotations();
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
	 * Extracts the task IDs from the TASK_ANNOTATIONS table in prompts.ts.
	 *
	 * The table body is terminated on the closing `];` at column zero, so the inline `goals: [ ... ]`
	 * arrays inside entries do not end the match early.
	 *
	 * @return string[]
	 */
	private function parse_task_menu_ids() {
		$path = __DIR__ . '/../../../../src/features/ai-launchpad/js/lib/prompts.ts';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local package file.
		$source = file_get_contents( $path );
		if ( false === $source ) {
			return array();
		}

		if ( ! preg_match( '/TASK_ANNOTATIONS[^=]*=\s*\[(.*?)^\];/ms', $source, $block ) ) {
			return array();
		}

		preg_match_all( "/\bid: '([a-z0-9_]+)'/", $block[1], $ids );

		return $ids[1];
	}

	/**
	 * Extracts the ids annotated with exactly one goal, keyed to that goal.
	 *
	 * Entries are split on the `id:` line, so each chunk holds one task's remaining fields; a chunk whose
	 * `goals` array has a single element is what this looks for. Multi-goal annotations are deliberately
	 * ignored: they are affinity hints for the model, not claims that the task belongs to one goal.
	 *
	 * @return array<string, string> Task id => the single goal it is annotated with.
	 */
	private function parse_single_goal_annotations() {
		$path = __DIR__ . '/../../../../src/features/ai-launchpad/js/lib/prompts.ts';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local package file.
		$source = file_get_contents( $path );
		if ( false === $source || ! preg_match( '/TASK_ANNOTATIONS[^=]*=\s*\[(.*?)^\];/ms', $source, $block ) ) {
			return array();
		}

		$annotated = array();
		foreach ( array_slice( preg_split( "/\bid: '/", $block[1] ), 1 ) as $entry ) {
			if ( preg_match( "/^([a-z0-9_]+)',.*?\bgoals: \[ '([a-z]+)' \],/s", $entry, $found ) ) {
				$annotated[ $found[1] ] = $found[2];
			}
		}

		return $annotated;
	}
}
