<?php
/**
 * Tests for the Write feature's post-publish next-steps checklist.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

// write.php provides the checklist's helpers (wpcom_write_asset_url(),
// WPCOM_WRITE_VERSION) and require_once's post-publish-checklist.php, which is
// the code under test here.
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/write/write.php';

/**
 * Exercises the post-publish checklist overlay: its visibility gate, launch URL,
 * rendered markup, asset enqueue, and localized data.
 */
class Write_Post_Publish_Checklist_Test extends \WorDBless\BaseTestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user ID (cannot launch the site).
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'ppc_admin',
				'user_pass'  => 'password',
				'user_email' => 'ppc_admin@example.com',
				'role'       => 'administrator',
			)
		);

		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'ppc_subscriber',
				'user_pass'  => 'password',
				'user_email' => 'ppc_subscriber@example.com',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		delete_option( 'wpcom_public_coming_soon' );
		unset( $_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] );
		parent::tear_down();
	}

	/**
	 * Simulate a front-end single-post request so is_singular( 'post' ) is true.
	 *
	 * @param string $post_type Post type to query for ('post' or 'page').
	 * @return int The created post ID.
	 */
	private function go_to_singular_post( $post_type = 'post' ) {
		global $wp_query, $post;

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test post',
				'post_status' => 'publish',
				'post_type'   => $post_type,
			)
		);

		$post                        = get_post( $post_id );
		$wp_query->is_singular       = true;
		$wp_query->is_single         = 'post' === $post_type;
		$wp_query->is_page           = 'page' === $post_type;
		$wp_query->queried_object    = $post;
		$wp_query->queried_object_id = $post_id;

		return $post_id;
	}

	/**
	 * The post-publish checklist should not show without the publish marker.
	 */
	public function test_post_publish_checklist_hidden_without_marker() {
		wp_set_current_user( $this->admin_id );
		update_option( 'wpcom_public_coming_soon', 1 );
		$this->go_to_singular_post();

		$this->assertFalse( wpcom_write_should_show_post_publish_checklist() );
	}

	/**
	 * The checklist should not show on a public (launched) site, even with the marker.
	 */
	public function test_post_publish_checklist_hidden_when_not_coming_soon() {
		wp_set_current_user( $this->admin_id );
		update_option( 'wpcom_public_coming_soon', 0 );
		$this->go_to_singular_post();
		$_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] = '1';

		$this->assertFalse( wpcom_write_should_show_post_publish_checklist() );
	}

	/**
	 * The checklist should not show to a user who can't launch the site.
	 */
	public function test_post_publish_checklist_hidden_without_launch_capability() {
		wp_set_current_user( $this->subscriber_id );
		update_option( 'wpcom_public_coming_soon', 1 );
		$this->go_to_singular_post();
		$_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] = '1';

		$this->assertFalse( wpcom_write_should_show_post_publish_checklist() );
	}

	/**
	 * The checklist should not show outside a single post view (e.g. on a page).
	 */
	public function test_post_publish_checklist_hidden_when_not_singular_post() {
		wp_set_current_user( $this->admin_id );
		update_option( 'wpcom_public_coming_soon', 1 );
		$this->go_to_singular_post( 'page' );
		$_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] = '1';

		$this->assertFalse( wpcom_write_should_show_post_publish_checklist() );
	}

	/**
	 * The checklist should show when marker + Coming Soon + launch capability + single post all hold.
	 */
	public function test_post_publish_checklist_shown_when_eligible() {
		wp_set_current_user( $this->admin_id );
		update_option( 'wpcom_public_coming_soon', 1 );
		$this->go_to_singular_post();
		$_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] = '1';

		$this->assertTrue( wpcom_write_should_show_post_publish_checklist() );
	}

	/**
	 * The launch task should link to Calypso's canonical launch-site flow for this site.
	 */
	public function test_post_publish_launch_url_targets_launch_site_flow() {
		$url = wpcom_write_post_publish_launch_url();

		$this->assertStringContainsString( 'https://wordpress.com/start/launch-site', $url );
		$this->assertStringContainsString( 'siteSlug=', $url );
		$host = wp_parse_url( home_url(), PHP_URL_HOST );
		$this->assertStringContainsString( rawurlencode( (string) $host ), $url );
	}

	/**
	 * The overlay markup should render (honest copy + both checklist tasks) when eligible.
	 */
	public function test_post_publish_checklist_renders_overlay_when_eligible() {
		wp_set_current_user( $this->admin_id );
		update_option( 'wpcom_public_coming_soon', 1 );
		$this->go_to_singular_post();
		$_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] = '1';

		ob_start();
		wpcom_write_render_post_publish_checklist();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'wpcom-write-ppc', $html );
		// Honest framing: states the post is private, not publicly live.
		$this->assertStringContainsString( 'still private', $html );
		// Both tasks are present.
		$this->assertStringContainsString( 'Launch your site', $html );
		$this->assertStringContainsString( 'Share your post', $html );
		// The share task is gated until launch.
		$this->assertStringContainsString( 'is-disabled', $html );
	}

	/**
	 * The overlay assets should be enqueued when the checklist is eligible to show.
	 */
	public function test_post_publish_checklist_enqueues_assets_when_eligible() {
		wp_set_current_user( $this->admin_id );
		update_option( 'wpcom_public_coming_soon', 1 );
		$this->go_to_singular_post();
		$_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] = '1';

		wpcom_write_enqueue_post_publish_checklist_assets();

		$this->assertTrue( wp_script_is( 'wpcom-write-post-publish-checklist', 'enqueued' ) );
		$this->assertTrue( wp_style_is( 'wpcom-write-post-publish-checklist', 'enqueued' ) );
	}

	/**
	 * The overlay assets should not be enqueued when the request is not eligible.
	 */
	public function test_post_publish_checklist_does_not_enqueue_when_ineligible() {
		// Start from a clean queue so a prior test's enqueue can't leak in.
		wp_dequeue_script( 'wpcom-write-post-publish-checklist' );
		wp_dequeue_style( 'wpcom-write-post-publish-checklist' );

		wp_set_current_user( $this->admin_id );
		update_option( 'wpcom_public_coming_soon', 1 );
		$this->go_to_singular_post();
		// No marker set, so the checklist is not eligible.

		wpcom_write_enqueue_post_publish_checklist_assets();

		$this->assertFalse( wp_script_is( 'wpcom-write-post-publish-checklist', 'enqueued' ) );
		$this->assertFalse( wp_style_is( 'wpcom-write-post-publish-checklist', 'enqueued' ) );
	}

	/**
	 * The overlay markup should not render when the request is not eligible.
	 */
	public function test_post_publish_checklist_renders_nothing_when_not_eligible() {
		wp_set_current_user( $this->admin_id );
		update_option( 'wpcom_public_coming_soon', 1 );
		$this->go_to_singular_post();
		// No marker set.

		ob_start();
		wpcom_write_render_post_publish_checklist();
		$html = ob_get_clean();

		$this->assertSame( '', trim( $html ) );
	}

	/**
	 * The launch-blocked flag must be localized as a '1'/'0' string the overlay
	 * can compare against — wp_localize_script() stringifies scalars, so a raw
	 * bool would arrive as '1'/'' and silently never match in JS.
	 */
	public function test_post_publish_checklist_localizes_blocked_as_string() {
		wp_set_current_user( $this->admin_id );
		update_option( 'wpcom_public_coming_soon', 1 );
		$this->go_to_singular_post();
		$_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] = '1';

		wpcom_write_enqueue_post_publish_checklist_assets();

		$data = wp_scripts()->get_data( 'wpcom-write-post-publish-checklist', 'data' );
		// Email_Verification is absent in the test env, so the gate is not blocked.
		$this->assertStringContainsString( '"blocked":"0"', $data );
	}
}
