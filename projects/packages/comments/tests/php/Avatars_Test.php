<?php
/**
 * Tests for stored avatars.
 *
 * @package automattic/jetpack-comments
 */

use Automattic\Jetpack\Comments\Avatars;
use Automattic\Jetpack\Comments\Checkpoint;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Tests for stored avatars.
 *
 * @covers \Automattic\Jetpack\Comments\Avatars
 */
#[CoversClass( Avatars::class )]
class Avatars_Test extends BaseTestCase {

	/**
	 * Comment meta by key. WorDBless has no comments table, so it is served from here.
	 *
	 * @var array
	 */
	private $meta = array();

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		add_filter( 'get_comment_metadata', array( $this, 'serve_meta' ), 10, 3 );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_filter( 'get_comment_metadata', array( $this, 'serve_meta' ) );
		parent::tear_down();
	}

	/**
	 * Serve comment meta from the fixture.
	 *
	 * @param mixed  $value      Short-circuit value.
	 * @param int    $comment_id Comment ID.
	 * @param string $key        Meta key.
	 * @return mixed
	 */
	public function serve_meta( $value, $comment_id, $key ) {
		return $this->meta[ $key ] ?? '';
	}

	/**
	 * Avatar args for a comment carrying the given meta.
	 *
	 * @param array $meta Meta by key.
	 * @return array
	 */
	private function avatar_for( array $meta ) {
		$this->meta = $meta;

		return Avatars::avatar_data( array( 'size' => 48 ), new WP_Comment( (object) array( 'comment_ID' => 5 ) ) );
	}

	/**
	 * An avatar from the exchange is served through the CDN whatever its host, as long as it is https.
	 */
	public function test_identity_avatar_is_served_when_https() {
		$args = $this->avatar_for( array( Checkpoint::META_AVATAR => 'https://photos.example.com/a/photo.jpg' ) );

		$this->assertTrue( $args['found_avatar'] );
		$this->assertStringContainsString( 'photos.example.com/a/photo.jpg', $args['url'] );
		$this->assertStringContainsString( 'resize=48%2C48', $args['url'] );

		$this->assertArrayNotHasKey( 'url', $this->avatar_for( array( Checkpoint::META_AVATAR => 'http://example.com/photo.jpg' ) ) );
	}

	/**
	 * A Highlander avatar keeps the host allowlist it always had.
	 */
	public function test_highlander_avatar_still_needs_an_allowed_host() {
		$this->assertTrue( $this->avatar_for( array( Avatars::AVATAR_META => 'https://graph.facebook.com/1/picture' ) )['found_avatar'] );
		$this->assertArrayNotHasKey( 'url', $this->avatar_for( array( Avatars::AVATAR_META => 'https://example.com/photo.jpg' ) ) );
	}
}
