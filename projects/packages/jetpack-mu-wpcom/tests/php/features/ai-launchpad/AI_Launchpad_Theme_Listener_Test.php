<?php
/**
 * Test class for AI_Launchpad_Theme_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/fixtures/trait-seeds-ai-output.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/helpers.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/class-ai-launchpad-theme-listener.php';

/**
 * Test class for AI_Launchpad_Theme_Listener.
 *
 * @covers \AI_Launchpad_Theme_Listener
 */
#[CoversClass( AI_Launchpad_Theme_Listener::class )]
class AI_Launchpad_Theme_Listener_Test extends \WorDBless\BaseTestCase {
	use AI_Launchpad_Seeds_AI_Output;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
	}

	/**
	 * The switch_theme listener completes site_theme_selected exactly when the AI Launchpad is
	 * showing that task — either because the AI picked it, or because the site's goal is sell,
	 * whose list always renders a Choose-a-theme task (see AI_Launchpad_REST::get_current_tasks),
	 * including when a partial write left an inferred goal but no task list. Anything else must
	 * leave the legacy launchpad's status option untouched.
	 *
	 * @dataProvider provide_theme_outputs
	 *
	 * @param array|null $ai_output The persisted AI output, or null for no option at all.
	 * @param bool       $expected  Whether site_theme_selected should be marked complete.
	 */
	#[DataProvider( 'provide_theme_outputs' )]
	public function test_switch_theme_completion( $ai_output, $expected ) {
		if ( null !== $ai_output ) {
			update_option( 'wpcom_ai_launchpad_ai_output', $ai_output, false );
		}

		AI_Launchpad_Theme_Listener::mark_theme_selected_complete();

		$statuses = get_option( 'launchpad_checklist_tasks_statuses' );
		if ( $expected ) {
			$this->assertIsArray( $statuses );
			$this->assertTrue( $statuses['site_theme_selected'] );
		} else {
			$this->assertFalse( $statuses );
		}
	}

	/**
	 * Data provider for test_switch_theme_completion.
	 *
	 * @return array
	 */
	public static function provide_theme_outputs() {
		return array(
			'ai-selected theme task completes'          => array( self::ai_output( array( 'site_theme_selected' ) ), true ),
			'no ai output writes nothing'               => array( null, false ),
			'theme task not selected writes nothing'    => array( self::ai_output( array( 'first_post_published' ) ), false ),
			'sell goal completes the guaranteed task'   => array( self::ai_output( array( 'woo_products' ), 'sell' ), true ),
			'sell goal completes it without a tasklist' => array( self::ai_output( array(), 'sell' ), true ),
		);
	}

	/**
	 * The listener self-registers on the switch_theme action at file load.
	 */
	public function test_listener_is_registered_on_switch_theme() {
		$this->assertNotFalse( has_action( 'switch_theme', array( 'AI_Launchpad_Theme_Listener', 'mark_theme_selected_complete' ) ) );
	}
}
