<?php

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * @covers ::jetpack_excerpt_br_tags_to_spaces_in_the_content
 */
#[CoversFunction( 'jetpack_excerpt_br_tags_to_spaces_in_the_content' )]
class Excerpt_Compat_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Auto excerpts should keep a word boundary where `<br>` was stripped.
	 */
	public function test_auto_excerpt_inserts_space_where_br_was_between_words() {
		$post = self::factory()->post->create_and_get(
			array(
				'post_content' => 'This is<br/>an example phrase for excerpt testing.',
				'post_excerpt' => '',
			)
		);

		$excerpt = get_the_excerpt( $post );

		$this->assertStringContainsString( 'is an', $excerpt );
		$this->assertStringNotContainsString( 'isan', $excerpt );
	}

	/**
	 * `<br>` with attributes should also become a word boundary.
	 */
	public function test_auto_excerpt_br_with_attributes() {
		$post = self::factory()->post->create_and_get(
			array(
				'post_content' => 'Line one<br class="x" />line two here.',
				'post_excerpt' => '',
			)
		);

		$excerpt = get_the_excerpt( $post );

		$this->assertStringContainsString( 'one line', $excerpt );
		$this->assertStringNotContainsString( 'oneline', $excerpt );
	}

	/**
	 * `the_content` should not be altered by this callback outside `get_the_excerpt`.
	 */
	public function test_the_content_br_preserved_when_not_building_excerpt() {
		$filtered = apply_filters( 'the_content', 'Hello<br/>World' );

		$this->assertStringContainsString( '<br', $filtered );
	}
}
