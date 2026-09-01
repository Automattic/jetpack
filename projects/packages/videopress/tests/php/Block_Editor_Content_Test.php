<?php
/**
 * Tests for the `videopress_guid` hand-off into a brand-new post or page.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;

/**
 * Covers `Block_Editor_Content::videopress_video_block_by_guid()` — the server
 * half of the dashboard's "Add to a post or page" menu — and the hook
 * registration that decides whether it ever runs.
 */
class Block_Editor_Content_Test extends BaseTestCase {

	const GUID = 'aBcD1234';

	/**
	 * Reset everything the filter reads.
	 */
	protected function tear_down() {
		remove_all_filters( 'default_content' );
		unset( $_GET['videopress_guid'], $_GET['_wpnonce'] );
		wp_set_current_user( 0 );
		\WorDBless\Posts::init()->clear_all_posts();
	}

	/**
	 * Sign in as a new user with the given role.
	 *
	 * @param string $role Role slug.
	 * @return int The user id.
	 */
	private function login_as( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $role . '_user',
				'user_pass'  => 'pass',
				'user_email' => $role . '@test.com',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );

		return (int) $user_id;
	}

	/**
	 * Stand in for the auto-draft `get_default_post_to_edit()` creates before it
	 * applies `default_content`.
	 *
	 * @param int $author_id Author of the draft.
	 * @return \WP_Post The draft post.
	 */
	private function create_auto_draft( $author_id ) {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Auto Draft',
				'post_status' => 'auto-draft',
				'post_author' => $author_id,
			)
		);

		return get_post( $post_id );
	}

	/**
	 * Put a valid request on `$_GET`, exactly as the dashboard menu builds it.
	 */
	private function seed_request() {
		$_GET['videopress_guid'] = self::GUID;
		$_GET['_wpnonce']        = wp_create_nonce( 'videopress-content-nonce' );
	}

	/**
	 * The hand-off has nothing to do with the shortcodes the rest of `init()`
	 * registers, and must not inherit their standalone-plugin guard: on a site
	 * running the Jetpack plugin the dashboard, the menu and the nonce all ship,
	 * so a missing filter means every "New post" opens an empty editor.
	 */
	public function test_init_registers_the_default_content_filter_without_the_standalone_plugin() {
		// The premise: the standalone plugin's entry class is absent here, as it
		// is on any site running VideoPress through the Jetpack plugin.
		$this->assertFalse( Status::is_standalone_plugin_active() );

		Block_Editor_Content::init();

		$this->assertSame(
			10,
			has_filter( 'default_content', array( Block_Editor_Content::class, 'videopress_video_block_by_guid' ) )
		);
	}

	/**
	 * The happy path: a valid request turns the empty default content into a
	 * VideoPress block carrying the guid.
	 */
	public function test_fills_empty_content_with_the_video_block() {
		$author = $this->login_as( 'administrator' );
		$post   = $this->create_auto_draft( $author );
		$this->seed_request();

		$content = Block_Editor_Content::videopress_video_block_by_guid( '', $post );

		$this->assertStringContainsString( '<!-- wp:videopress/video {"guid":"' . self::GUID . '"} -->', $content );
		$this->assertStringContainsString( 'https://videopress.com/v/' . self::GUID, $content );
		$this->assertStringContainsString( '<!-- /wp:videopress/video -->', $content );
	}

	/**
	 * Condition 1: no guid, nothing to insert.
	 */
	public function test_leaves_content_alone_without_a_guid() {
		$author = $this->login_as( 'administrator' );
		$post   = $this->create_auto_draft( $author );
		$this->seed_request();
		unset( $_GET['videopress_guid'] );

		$this->assertSame( '', Block_Editor_Content::videopress_video_block_by_guid( '', $post ) );
	}

	/**
	 * Condition 2: the nonce is verified against `videopress-content-nonce`, the
	 * same action `Initial_State`/`Admin_UI` mint it for.
	 */
	public function test_leaves_content_alone_with_a_nonce_for_another_action() {
		$author = $this->login_as( 'administrator' );
		$post   = $this->create_auto_draft( $author );
		$this->seed_request();
		$_GET['_wpnonce'] = wp_create_nonce( 'some-other-action' );

		$this->assertSame( '', Block_Editor_Content::videopress_video_block_by_guid( '', $post ) );
	}

	/**
	 * Condition 3: a user who cannot edit the draft gets nothing.
	 */
	public function test_leaves_content_alone_for_a_user_who_cannot_edit_the_post() {
		$author = $this->login_as( 'administrator' );
		$post   = $this->create_auto_draft( $author );
		$this->login_as( 'subscriber' );
		$this->seed_request();

		$this->assertSame( '', Block_Editor_Content::videopress_video_block_by_guid( '', $post ) );
	}

	/**
	 * Condition 4: content another filter (or `?content=`) already supplied is
	 * never overwritten.
	 */
	public function test_leaves_prefilled_content_alone() {
		$author = $this->login_as( 'administrator' );
		$post   = $this->create_auto_draft( $author );
		$this->seed_request();

		$this->assertSame(
			'Already written.',
			Block_Editor_Content::videopress_video_block_by_guid( 'Already written.', $post )
		);
	}
}
