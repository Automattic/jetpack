<?php
/**
 * Test class for AI_Launchpad_Listeners.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/fixtures/trait-seeds-ai-output.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/helpers.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/class-ai-launchpad-listeners.php';

/**
 * Test class for AI_Launchpad_Listeners.
 *
 * @covers \AI_Launchpad_Listeners
 */
#[CoversClass( AI_Launchpad_Listeners::class )]
class AI_Launchpad_Listeners_Test extends \WorDBless\BaseTestCase {
	use AI_Launchpad_Seeds_AI_Output;

	/**
	 * The hook an AI-selected first_post_published task registers, and the marker this suite watches for.
	 */
	const FIRST_POST_LISTENER = 'wpcom_launchpad_track_publish_first_post_task';

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
	}

	/**
	 * Publishes a post, firing whatever listeners are registered.
	 */
	private function publish_post() {
		wp_insert_post(
			array(
				'post_title'   => 'First post',
				'post_content' => 'Hello world.',
				'post_status'  => 'publish',
			)
		);
	}

	/**
	 * A listener is registered — and publishing therefore completes the task — exactly when the AI
	 * output selects a still-incomplete task, whatever the site's legacy site_intent list says. The
	 * site_intent=build case is the GATED-completion gap: that list does not contain
	 * first_post_published, yet publishing must still complete it. Everything else (no AI output at
	 * all, a malformed option, an already-complete task) must register nothing, leaving legacy
	 * launchpad sites unchanged.
	 *
	 * @dataProvider provide_listener_states
	 *
	 * @param mixed  $ai_output        The value to write to the AI output option, or null for none.
	 * @param string $site_intent      The site's legacy site_intent.
	 * @param bool   $already_complete Whether the task is already marked complete going in.
	 * @param bool   $expect_listener  Whether a listener should be registered.
	 * @param bool   $expect_complete  Whether the task should be complete after publishing.
	 */
	#[DataProvider( 'provide_listener_states' )]
	public function test_listener_registration_and_completion( $ai_output, $site_intent, $already_complete, $expect_listener, $expect_complete ) {
		update_option( 'site_intent', $site_intent );
		if ( null !== $ai_output ) {
			update_option( 'wpcom_ai_launchpad_ai_output', $ai_output, false );
		}
		if ( $already_complete ) {
			update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );
		}

		AI_Launchpad_Listeners::add_listener_hooks_to_correct_action();

		$this->assertSame( $expect_listener, false !== has_action( 'publish_post', self::FIRST_POST_LISTENER ) );

		$this->publish_post();

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertSame( $expect_complete, ! empty( $statuses['first_post_published'] ) );
	}

	/**
	 * Data provider for test_listener_registration_and_completion.
	 *
	 * @return array
	 */
	public static function provide_listener_states() {
		$selected = self::ai_output( array( 'first_post_published' ) );

		return array(
			'ai-selected task in the legacy list'    => array( $selected, 'free', false, true, true ),
			'ai-selected task absent from that list' => array( $selected, 'build', false, true, true ),
			'no ai output (legacy launchpad site)'   => array( null, 'free', false, false, false ),
			'ai output is not an array'              => array( 'not-an-array', 'free', false, false, false ),
			'ai output carries no payload'           => array( array( 'version' => 1 ), 'free', false, false, false ),
			'ai-selected task is already complete'   => array( $selected, 'free', true, false, true ),
		);
	}

	/**
	 * REST API requests defer listener registration to the blog switch.
	 */
	public function test_rest_api_requests_defer_to_blog_switch() {
		$public_api_home_url = function () {
			return 'https://public-api.wordpress.com';
		};
		add_filter( 'home_url', $public_api_home_url );
		update_option( 'wpcom_ai_launchpad_ai_output', self::ai_output( array( 'first_post_published' ) ), false );

		AI_Launchpad_Listeners::add_listener_hooks_to_correct_action();

		remove_filter( 'home_url', $public_api_home_url );

		$this->assertFalse( has_action( 'publish_post', self::FIRST_POST_LISTENER ) );
		$this->assertNotFalse( has_action( 'rest_api_switched_to_blog', array( 'AI_Launchpad_Listeners', 'add_active_task_listeners' ) ) );

		do_action( 'rest_api_switched_to_blog' );

		$this->assertNotFalse( has_action( 'publish_post', self::FIRST_POST_LISTENER ) );
	}
}
