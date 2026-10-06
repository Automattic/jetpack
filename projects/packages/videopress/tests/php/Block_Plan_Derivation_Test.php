<?php
/**
 * Tests for server-side derivation of the plan ids that gate a VideoPress guid.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use ReflectionMethod;
use WorDBless\BaseTestCase;

/**
 * Exercises Access_Control::get_required_plan_ids_for_guid(), which reads a video's gating plans from the stored post.
 */
class Block_Plan_Derivation_Test extends BaseTestCase {

	/**
	 * Insert the gated posts as an administrator, or KSES escapes the block-comment JSON.
	 */
	protected function set_up() {
		parent::set_up();
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'derivation_admin',
				'user_pass'  => 'pass',
				'user_email' => 'derivation_admin@test.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );
	}

	/**
	 * Clean up after each test.
	 */
	protected function tear_down() {
		wp_set_current_user( 0 );
		\WorDBless\Posts::init()->clear_all_posts();
	}

	/**
	 * Invoke the private derivation helper via reflection.
	 *
	 * @param int    $post_id The embedding post id.
	 * @param string $guid    The video guid.
	 * @return array
	 */
	private function derive( $post_id, $guid ) {
		$method = new ReflectionMethod( Access_Control::class, 'get_required_plan_ids_for_guid' );
		// setAccessible() is a no-op and deprecated as of PHP 8.1; still required on the 7.x CI matrix.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( Access_Control::instance(), $post_id, $guid );
	}

	/**
	 * A video wrapped in a premium-content block resolves to that block's selectedPlanIds.
	 */
	public function test_returns_plan_ids_of_the_wrapping_premium_content_block() {
		$guid    = 'gAtEd123';
		$content = '<!-- wp:premium-content/container {"selectedPlanIds":[50,60]} -->'
			. '<!-- wp:premium-content/subscriber-view -->'
			. '<!-- wp:videopress/video {"guid":"' . $guid . '"} /-->'
			. '<!-- /wp:premium-content/subscriber-view -->'
			. '<!-- /wp:premium-content/container -->';
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Gated video',
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);

		$this->assertSame( array( 50, 60 ), $this->derive( $post_id, $guid ) );
	}

	/**
	 * The legacy single selectedPlanId attribute is honoured too.
	 */
	public function test_returns_legacy_single_plan_id() {
		$guid    = 'lEgAcY12';
		$content = '<!-- wp:premium-content/container {"selectedPlanId":42} -->'
			. '<!-- wp:premium-content/subscriber-view -->'
			. '<!-- wp:videopress/video {"guid":"' . $guid . '"} /-->'
			. '<!-- /wp:premium-content/subscriber-view -->'
			. '<!-- /wp:premium-content/container -->';
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Legacy gated video',
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);

		$this->assertSame( array( 42 ), $this->derive( $post_id, $guid ) );
	}

	/**
	 * A video embedded outside any premium-content block is not block-gated.
	 */
	public function test_returns_null_when_video_is_not_wrapped_in_premium_content() {
		$guid    = 'uNgAtEd1';
		$content = '<!-- wp:videopress/video {"guid":"' . $guid . '"} /-->';
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Ungated video',
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);

		$this->assertNull( $this->derive( $post_id, $guid ) );
	}

	/**
	 * A premium-content block that wraps a DIFFERENT video does not lend its plan ids to
	 * an unrelated guid.
	 */
	public function test_returns_null_when_wrapping_block_gates_a_different_guid() {
		$target  = 'tArGeT12';
		$other   = 'oThEr123';
		$content = '<!-- wp:premium-content/container {"selectedPlanIds":[50]} -->'
			. '<!-- wp:premium-content/subscriber-view -->'
			. '<!-- wp:videopress/video {"guid":"' . $other . '"} /-->'
			. '<!-- /wp:premium-content/subscriber-view -->'
			. '<!-- /wp:premium-content/container -->';
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Gates a different video',
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);

		$this->assertNull( $this->derive( $post_id, $target ) );
	}

	/**
	 * A missing / zero post id yields null (not gated).
	 */
	public function test_returns_null_for_missing_post() {
		$this->assertNull( $this->derive( 0, 'wHaTeVer' ) );
	}

	/**
	 * A [videopress] shortcode inside a premium-content block is gated like the block embed.
	 */
	public function test_returns_plan_ids_for_shortcode_embed_inside_premium_content() {
		$guid    = 'sHoRtC01';
		$content = '<!-- wp:premium-content/container {"selectedPlanIds":[50,60]} -->'
			. '<!-- wp:premium-content/subscriber-view -->'
			. '[videopress ' . $guid . ']'
			. '<!-- /wp:premium-content/subscriber-view -->'
			. '<!-- /wp:premium-content/container -->';
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Shortcode-embedded gated video',
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);

		$this->assertSame( array( 50, 60 ), $this->derive( $post_id, $guid ) );
	}

	/**
	 * A video embedded via a canonical VideoPress URL INSIDE a premium-content block is gated too.
	 */
	public function test_returns_plan_ids_for_url_embed_inside_premium_content() {
		$guid    = 'uRlViD01';
		$content = '<!-- wp:premium-content/container {"selectedPlanIds":[70]} -->'
			. '<!-- wp:premium-content/subscriber-view -->'
			. '<p>https://videopress.com/v/' . $guid . '</p>'
			. '<!-- /wp:premium-content/subscriber-view -->'
			. '<!-- /wp:premium-content/container -->';
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'URL-embedded gated video',
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);

		$this->assertSame( array( 70 ), $this->derive( $post_id, $guid ) );
	}

	/**
	 * A premium-content block with no plan yields an empty array, distinct from null (not gated).
	 */
	public function test_returns_empty_array_when_wrapping_block_configures_no_plan() {
		$guid    = 'nOpLaN01';
		$content = '<!-- wp:premium-content/container -->'
			. '<!-- wp:premium-content/subscriber-view -->'
			. '<!-- wp:videopress/video {"guid":"' . $guid . '"} /-->'
			. '<!-- /wp:premium-content/subscriber-view -->'
			. '<!-- /wp:premium-content/container -->';
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Plan-less gated video',
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);

		$this->assertSame( array(), $this->derive( $post_id, $guid ) );
	}

	/**
	 * With nested premium-content blocks, the innermost block's plans apply.
	 */
	public function test_returns_innermost_plan_ids_for_nested_premium_content_blocks() {
		$guid    = 'nEsTeD01';
		$content = '<!-- wp:premium-content/container {"selectedPlanIds":[10,20]} -->'
			. '<!-- wp:premium-content/subscriber-view -->'
			. '<!-- wp:premium-content/container {"selectedPlanIds":[20]} -->'
			. '<!-- wp:premium-content/subscriber-view -->'
			. '<!-- wp:videopress/video {"guid":"' . $guid . '"} /-->'
			. '<!-- /wp:premium-content/subscriber-view -->'
			. '<!-- /wp:premium-content/container -->'
			. '<!-- /wp:premium-content/subscriber-view -->'
			. '<!-- /wp:premium-content/container -->';
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Nested gated video',
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);

		$this->assertSame( array( 20 ), $this->derive( $post_id, $guid ) );
	}
}
