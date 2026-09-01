<?php
/**
 * Tests for Copy Post module.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/copy-post.php';

/**
 * Test class for Jetpack_Copy_Post.
 *
 * @group copy-post
 * @covers Jetpack_Copy_Post::copy_footnotes
 */
#[Group( 'copy-post' )]
#[CoversMethod( Jetpack_Copy_Post::class, 'copy_footnotes' )]
class Copy_Post_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test that copy_footnotes copies and regenerates footnote IDs.
	 */
	public function test_copy_footnotes_regenerates_ids() {
		$copy_post = new Jetpack_Copy_Post();

		// Create source post with footnotes.
		$old_id         = 'abc12345-1234-1234-1234-123456789abc';
		$source_post_id = self::factory()->post->create();
		$source_post    = get_post( $source_post_id );

		$footnotes_meta = wp_json_encode(
			array(
				array(
					'id'      => $old_id,
					'content' => 'Test footnote',
				),
			),
			JSON_UNESCAPED_SLASHES
		);
		update_post_meta( $source_post_id, 'footnotes', $footnotes_meta );

		// Create target post.
		$target_post_id = self::factory()->post->create();

		// Prepare data array as the filter would receive it.
		$data = array(
			'ID'           => $target_post_id,
			'post_content' => '<p>Text with footnote<sup data-fn="' . $old_id . '" class="fn"><a href="#' . $old_id . '" id="' . $old_id . '-link">1</a></sup></p>',
		);

		// Call the method.
		$result = $copy_post->copy_footnotes( $data, $source_post, $target_post_id );

		// Assert old ID is not in content.
		$this->assertStringNotContainsString( $old_id, $result['post_content'] );

		// Assert footnotes meta was saved to target.
		$target_footnotes = get_post_meta( $target_post_id, 'footnotes', true );
		$this->assertNotEmpty( $target_footnotes );

		// Assert new ID is a valid UUID and different from old.
		$decoded = json_decode( $target_footnotes, true );
		$this->assertIsArray( $decoded );
		$new_id = $decoded[0]['id'];
		$this->assertNotEquals( $old_id, $new_id );
		$this->assertMatchesRegularExpression(
			'/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
			$new_id
		);

		// Assert new ID is in content.
		$this->assertStringContainsString( 'data-fn="' . $new_id . '"', $result['post_content'] );
		$this->assertStringContainsString( 'href="#' . $new_id . '"', $result['post_content'] );
		$this->assertStringContainsString( 'id="' . $new_id . '-link"', $result['post_content'] );
	}

	/**
	 * Test that copy_footnotes returns unmodified data when no footnotes exist.
	 */
	public function test_copy_footnotes_no_footnotes() {
		$copy_post = new Jetpack_Copy_Post();

		$source_post_id = self::factory()->post->create();
		$source_post    = get_post( $source_post_id );
		$target_post_id = self::factory()->post->create();

		$data = array(
			'ID'           => $target_post_id,
			'post_content' => '<p>No footnotes here</p>',
		);

		$result = $copy_post->copy_footnotes( $data, $source_post, $target_post_id );

		$this->assertEquals( $data, $result );
	}

	/**
	 * Test that copy_footnotes handles empty footnotes meta.
	 */
	public function test_copy_footnotes_empty_meta() {
		$copy_post = new Jetpack_Copy_Post();

		$source_post_id = self::factory()->post->create();
		$source_post    = get_post( $source_post_id );
		update_post_meta( $source_post_id, 'footnotes', '' );

		$target_post_id = self::factory()->post->create();

		$data = array(
			'ID'           => $target_post_id,
			'post_content' => '<p>Content</p>',
		);

		$result = $copy_post->copy_footnotes( $data, $source_post, $target_post_id );

		$this->assertEquals( $data, $result );
	}

	/**
	 * Test that copy_footnotes handles invalid JSON gracefully.
	 */
	public function test_copy_footnotes_invalid_json() {
		$copy_post = new Jetpack_Copy_Post();

		$source_post_id = self::factory()->post->create();
		$source_post    = get_post( $source_post_id );
		update_post_meta( $source_post_id, 'footnotes', 'not valid json' );

		$target_post_id = self::factory()->post->create();

		$data = array(
			'ID'           => $target_post_id,
			'post_content' => '<p>Content</p>',
		);

		$result = $copy_post->copy_footnotes( $data, $source_post, $target_post_id );

		$this->assertEquals( $data, $result );
	}

	/**
	 * Test that copy_footnotes handles empty array gracefully.
	 */
	public function test_copy_footnotes_empty_array() {
		$copy_post = new Jetpack_Copy_Post();

		$source_post_id = self::factory()->post->create();
		$source_post    = get_post( $source_post_id );
		update_post_meta( $source_post_id, 'footnotes', '[]' );

		$target_post_id = self::factory()->post->create();

		$data = array(
			'ID'           => $target_post_id,
			'post_content' => '<p>Content</p>',
		);

		$result = $copy_post->copy_footnotes( $data, $source_post, $target_post_id );

		$this->assertEquals( $data, $result );
	}

	/**
	 * Test that multiple footnotes each get unique IDs.
	 */
	public function test_copy_footnotes_multiple_footnotes() {
		$copy_post = new Jetpack_Copy_Post();

		$old_id_1 = 'id111111-1111-1111-1111-111111111111';
		$old_id_2 = 'id222222-2222-2222-2222-222222222222';

		$source_post_id = self::factory()->post->create();
		$source_post    = get_post( $source_post_id );

		$footnotes_meta = wp_json_encode(
			array(
				array(
					'id'      => $old_id_1,
					'content' => 'First footnote',
				),
				array(
					'id'      => $old_id_2,
					'content' => 'Second footnote',
				),
			),
			JSON_UNESCAPED_SLASHES
		);
		update_post_meta( $source_post_id, 'footnotes', $footnotes_meta );

		$target_post_id = self::factory()->post->create();

		$data = array(
			'ID'           => $target_post_id,
			'post_content' => '<p>First<sup data-fn="' . $old_id_1 . '" class="fn"><a href="#' . $old_id_1 . '" id="' . $old_id_1 . '-link">1</a></sup> Second<sup data-fn="' . $old_id_2 . '" class="fn"><a href="#' . $old_id_2 . '" id="' . $old_id_2 . '-link">2</a></sup></p>',
		);

		$result = $copy_post->copy_footnotes( $data, $source_post, $target_post_id );

		// Get the new IDs from meta.
		$target_footnotes = json_decode( get_post_meta( $target_post_id, 'footnotes', true ), true );
		$this->assertIsArray( $target_footnotes );
		$new_id_1 = $target_footnotes[0]['id'];
		$new_id_2 = $target_footnotes[1]['id'];

		// Assert both IDs are unique and different from originals.
		$this->assertNotEquals( $old_id_1, $new_id_1 );
		$this->assertNotEquals( $old_id_2, $new_id_2 );
		$this->assertNotEquals( $new_id_1, $new_id_2 );

		// Assert old IDs are not in content.
		$this->assertStringNotContainsString( $old_id_1, $result['post_content'] );
		$this->assertStringNotContainsString( $old_id_2, $result['post_content'] );

		// Assert content has new IDs.
		$this->assertStringContainsString( 'data-fn="' . $new_id_1 . '"', $result['post_content'] );
		$this->assertStringContainsString( 'data-fn="' . $new_id_2 . '"', $result['post_content'] );
	}

	/**
	 * Test that footnote content is preserved.
	 */
	public function test_copy_footnotes_preserves_content() {
		$copy_post = new Jetpack_Copy_Post();

		$old_id           = 'abc12345-1234-1234-1234-123456789abc';
		$footnote_content = 'This is <em>important</em> footnote content.';

		$source_post_id = self::factory()->post->create();
		$source_post    = get_post( $source_post_id );

		$footnotes_meta = wp_json_encode(
			array(
				array(
					'id'      => $old_id,
					'content' => $footnote_content,
				),
			),
			JSON_UNESCAPED_SLASHES
		);
		update_post_meta( $source_post_id, 'footnotes', $footnotes_meta );

		$target_post_id = self::factory()->post->create();

		$data = array(
			'ID'           => $target_post_id,
			'post_content' => '<p>Text<sup data-fn="' . $old_id . '"></sup></p>',
		);

		$copy_post->copy_footnotes( $data, $source_post, $target_post_id );

		// Assert footnote content is preserved.
		$target_footnotes = json_decode( get_post_meta( $target_post_id, 'footnotes', true ), true );
		$this->assertIsArray( $target_footnotes );
		$this->assertEquals( $footnote_content, $target_footnotes[0]['content'] );
	}

	/**
	 * Test that update_content preserves backslashes in post fields.
	 */
	public function test_update_content_preserves_backslashes() {
		$copy_post = new Jetpack_Copy_Post();

		$source_content = "Code: \\t is a tab, \\n is a newline, \\\\ is a backslash";
		$source_excerpt = "Excerpt with \\t tab";
		$source_title   = "Title with \\t tab";

		$source_post_id = self::factory()->post->create(
			wp_slash(
				array(
					'post_content' => $source_content,
					'post_excerpt' => $source_excerpt,
					'post_title'   => $source_title,
				)
			)
		);
		$source_post    = get_post( $source_post_id );
		$target_post_id = self::factory()->post->create();

		$method = new ReflectionMethod( Jetpack_Copy_Post::class, 'update_content' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$method->invoke( $copy_post, $source_post, $target_post_id );

		$target_post = get_post( $target_post_id );
		$this->assertSame( $source_content, $target_post->post_content, 'Backslashes in post_content should be preserved' );
		$this->assertSame( $source_excerpt, $target_post->post_excerpt, 'Backslashes in post_excerpt should be preserved' );
		$this->assertSame( $source_title, $target_post->post_title, 'Backslashes in post_title should be preserved' );
	}
}
