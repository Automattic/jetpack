<?php
/**
 * Guards against drift between the AI Launchpad prompt's TASK_MENU (JS) and the
 * canonical launchpad task catalog (PHP).
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * The prompt offers the model a hardcoded `TASK_MENU` (js/lib/prompts.ts) while
 * titles, CTAs, and completion all resolve through the canonical catalog
 * (`wpcom_launchpad_get_task_definitions()`). The two lists are maintained
 * separately today — see the catalog-as-single-source refactor (DOTOBRD-472).
 * This test fails if the menu ever offers an ID the catalog doesn't define,
 * which would be silently dropped at `PUT /tailored` validation and GET
 * enrichment.
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
	 * Every ID in the prompt's TASK_MENU must exist in the canonical catalog.
	 */
	public function test_task_menu_is_subset_of_catalog() {
		$menu_ids = $this->parse_task_menu_ids();
		$this->assertNotEmpty( $menu_ids, 'Could not parse TASK_MENU from prompts.ts.' );

		$catalog_ids = array_keys( wpcom_launchpad_get_task_definitions() );
		$unknown     = array_values( array_diff( $menu_ids, $catalog_ids ) );

		$this->assertSame(
			array(),
			$unknown,
			'TASK_MENU offers task IDs absent from the canonical catalog (they would be dropped at validation/enrichment): ' . implode( ', ', $unknown )
		);
	}

	/**
	 * Extracts the quoted task IDs from the TASK_MENU array in prompts.ts.
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

		// Capture the array body between `TASK_MENU ... = [` and the closing `]`.
		if ( ! preg_match( '/TASK_MENU[^=]*=\s*\[(.*?)\]/s', $source, $block ) ) {
			return array();
		}

		preg_match_all( "/'([a-z0-9_]+)'/", $block[1], $ids );

		return $ids[1];
	}
}
