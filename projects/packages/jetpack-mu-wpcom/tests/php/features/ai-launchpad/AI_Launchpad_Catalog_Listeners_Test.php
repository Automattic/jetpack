<?php
/**
 * Tests for the AI Launchpad listeners that complete shared-catalog tasks.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/fixtures/trait-seeds-ai-output.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
// These listeners hook themselves in at file load, which the tests below rely on.
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-listeners.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-theme-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-subscribe-block-listener.php';

/**
 * Tests for the AI Launchpad listeners that complete shared-catalog tasks.
 *
 * @covers \AI_Launchpad_Listeners
 * @covers \AI_Launchpad_Theme_Listener
 * @covers \AI_Launchpad_Subscribe_Block_Listener
 * @covers \AI_Launchpad_About_Page_Listener
 */
#[CoversClass( AI_Launchpad_Listeners::class )]
#[CoversClass( AI_Launchpad_Theme_Listener::class )]
#[CoversClass( AI_Launchpad_Subscribe_Block_Listener::class )]
#[CoversClass( AI_Launchpad_About_Page_Listener::class )]
class AI_Launchpad_Catalog_Listeners_Test extends \WorDBless\BaseTestCase {
	use AI_Launchpad_Seeds_AI_Output;

	/**
	 * The hook an AI-selected first_post_published task registers.
	 */
	const FIRST_POST_LISTENER = 'wpcom_launchpad_track_publish_first_post_task';

	/**
	 * The block whose presence completes add_subscribe_block.
	 */
	const SUBSCRIBE_BLOCK = '<!-- wp:jetpack/subscriptions /-->';

