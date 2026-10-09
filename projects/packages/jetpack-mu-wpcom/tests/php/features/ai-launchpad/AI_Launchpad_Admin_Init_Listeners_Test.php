<?php
/**
 * Tests for the AI Launchpad listeners that reconcile remote signals when the launchpad page loads.
 *
 * @package automattic/jetpack-mu-wpcom
 *
 * @phan-file-suppress PhanUndeclaredClassStaticProperty -- The Publicize stubs are aliased onto the real (Jetpack-plugin) class names at runtime; phan can't see the aliased static props.
 */

use Automattic\Jetpack\Publicize\Connections;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound -- the test double and its test case share this file.

require_once __DIR__ . '/fixtures/trait-seeds-ai-output.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';
require_once __DIR__ . '/fixtures/social-stubs.php';
require_once __DIR__ . '/fixtures/subscriptions-stubs.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';

/**
 * Injects the subscriber count instead of calling wpcom, and still exposes the real fetch for its own test.
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
 * Tests for the AI Launchpad listeners that reconcile remote signals when the launchpad page loads.
 *
 * @covers \AI_Launchpad_Social_Listener
 * @covers \AI_Launchpad_Subscribers_Listener
 */
#[CoversClass( AI_Launchpad_Social_Listener::class )]
#[CoversClass( AI_Launchpad_Subscribers_Listener::class )]
class AI_Launchpad_Admin_Init_Listeners_Test extends \WorDBless\BaseTestCase {
	use AI_Launchpad_Seeds_AI_Output;

	/**
	 * The AI Launchpad page slug the listeners gate on.
	 */
	const PAGE = 'site-setup-wp-admin';

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
		Connections::$all                                     = array();
		AI_Launchpad_Subscribers_Listener_Test_Double::$count = null;
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		unset( $_GET['page'] );
		parent::tear_down();
	}

	/**
	 * A social task completes only when it is AI-selected, a Publicize connection exists, and the request is
	 * the AI Launchpad page; a pre-remap post_sharing_enabled pick counts as connect_social_media.
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
	}

	/**
	 * Data provider for test_social_task_completion.
	 *
	 * @return array
	 */
	public static function provide_social_cases() {
		$social = array( 'connect_social_media', 'drive_traffic' );

		return array(
			'selected and on page but no connection'   => array( $social, false, self::PAGE, false ),
			'connected and selected but off the page'  => array( $social, true, 'some-other-page', false ),
			'connected and on page but not selected'   => array( array( 'site_launched' ), true, self::PAGE, false ),
			'all three conditions met'                 => array( $social, true, self::PAGE, true ),
			'pre-remap post_sharing with a connection' => array( array( 'post_sharing_enabled' ), true, self::PAGE, true ),
		);
	}

	/**
	 * Each subscriber task completes once the count reaches its threshold (one, or ten for
	 * add_10_email_subscribers), only on the AI Launchpad page and only while AI-selected.
	 *
	 * @dataProvider provide_subscriber_cases
	 *
	 * @param string   $page               The `page` query arg on the request.
	 * @param string[] $selected           The AI-selected task IDs.
	 * @param int      $count              The injected email subscriber count.
	 * @param bool     $added_complete     Whether subscribers_added / import_subscribers complete.
	 * @param bool     $first_ten_complete Whether add_10_email_subscribers completes.
	 */
	#[DataProvider( 'provide_subscriber_cases' )]
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
	public static function provide_subscriber_cases() {
		$all = self::ALL_SUBSCRIBER_TASKS;

		return array(
			'off the launchpad page'                    => array( 'some-other-page', $all, 25, false, false ),
			'on page but the tasks are not ai-selected' => array( self::PAGE, array( 'site_launched' ), 25, false, false ),
			'zero completes nothing'                    => array( self::PAGE, $all, 0, false, false ),
			'below ten completes the added tasks only'  => array( self::PAGE, $all, 9, true, false ),
			'exactly ten completes the first-ten task'  => array( self::PAGE, $all, 10, true, true ),
			'a larger count completes everything'       => array( self::PAGE, $all, 25, true, true ),
		);
	}

	/**
	 * The real fetch reads email_subscribers from fetch_subscriber_counts(), and anything it cannot read is
	 * unknown (null) rather than zero.
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
