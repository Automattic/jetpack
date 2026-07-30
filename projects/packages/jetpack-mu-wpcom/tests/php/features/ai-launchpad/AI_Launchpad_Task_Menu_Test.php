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
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-contact-page-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-events-page-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-video-page-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-portfolio-piece-listener.php';
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
		preg_match_all( "/\bid: '([a-z0-9_]+)'/", $this->task_annotations_block(), $ids );
		$menu_ids = $ids[1];
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
	 * Every task the registry defines must be annotated on the menu.
	 *
	 * The registry exists to make a task AI-selectable, and the only way the model can select one is to see it
	 * in the annotated menu. A registry entry missing from the table is a task that builds, renders, completes
	 * and is never once offered — the failure is silent in every other test, because each half works.
	 *
	 * The reverse direction is deliberately not asserted: the menu is mostly catalog ids, and
	 * test_task_menu_is_subset_of_catalog_or_registry already covers ids from neither source.
	 */
	public function test_every_registry_task_is_offered_on_the_menu() {
		preg_match_all( "/\bid: '([a-z0-9_]+)'/", $this->task_annotations_block(), $ids );
		$this->assertNotEmpty( $ids[1], 'Could not parse TASK_ANNOTATIONS from prompts.ts.' );

		$unoffered = array_values( array_diff( AI_Launchpad_Task_Registry::task_ids(), $ids[1] ) );

		$this->assertSame(
			array(),
			$unoffered,
			'The registry defines tasks the model is never offered, so they can only ever be backfilled: ' . implode( ', ', $unoffered )
		);
	}

	/**
	 * Every menu task annotated with exactly one goal must be restricted to that goal in PHP.
	 *
	 * The annotation is soft affinity for the model; GOAL_RESTRICTED_TASK_IDS is the rule. A single-goal
	 * annotation with no matching entry means a task the annotation itself calls goal-specific can be
	 * picked and persisted on any goal — the inappropriate-task problem in miniature. Derived from the
	 * table rather than listed here, so a newly annotated task cannot quietly skip the map.
	 *
	 * Entries are split on the `id:` line, so each chunk holds one task's remaining fields; a chunk whose
	 * `goals` array has a single element is what this looks for. Multi-goal annotations are deliberately
	 * ignored: they are affinity hints for the model, not claims that the task belongs to one goal.
	 */
	public function test_single_goal_annotations_are_restricted_to_that_goal() {
		$annotated = array();
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
	 * The body of the TASK_ANNOTATIONS table in prompts.ts, or '' when it cannot be read.
	 *
	 * The table body is terminated on the closing `];` at column zero, so the inline `goals: [ ... ]`
	 * arrays inside entries do not end the match early.
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
