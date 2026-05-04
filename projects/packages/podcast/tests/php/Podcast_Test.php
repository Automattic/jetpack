<?php
/**
 * Tests for the Podcast loader class.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Podcast;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Podcast\Podcast
 */
#[CoversClass( Podcast::class )]
class Podcast_Test extends BaseTestCase {

	/**
	 * Reset every podcasting_* option between tests so each case starts from a
	 * clean baseline.
	 */
	public function set_up() {
		parent::set_up();
		$keys = array(
			'podcasting_category_id',
			'podcasting_archive',
			'podcasting_image',
			'podcasting_image_id',
		);
		foreach ( $keys as $key ) {
			delete_option( $key );
		}
	}

	/**
	 * `is_enabled()` returns false when no category is configured (the default state).
	 */
	public function test_is_enabled_is_false_by_default() {
		$this->assertFalse( Podcast::is_enabled() );
	}

	/**
	 * `get_category_id()` returns false when neither the integer option nor the
	 * legacy slug option is set.
	 */
	public function test_get_category_id_is_false_when_unset() {
		$this->assertFalse( Podcast::get_category_id() );
	}

	/**
	 * `get_image_url()` falls back to the URL option when no attachment is set.
	 */
	public function test_get_image_url_falls_back_to_url_option() {
		$this->assertSame( '', Podcast::get_image_url() );

		update_option( 'podcasting_image', 'https://example.com/cover.jpg' );
		$this->assertSame( 'https://example.com/cover.jpg', Podcast::get_image_url() );
	}
}
