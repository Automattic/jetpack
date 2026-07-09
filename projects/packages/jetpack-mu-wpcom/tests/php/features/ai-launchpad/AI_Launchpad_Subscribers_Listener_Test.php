<?php
/**
 * Test class for AI_Launchpad_Subscribers_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound -- the test double and its test case share this file.

require_once __DIR__ . '/fixtures/social-stubs.php';
require_once __DIR__ . '/fixtures/subscriptions-stubs.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-subscribers-listener.php';

/**
 * Test double that injects the email subscriber count instead of calling wpcom,
 * so the completion logic can be exercised without a real network request.
 */
class AI_Launchpad_Subscribers_Listener_Test_Double extends AI_Launchpad_Subscribers_Listener {
	/**
	 * Count returned by the overridden fetch (null = fetch failed/unavailable).
	 *
	 * @var int|null
	 */
	public static $count = null;

	/**
	 * Overrides the remote fetch with the injected value.
	 *
	 * @return int|null
	 */
	protected static function get_email_subscriber_count() {
		return self::$count;
	}
}

/**
 * Probe that exposes the real (non-overridden) fetch so its parsing of
 * fetch_subscriber_counts() can be tested against the stubbed helper.
 */
class AI_Launchpad_Subscribers_Listener_Real_Probe extends AI_Launchpad_Subscribers_Listener {
	/**
	 * @return int|null
	 */
	public static function probe() {
		return parent::get_email_subscriber_count();
	}
}

/**
 * Test class for AI_Launchpad_Subscribers_Listener.
 *
 * @covers \AI_Launchpad_Subscribers_Listener
 */
