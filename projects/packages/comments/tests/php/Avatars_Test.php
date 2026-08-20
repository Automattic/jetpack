<?php
/**
 * Tests for avatars on comments already written.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use WorDBless\BaseTestCase;

/**
 * Tests for the Avatars class.
 */
class Avatars_Test extends BaseTestCase {

	/**
	 * Build a comment with stored meta, without needing a database for either.
	 *
	 * @param string $avatar Value to report for the stored avatar meta.
	 * @return \WP_Comment
	 */
	private function comment_with_avatar( $avatar ) {
		add_filter(
			'get_comment_metadata',
			function ( $value, $object_id, $meta_key, $single ) use ( $avatar ) {
				if ( Avatars::AVATAR_META !== $meta_key ) {
					return $value;
				}
				return $single ? $avatar : array( $avatar );
			},
			10,
			4
		);

		return new \WP_Comment(
			(object) array(
				'comment_ID'      => 77,
				'comment_post_ID' => 1,
			)
		);
	}

	/**
	 * Clean up the meta stub.
	 *
	 * @after
	 */
	#[\PHPUnit\Framework\Attributes\After]
	public function tear_down_meta_stub() {
		remove_all_filters( 'get_comment_metadata' );
		remove_all_filters( 'jetpack_photon_development_mode' );
	}

	/**
	 * An avatar the image CDN can serve is proxied and resized.
	 */
	public function test_stored_avatar_is_proxied() {
		add_filter( 'jetpack_photon_development_mode', '__return_false' );

		$comment = $this->comment_with_avatar( 'https://pbs.twimg.com/profile_images/1/avatar.jpg' );

		$args = Avatars::avatar_data( array( 'size' => 48 ), $comment );

		$this->assertStringContainsString( 'i0.wp.com', $args['url'] );
		$this->assertStringContainsString( 'resize=48', rawurldecode( $args['url'] ) );
	}

	/**
	 * A Facebook avatar is served as stored.
	 *
	 * Those URLs carry no file extension, which the image CDN requires, so it
	 * hands them back untouched and the browser fetches them from Facebook.
	 */
	public function test_stored_facebook_avatar_is_served_as_stored() {
		add_filter( 'jetpack_photon_development_mode', '__return_false' );

		$stored  = 'https://graph.facebook.com/12345/picture?type=large';
		$comment = $this->comment_with_avatar( $stored );

		$args = Avatars::avatar_data( array( 'size' => 48 ), $comment );

		$this->assertSame( $stored, $args['url'] );
	}

	/**
	 * An avatar URL from anywhere else is ignored rather than rendered.
	 */
	public function test_avatar_from_an_unexpected_host_is_ignored() {
		$comment = $this->comment_with_avatar( 'https://evil.example.com/pixel.gif' );

		$this->assertArrayNotHasKey( 'url', Avatars::avatar_data( array( 'size' => 48 ), $comment ) );
	}

	/**
	 * A lookalike host does not pass for the real one.
	 */
	public function test_lookalike_avatar_host_is_ignored() {
		$comment = $this->comment_with_avatar( 'https://graph.facebook.com.evil.example/pixel.gif' );

		$this->assertArrayNotHasKey( 'url', Avatars::avatar_data( array( 'size' => 48 ), $comment ) );
	}

	/**
	 * With nothing stored, core's own Gravatar handling is left to run.
	 */
	public function test_comment_without_stored_avatar_is_left_alone() {
		$comment = $this->comment_with_avatar( '' );

		$this->assertArrayNotHasKey( 'url', Avatars::avatar_data( array( 'size' => 48 ), $comment ) );
	}

	/**
	 * Anything that is not a comment is none of our business.
	 */
	public function test_non_comments_are_left_alone() {
		$args = array( 'size' => 48 );

		$this->assertSame( $args, Avatars::avatar_data( $args, 'someone@example.com' ) );
	}

	/**
	 * Booting identity hooks the avatar filter ahead of core's resolution.
	 */
	public function test_init_registers_the_avatar_filter() {
		Avatars::init();

		$this->assertNotFalse(
			has_filter( 'pre_get_avatar_data', array( Avatars::class, 'avatar_data' ) )
		);
	}
}
