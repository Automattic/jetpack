<?php
/**
 * Test class for AI_Launchpad_Subscribe_Block_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/fixtures/trait-seeds-ai-output.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/helpers.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/class-ai-launchpad-subscribe-block-listener.php';

/**
 * Test class for AI_Launchpad_Subscribe_Block_Listener.
 *
 * @covers \AI_Launchpad_Subscribe_Block_Listener
 */
#[CoversClass( AI_Launchpad_Subscribe_Block_Listener::class )]
class AI_Launchpad_Subscribe_Block_Listener_Test extends \WorDBless\BaseTestCase {
	use AI_Launchpad_Seeds_AI_Output;

	/**
	 * The block whose presence completes the task.
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
	 * The task completes when the Subscribe block reaches a surface that actually renders a
	 * subscribe form, and only while the task is AI-selected — the legacy launchpad must stay
	 * untouched. The two surfaces are gated separately in the listener: `save_post` for
	 * front-end-viewable published content (drafts, blockless content and non-viewable types such
	 * as synced patterns are skipped), and the block-widget option, the classic-theme CTA target,
	 * whose saves never fire `save_post` at all.
	 *
	 * @dataProvider provide_saves
	 *
	 * @param string        $surface     'post' or 'widget'.
	 * @param string[]|null $selected    AI-selected task IDs, or null for no AI output at all.
	 * @param string        $content     The post or widget content.
	 * @param bool          $expected    Whether the task should complete.
	 * @param string        $post_type   The post type (post surface only).
	 * @param string        $post_status The post status (post surface only).
	 */
	#[DataProvider( 'provide_saves' )]
	public function test_completion_by_surface( $surface, $selected, $content, $expected, $post_type = 'post', $post_status = 'publish' ) {
		if ( null !== $selected ) {
			$this->seed_ai_output( $selected );
		}

		if ( 'post' === $surface ) {
			$post_id = wp_insert_post(
				array(
					'post_title'   => 'Test',
					'post_content' => $content,
					'post_status'  => $post_status,
					'post_type'    => $post_type,
				)
			);
			AI_Launchpad_Subscribe_Block_Listener::maybe_complete_from_post( $post_id, get_post( $post_id ) );
		} else {
			AI_Launchpad_Subscribe_Block_Listener::maybe_complete_from_widget(
				null,
				array(
					2              => array( 'content' => $content ),
					'_multiwidget' => 1,
				)
			);
		}

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertSame( $expected, ! empty( $statuses['add_subscribe_block'] ) );
	}

	/**
	 * Data provider for test_completion_by_surface.
	 *
	 * @return array
	 */
	public static function provide_saves() {
		$selected     = array( 'add_subscribe_block' );
		$not_selected = array( 'first_post_published' );

		return array(
			'published post with the block'        => array( 'post', $selected, self::SUBSCRIBE_BLOCK, true ),
			'draft with the block is ignored'      => array( 'post', $selected, self::SUBSCRIBE_BLOCK, false, 'post', 'draft' ),
			'published page without the block'     => array( 'post', $selected, self::PLAIN_CONTENT, false, 'page' ),
			'synced pattern is not viewable'       => array( 'post', $selected, self::SUBSCRIBE_BLOCK, false, 'wp_block' ),
			'post while task is not ai-selected'   => array( 'post', $not_selected, self::SUBSCRIBE_BLOCK, false ),
			'post without any ai output'           => array( 'post', null, self::SUBSCRIBE_BLOCK, false ),
			'block widget with the block'          => array( 'widget', $selected, self::SUBSCRIBE_BLOCK, true ),
			'block widget without the block'       => array( 'widget', $selected, self::PLAIN_CONTENT, false ),
			'widget while task is not ai-selected' => array( 'widget', $not_selected, self::SUBSCRIBE_BLOCK, false ),
			'widget without any ai output'         => array( 'widget', null, self::SUBSCRIBE_BLOCK, false ),
		);
	}

	/**
	 * The listener self-registers its watchers at file load.
	 */
	public function test_listener_is_registered() {
		$this->assertNotFalse( has_action( 'save_post', array( 'AI_Launchpad_Subscribe_Block_Listener', 'maybe_complete_from_post' ) ) );
		$this->assertNotFalse( has_action( 'update_option_widget_block', array( 'AI_Launchpad_Subscribe_Block_Listener', 'maybe_complete_from_widget' ) ) );
	}
}
