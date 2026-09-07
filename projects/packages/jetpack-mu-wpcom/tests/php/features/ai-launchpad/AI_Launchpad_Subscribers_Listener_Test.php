<?php
/**
 * Test class for AI_Launchpad_Subscribers_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound -- the test double and its test case share this file.

require_once __DIR__ . '/fixtures/trait-seeds-ai-output.php';
require_once __DIR__ . '/fixtures/social-stubs.php';
require_once __DIR__ . '/fixtures/subscriptions-stubs.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-subscribers-listener.php';

/**
 * Test double that injects the email subscriber count instead of calling wpcom, so the completion
 * logic can be exercised without a real network request — and, through probe_real_count(), still
 * reaches the overridden parent so its parsing of fetch_subscriber_counts() can be tested against
 * the stubbed helper.
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

	/**
	 * Exposes the real (non-overridden) fetch.
	 *
	 * @return int|null
	 */
	public static function probe_real_count() {
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
	use AI_Launchpad_Seeds_AI_Output;

	/**
	 * All three subscriber tasks, seeded together so one run exercises every threshold.
	 */
	const ALL_SUBSCRIBER_TASKS = array( 'subscribers_added', 'import_subscribers', 'add_10_email_subscribers' );

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
	 * Each subscriber task completes only once the count reaches its own threshold — the "added"
	 * tasks need one subscriber, add_10_email_subscribers needs ten — and only when the request is
	 * the AI Launchpad page (the gate keeping the remote count lookup off every other admin page)
	 * and the task is AI-selected. An unavailable count (a failed fetch) completes nothing rather
	 * than counting as zero.
	 *
	 * @dataProvider provide_completion_cases
	 *
	 * @param string   $page               The `page` query arg on the request.
	 * @param string[] $selected           The AI-selected task IDs.
	 * @param int|null $count              The injected email subscriber count.
	 * @param bool     $added_complete     Whether subscribers_added / import_subscribers complete.
	 * @param bool     $first_ten_complete Whether add_10_email_subscribers completes.
	 */
	#[DataProvider( 'provide_completion_cases' )]
	public function test_subscriber_task_completion( $page, $selected, $count, $added_complete, $first_ten_complete ) {
		$task_lists   = wpcom_launchpad_checklists();
		$_GET['page'] = $page;
		AI_Launchpad_Subscribers_Listener_Test_Double::$count = $count;
		$this->seed_ai_output( $selected );

		AI_Launchpad_Subscribers_Listener_Test_Double::maybe_complete_subscriber_tasks();

		$this->assertSame( $added_complete, $task_lists->is_task_id_complete( 'subscribers_added' ) );
		$this->assertSame( $added_complete, $task_lists->is_task_id_complete( 'import_subscribers' ) );
		$this->assertSame( $first_ten_complete, $task_lists->is_task_id_complete( 'add_10_email_subscribers' ) );
	}

	/**
	 * Data provider for test_subscriber_task_completion.
	 *
	 * @return array
	 */
	public static function provide_completion_cases() {
		$page = 'site-setup-wp-admin';
		$all  = self::ALL_SUBSCRIBER_TASKS;

		return array(
			'off the launchpad page'                    => array( 'some-other-page', $all, 25, false, false ),
			'on page but the tasks are not ai-selected' => array( $page, array( 'site_launched' ), 25, false, false ),
			'unavailable count completes nothing'       => array( $page, $all, null, false, false ),
			'zero completes nothing'                    => array( $page, $all, 0, false, false ),
			'below ten completes the added tasks only'  => array( $page, $all, 9, true, false ),
			'exactly ten completes the first-ten task'  => array( $page, $all, 10, true, true ),
			'a larger count completes everything'       => array( $page, $all, 25, true, true ),
		);
	}

	/**
	 * The real fetch reads email_subscribers from Jetpack's fetch_subscriber_counts(), and treats
	 * anything it cannot read as unknown (null) rather than zero — so a transient failure never
	 * sticks a task as incomplete-forever or completes it wrongly.
	 *
	 * @dataProvider provide_fetched_counts
	 *
	 * @param mixed    $counts   The payload fetch_subscriber_counts() returns.
	 * @param int|null $expected The count the listener should read from it.
	 */
	#[DataProvider( 'provide_fetched_counts' )]
	public function test_real_fetch_parses_the_counts_payload( $counts, $expected ) {
		$GLOBALS['ai_launchpad_stub_subscriber_counts'] = $counts;

		$this->assertSame( $expected, AI_Launchpad_Subscribers_Listener_Test_Double::probe_real_count() );
	}

	/**
	 * Data provider for test_real_fetch_parses_the_counts_payload.
	 *
	 * @return array
	 */
	public static function provide_fetched_counts() {
		return array(
			'reads the email subscriber count'   => array(
				array(
					'status' => 'success',
					'value'  => array( 'email_subscribers' => 7 ),
				),
				7,
			),
			'failed status is unknown, not zero' => array(
				array(
					'status' => 'failed',
					'value'  => array( 'email_subscribers' => 7 ),
				),
				null,
			),
			'absent count is unknown'            => array( array( 'value' => array() ), null ),
		);
	}
}
