<?php
/**
 * Test class for AI_Launchpad_Social_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 *
 * @phan-file-suppress PhanUndeclaredClassStaticProperty -- The Publicize stubs are aliased onto the real (Jetpack-plugin) class names at runtime; phan can't see the aliased static props.
 */

use Automattic\Jetpack\Publicize\Connections;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/fixtures/trait-seeds-ai-output.php';
require_once __DIR__ . '/fixtures/social-stubs.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-social-listener.php';

/**
 * Test class for AI_Launchpad_Social_Listener.
 *
 * @covers \AI_Launchpad_Social_Listener
 */
#[CoversClass( AI_Launchpad_Social_Listener::class )]
class AI_Launchpad_Social_Listener_Test extends \WorDBless\BaseTestCase {
	use AI_Launchpad_Seeds_AI_Output;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
		Connections::$all = array();
		$_GET['page']     = 'site-setup-wp-admin';
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		unset( $_GET['page'] );
		parent::tear_down();
	}

	/**
	 * A social task completes only when it is AI-selected, a Publicize connection exists, and the
	 * request is the AI Launchpad page (the gate keeping the connection lookup off every other
	 * admin page). All three conditions are required.
	 *
	 * An output persisted before the post_sharing_enabled remap counts as selecting
	 * connect_social_media: post_sharing_enabled used to be born-completed off the always-on
	 * module-active signal, which the listener no longer consults, so it completes on the
	 * connection signal alone — as the task the card actually renders as.
	 *
	 * @dataProvider provide_social_cases
	 *
	 * @param string[] $selected       The AI-selected task IDs.
	 * @param bool     $has_connection Whether a Publicize connection exists.
	 * @param string   $page           The `page` query arg on the request.
	 * @param bool     $expected       Whether the connection task should complete.
	 */
	#[DataProvider( 'provide_social_cases' )]
	public function test_social_task_completion( $selected, $has_connection, $page, $expected ) {
		$_GET['page']     = $page;
		Connections::$all = $has_connection ? array( array( 'connection_id' => '1' ) ) : array();
		$this->seed_ai_output( $selected );

		AI_Launchpad_Social_Listener::maybe_complete_social_tasks();

		$task_lists = wpcom_launchpad_checklists();
		$this->assertSame( $expected, $task_lists->is_task_id_complete( 'connect_social_media' ) );
		$this->assertSame( $expected, $task_lists->is_task_id_complete( 'drive_traffic' ) );
		// post_sharing_enabled is never completed in its own right: the always-true module-active
		// signal that used to born-complete it is no longer consulted. DOCUMENTED INVARIANT, NOT
		// LIVE COVERAGE — the remap in wpcom_ai_launchpad_get_ai_task_ids() rewrites the id to
		// connect_social_media before the listener sees it, so no single-point change here can
		// make this fail (adding the id back to the listener's completion set leaves it green).
		// The remap itself is what guards the regression, and the pre-remap cases below cover it.
		$this->assertFalse( $task_lists->is_task_id_complete( 'post_sharing_enabled' ) );
	}

	/**
	 * Data provider for test_social_task_completion.
	 *
	 * @return array
	 */
	public static function provide_social_cases() {
		$page   = 'site-setup-wp-admin';
		$social = array( 'connect_social_media', 'drive_traffic' );

		return array(
			'selected and on page but no connection'      => array( $social, false, $page, false ),
			'connected and selected but off the page'     => array( $social, true, 'some-other-page', false ),
			'connected and on page but not selected'      => array( array( 'site_launched' ), true, $page, false ),
			'all three conditions met'                    => array( $social, true, $page, true ),
			'pre-remap post_sharing without a connection' => array( array( 'post_sharing_enabled' ), false, $page, false ),
			'pre-remap post_sharing with a connection'    => array( array( 'post_sharing_enabled' ), true, $page, true ),
		);
	}
}