	/**
	 * Content holding no Subscribe block.
	 */
	const PLAIN_CONTENT = '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->';

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
	}

	/**
	 * Whether a task is marked complete in the shared status option.
	 *
	 * @param string $task_id The task id.
	 * @return bool
	 */
	private static function is_marked_complete( $task_id ) {
		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		return ! empty( $statuses[ $task_id ] );
	}

	/**
	 * A catalog listener is registered, and publishing completes the task, exactly when the AI output selects
	 * a still-incomplete task, even one the site's legacy site_intent list does not contain.
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

		wp_insert_post(
			array(
				'post_title'   => 'First post',
				'post_content' => 'Hello world.',
				'post_status'  => 'publish',
			)
		);

		$this->assertSame( $expect_complete, self::is_marked_complete( 'first_post_published' ) );
	}

	/**
	 * Data provider for test_listener_registration_and_completion.
	 *
	 * @return array
	 */
	public static function provide_listener_states() {
		$selected = self::ai_output( array( 'first_post_published' ) );

		return array(
			'ai-selected task absent from the legacy list' => array( $selected, 'build', false, true, true ),
			'no ai output (legacy launchpad site)'         => array( null, 'free', false, false, false ),
			'ai output carries no payload'                 => array( array( 'version' => 1 ), 'free', false, false, false ),
			'ai-selected task is already complete'         => array( $selected, 'free', true, false, true ),
		);
	}

	/**
	 * REST API requests defer listener registration to the blog switch.
	 */
	public function test_rest_api_requests_defer_to_blog_switch() {
		add_filter(
			'home_url',
			static function () {
				return 'https://public-api.wordpress.com';
			}
		);
		update_option( 'wpcom_ai_launchpad_ai_output', self::ai_output( array( 'first_post_published' ) ), false );

		AI_Launchpad_Listeners::add_listener_hooks_to_correct_action();

		$this->assertFalse( has_action( 'publish_post', self::FIRST_POST_LISTENER ) );

		do_action( 'rest_api_switched_to_blog' );

		$this->assertNotFalse( has_action( 'publish_post', self::FIRST_POST_LISTENER ) );
	}

	/**
	 * Switching theme completes site_theme_selected exactly when the launchpad shows that task: AI-picked, or
	 * guaranteed by the sell goal even when a partial write left no task list.
	 *
	 * @dataProvider provide_theme_outputs
	 *
	 * @param array $ai_output The persisted AI output.
	 * @param bool  $expected  Whether site_theme_selected should be marked complete.
	 */
	#[DataProvider( 'provide_theme_outputs' )]
	public function test_switch_theme_completion( $ai_output, $expected ) {
		update_option( 'wpcom_ai_launchpad_ai_output', $ai_output, false );

		do_action( 'switch_theme' );

		$this->assertSame( $expected ? array( 'site_theme_selected' => true ) : false, get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * Data provider for test_switch_theme_completion.
	 *
	 * @return array
	 */
	public static function provide_theme_outputs() {
		return array(
			'ai-selected theme task completes'          => array( self::ai_output( array( 'site_theme_selected' ) ), true ),
			'theme task not selected writes nothing'    => array( self::ai_output( array( 'first_post_published' ) ), false ),
			'sell goal completes the guaranteed task'   => array( self::ai_output( array( 'woo_products' ), 'sell' ), true ),
			'sell goal completes it without a tasklist' => array( self::ai_output( array(), 'sell' ), true ),
		);
	}

	/**
	 * The Subscribe block task completes when the block reaches viewable published content or the block-widget
	 * option, and only while the task is AI-selected.
	 *
	 * @dataProvider provide_subscribe_block_saves
	 *
	 * @param string   $surface     'post' or 'widget'.
	 * @param string[] $selected    AI-selected task IDs.
	 * @param string   $content     The post or widget content.
	 * @param bool     $expected    Whether the task should complete.
	 * @param string   $post_type   The post type (post surface only).
	 * @param string   $post_status The post status (post surface only).
	 */
	#[DataProvider( 'provide_subscribe_block_saves' )]
	public function test_subscribe_block_completion_by_surface( $surface, $selected, $content, $expected, $post_type = 'post', $post_status = 'publish' ) {
		$this->seed_ai_output( $selected );

		if ( 'post' === $surface ) {
			wp_insert_post(
				array(
					'post_title'   => 'Test',
					'post_content' => $content,
					'post_status'  => $post_status,
					'post_type'    => $post_type,
				)
			);
		} else {
			// Create the option first, so the save below takes the update path the block-widget editor uses.
			update_option( 'widget_block', array() );
			update_option(
				'widget_block',
				array(
					2              => array( 'content' => $content ),
					'_multiwidget' => 1,
				)
			);
		}

		$this->assertSame( $expected, self::is_marked_complete( 'add_subscribe_block' ) );
	}

	/**
	 * Data provider for test_subscribe_block_completion_by_surface.
	 *
	 * @return array
	 */
	public static function provide_subscribe_block_saves() {
		$selected     = array( 'add_subscribe_block' );
		$not_selected = array( 'first_post_published' );

		return array(
			'published post with the block'        => array( 'post', $selected, self::SUBSCRIBE_BLOCK, true ),
			'draft with the block is ignored'      => array( 'post', $selected, self::SUBSCRIBE_BLOCK, false, 'post', 'draft' ),
			'published page without the block'     => array( 'post', $selected, self::PLAIN_CONTENT, false, 'page' ),
			'synced pattern is not viewable'       => array( 'post', $selected, self::SUBSCRIBE_BLOCK, false, 'wp_block' ),
			'post while task is not ai-selected'   => array( 'post', $not_selected, self::SUBSCRIBE_BLOCK, false ),
			'block widget with the block'          => array( 'widget', $selected, self::SUBSCRIBE_BLOCK, true ),
			'block widget without the block'       => array( 'widget', $selected, self::PLAIN_CONTENT, false ),
			'widget while task is not ai-selected' => array( 'widget', $not_selected, self::SUBSCRIBE_BLOCK, false ),
		);
	}

	/**
	 * The marked AI About page completes add_about_page on its first publish and update_about_page on a later
	 * edit; an unmarked page, or a task the AI did not select, completes nothing.
	 *
	 * @dataProvider provide_about_page_transitions
	 *
	 * @param bool        $marked         Whether the page carries the marker meta.
	 * @param string[]    $selected       The AI-selected task IDs.
	 * @param string      $old_status     The status the page is transitioning from.
	 * @param string|null $completed_task The task expected to complete, or null for neither.
	 */
	#[DataProvider( 'provide_about_page_transitions' )]
	public function test_completes_about_tasks_on_marked_page_transitions( $marked, $selected, $old_status, $completed_task ) {
		$this->seed_ai_output( $selected );
		$page_id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'About',
			)
		);
		if ( $marked ) {
			update_post_meta( $page_id, AI_Launchpad_About_Page_Listener::META_KEY, true );
		}

		AI_Launchpad_About_Page_Listener::maybe_complete( 'publish', $old_status, get_post( $page_id ) );

		$this->assertSame( 'add_about_page' === $completed_task, self::is_marked_complete( 'add_about_page' ) );
		$this->assertSame( 'update_about_page' === $completed_task, self::is_marked_complete( 'update_about_page' ) );
	}

	/**
	 * Data provider for test_completes_about_tasks_on_marked_page_transitions.
	 *
	 * @return array
	 */
	public static function provide_about_page_transitions() {
		$both = array( 'add_about_page', 'update_about_page' );

		return array(
			'first publish of the marked page'   => array( true, $both, 'draft', 'add_about_page' ),
			'later edit of the published page'   => array( true, $both, 'publish', 'update_about_page' ),
			'an unmarked page completes nothing' => array( false, $both, 'draft', null ),
			'the task was not ai-selected'       => array( true, array( 'site_launched' ), 'draft', null ),
		);
	}
}