#[CoversClass( AI_Launchpad_Subscribers_Listener::class )]
class AI_Launchpad_Subscribers_Listener_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
		AI_Launchpad_Subscribers_Listener_Test_Double::$count = null;
		$_GET['page'] = 'site-setup-wp-admin';
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		unset( $_GET['page'] );
		parent::tear_down();
	}

	/**
	 * Seeds the AI output option so the given task IDs are reported as selected.
	 *
	 * @param string[] $task_ids Task IDs to seed.
	 */
	private function seed_tasks( array $task_ids ) {
		$tasks = array_map(
			static function ( $id ) {
				return array(
					'id'       => $id,
					'subtitle' => 'Subtitle.',
				);
			},
			$task_ids
		);
		update_option(
			'wpcom_ai_launchpad_ai_output',
			array( 'payload' => array( 'tasks' => $tasks ) ),
			false
		);
	}

	/**
	 * The subscriber-count fetch only runs, and tasks only complete, when the
	 * request is the AI Launchpad page and the tasks are AI-selected.
	 */
	public function test_completes_only_when_selected_and_on_page() {
		$task_lists = wpcom_launchpad_checklists();

		// A non-zero count is available for all the negative cases below.
		AI_Launchpad_Subscribers_Listener_Test_Double::$count = 25;

		// Off the launchpad page: nothing completes.
		$_GET['page'] = 'some-other-page';
		$this->seed_tasks( array( 'subscribers_added', 'import_subscribers', 'add_10_email_subscribers' ) );
		AI_Launchpad_Subscribers_Listener_Test_Double::maybe_complete_subscriber_tasks();
		$this->assertFalse( $task_lists->is_task_id_complete( 'subscribers_added' ) );
		$this->assertFalse( $task_lists->is_task_id_complete( 'add_10_email_subscribers' ) );

		// On-page, but the tasks are not AI-selected: still nothing.
		$_GET['page'] = 'site-setup-wp-admin';
		$this->seed_tasks( array( 'site_launched' ) );
		AI_Launchpad_Subscribers_Listener_Test_Double::maybe_complete_subscriber_tasks();
		$this->assertFalse( $task_lists->is_task_id_complete( 'subscribers_added' ) );
		$this->assertFalse( $task_lists->is_task_id_complete( 'add_10_email_subscribers' ) );

		// On-page + selected: the tasks complete.
		$this->seed_tasks( array( 'subscribers_added', 'import_subscribers', 'add_10_email_subscribers' ) );
		AI_Launchpad_Subscribers_Listener_Test_Double::maybe_complete_subscriber_tasks();
		$this->assertTrue( $task_lists->is_task_id_complete( 'subscribers_added' ) );
		$this->assertTrue( $task_lists->is_task_id_complete( 'import_subscribers' ) );
		$this->assertTrue( $task_lists->is_task_id_complete( 'add_10_email_subscribers' ) );
	}

	/**
	 * When the count is unavailable (fetch failed), nothing completes.
	 */
	public function test_no_completion_when_count_unavailable() {
		$task_lists = wpcom_launchpad_checklists();
		AI_Launchpad_Subscribers_Listener_Test_Double::$count = null;
		$this->seed_tasks( array( 'subscribers_added', 'add_10_email_subscribers' ) );

		AI_Launchpad_Subscribers_Listener_Test_Double::maybe_complete_subscriber_tasks();

		$this->assertFalse( $task_lists->is_task_id_complete( 'subscribers_added' ) );
		$this->assertFalse( $task_lists->is_task_id_complete( 'add_10_email_subscribers' ) );
	}

	/**
	 * A zero count completes nothing.
	 */
	public function test_zero_count_completes_nothing() {
		$task_lists = wpcom_launchpad_checklists();
		AI_Launchpad_Subscribers_Listener_Test_Double::$count = 0;
		$this->seed_tasks( array( 'subscribers_added', 'import_subscribers', 'add_10_email_subscribers' ) );

		AI_Launchpad_Subscribers_Listener_Test_Double::maybe_complete_subscriber_tasks();

		$this->assertFalse( $task_lists->is_task_id_complete( 'subscribers_added' ) );
		$this->assertFalse( $task_lists->is_task_id_complete( 'add_10_email_subscribers' ) );
	}

	/**
	 * A count of at least one but below ten completes the "added" tasks only;
	 * add_10_email_subscribers needs ten.
	 */
	public function test_count_below_ten_completes_added_only() {
		$task_lists = wpcom_launchpad_checklists();
		AI_Launchpad_Subscribers_Listener_Test_Double::$count = 9;
		$this->seed_tasks( array( 'subscribers_added', 'import_subscribers', 'add_10_email_subscribers' ) );

		AI_Launchpad_Subscribers_Listener_Test_Double::maybe_complete_subscriber_tasks();

		$this->assertTrue( $task_lists->is_task_id_complete( 'subscribers_added' ) );
		$this->assertTrue( $task_lists->is_task_id_complete( 'import_subscribers' ) );
		$this->assertFalse( $task_lists->is_task_id_complete( 'add_10_email_subscribers' ) );
	}

	/**
	 * A count of exactly ten completes add_10_email_subscribers too.
	 */
	public function test_count_of_ten_completes_first_ten_task() {
		$task_lists = wpcom_launchpad_checklists();
		AI_Launchpad_Subscribers_Listener_Test_Double::$count = 10;
		$this->seed_tasks( array( 'add_10_email_subscribers' ) );

		AI_Launchpad_Subscribers_Listener_Test_Double::maybe_complete_subscriber_tasks();

		$this->assertTrue( $task_lists->is_task_id_complete( 'add_10_email_subscribers' ) );
	}

	/**
	 * The real fetch reads email_subscribers from Jetpack's fetch_subscriber_counts().
	 */
	public function test_real_fetch_returns_email_subscriber_count() {
		$GLOBALS['ai_launchpad_stub_subscriber_counts'] = array(
			'status' => 'success',
			'value'  => array( 'email_subscribers' => 7 ),
		);
		$this->assertSame( 7, AI_Launchpad_Subscribers_Listener_Real_Probe::probe() );
	}

	/**
	 * A failed counts lookup is treated as unknown (null), not zero, so a transient
	 * failure never sticks a task as incomplete-forever or completes it wrongly.
	 */
	public function test_real_fetch_returns_null_on_failed_status() {
		$GLOBALS['ai_launchpad_stub_subscriber_counts'] = array(
			'status' => 'failed',
			'value'  => array( 'email_subscribers' => 7 ),
		);
		$this->assertNull( AI_Launchpad_Subscribers_Listener_Real_Probe::probe() );
	}

	/**
	 * A counts payload missing the email_subscribers key is unknown (null).
	 */
	public function test_real_fetch_returns_null_when_count_absent() {
		$GLOBALS['ai_launchpad_stub_subscriber_counts'] = array( 'value' => array() );
		$this->assertNull( AI_Launchpad_Subscribers_Listener_Real_Probe::probe() );
	}
}
