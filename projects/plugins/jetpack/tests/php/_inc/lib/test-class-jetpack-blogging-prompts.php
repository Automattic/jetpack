<?php
/**
 * Blogging Prompts unit tests.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . '/_inc/blogging-prompts.php';

/**
 * Class for testing Jetpack Blogging Prompt functions.
 */
class WP_Test_Jetpack_Blogging_Prompts extends WP_UnitTestCase {
	public function test_adds_post_meta_and_tags_when_answering_prompt() {
		$prompt_id = 1234;

		$handle = \Patchwork\redefine( 'jetpack_get_blogging_prompt_by_id', \Patchwork\always( array( 'id' => $prompt_id ) ) );

		// Simulate the editor screen to create a new post() .
		set_current_screen( 'post-new' );
		$_GET['answer_prompt'] = $prompt_id;

		$post_id = wp_insert_post(
			array(
				'post_content' => 'Draft response.',
				'post_type'    => 'post',
				'post_status'  => 'draft',
			)
		);

		$prompt_meta = get_post_meta( $post_id, '_jetpack_blogging_prompt_key', true );
		$post_tags   = wp_get_post_tags( $post_id, array( 'fields' => 'slugs' ) );

		$this->assertEquals( $prompt_id, $prompt_meta );
		$this->assertContains( 'dailyprompt', $post_tags );
		$this->assertContains( "dailyprompt-{$prompt_id}", $post_tags );

		\Patchwork\restore( $handle );
	}

	public function test_dont_add_post_meta_or_tags_when_answering_invalid_prompt() {
		$prompt_id = 999;

		$handle = \Patchwork\redefine( 'jetpack_get_blogging_prompt_by_id', \Patchwork\always( null ) );

		// Simulate the editor screen to create a new post() .
		set_current_screen( 'post-new' );
		$_GET['answer_prompt'] = $prompt_id;

		$post_id = wp_insert_post(
			array(
				'post_content' => 'Draft response.',
				'post_type'    => 'post',
				'post_status'  => 'draft',
			)
		);

		$prompt_meta = get_post_meta( $post_id, '_jetpack_blogging_prompt_key', true );
		$post_tags   = wp_get_post_tags( $post_id, array( 'fields' => 'slugs' ) );

		$this->assertSame( '', $prompt_meta );
		$this->assertEmpty( $post_tags );

		\Patchwork\restore( $handle );
	}

	public function test_mark_post_as_prompt_answer_when_it_has_block_and_tags() {
		$prompt_id = 1234;

		$post_id = $this->publish_prompt_post( $prompt_id );

		$prompt_meta = get_post_meta( $post_id, '_jetpack_blogging_prompt_key', true );

		$this->assertEquals( $prompt_id, $prompt_meta );
	}

	public function test_dont_mark_post_as_prompt_answer_when_it_has_block_but_no_tags() {
		$prompt_id = 1234;

		// Create a draft post we can add tags to.
		$post_id = $this->publish_prompt_post( $prompt_id, array(), false );

		$prompt_meta = get_post_meta( $post_id, '_jetpack_blogging_prompt_key', true );

		$this->assertSame( '', $prompt_meta );
	}

	public function test_dont_mark_post_as_prompt_answer_when_it_has_tags_but_no_block() {
		$prompt_id = 1234;

		$mock_post_content = '<!-- wp:paragraph --> <p>My response.</p> <!-- /wp:paragraph -->';

		// Create a draft post we can add tags to.
		$post_id = $this->publish_prompt_post( $prompt_id, array( 'post_content' => $mock_post_content ), true );

		$prompt_meta = get_post_meta( $post_id, '_jetpack_blogging_prompt_key', true );

		$this->assertSame( '', $prompt_meta );
	}

	public function test_dont_mark_post_as_prompt_answer_when_already_published() {
		$prompt_id = 1234;

		$post_id = $this->publish_prompt_post( $prompt_id, array( 'post_status' => 'publish' ) );

		$prompt_meta = get_post_meta( $post_id, '_jetpack_blogging_prompt_key', true );

		$this->assertSame( '', $prompt_meta );
	}

	public function test_dont_mark_post_as_prompt_answer_with_only_one_block() {
		$prompt_id = 1234;

		$mock_post_content = '<!-- wp:jetpack/blogging-prompt {"promptFetched":true,"promptId":' . $prompt_id . ',"tagsAdded":true} --><!-- /wp:jetpack/blogging-prompt -->';

		// Create a draft post we can add tags to.
		$post_id = $this->publish_prompt_post( $prompt_id, array( 'post_content' => $mock_post_content ) );

		$prompt_meta = get_post_meta( $post_id, '_jetpack_blogging_prompt_key', true );

		$this->assertSame( '', $prompt_meta );
	}

	protected function publish_prompt_post( $prompt_id, $postarr = array(), $add_tags = true ) {
		$default_post_content = '<!-- wp:jetpack/blogging-prompt {"promptFetched":true,"promptId":' . $prompt_id . ',"tagsAdded":true} --><!-- /wp:jetpack/blogging-prompt -->
			<!-- wp:paragraph --> <p>My response.</p> <!-- /wp:paragraph -->';

		$data = wp_parse_args(
			$postarr,
			array(
				'post_content' => $default_post_content,
				'post_status'  => 'draft',
				'post_type'    => 'post',
			)
		);

		// Create a draft post we can add tags to.
		$post_id = wp_insert_post( $data );

		if ( $add_tags ) {
			wp_add_post_tags( $post_id, array( 'dailyprompt', "dailyprompt-$prompt_id" ) );
		}

		// Publish the post--this is when our hooked function does its magic.
		wp_insert_post(
			array(
				'ID'           => $post_id,
				'post_content' => $data['post_content'],
				'post_status'  => 'publish',
				'post_type'    => $data['post_type'],
			)
		);

		return $post_id;
	}
}
