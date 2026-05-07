<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests\Feed;

use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Podcast\Feed\Customize_Feed
 */
#[CoversClass( Customize_Feed::class )]
class Customize_Feed_Test extends BaseTestCase {

	protected function tearDown(): void {
		delete_option( 'podcasting_explicit' );
		delete_option( 'podcasting_summary' );
		delete_option( 'podcasting_title' );
		delete_option( 'podcasting_category_id' );
		parent::tearDown();
	}

	public function test_explicit_string_handles_boolean_storage() {
		update_option( 'podcasting_explicit', true );
		$this->assertSame( 'true', Customize_Feed::explicit_string() );

		update_option( 'podcasting_explicit', false );
		$this->assertSame( 'false', Customize_Feed::explicit_string() );
	}

	public function test_explicit_string_handles_legacy_string_storage() {
		update_option( 'podcasting_explicit', 'yes' );
		$this->assertSame( 'true', Customize_Feed::explicit_string() );

		update_option( 'podcasting_explicit', 'no' );
		$this->assertSame( 'false', Customize_Feed::explicit_string() );

		update_option( 'podcasting_explicit', 'clean' );
		$this->assertSame( 'false', Customize_Feed::explicit_string() );
	}

	public function test_feed_description_replaces_only_description_field() {
		update_option( 'podcasting_summary', 'Our weekly podcast.' );

		$this->assertSame( 'Our weekly podcast.', Customize_Feed::feed_description( 'Original blog tagline', 'description' ) );
		$this->assertSame( 'Other value', Customize_Feed::feed_description( 'Other value', 'name' ) );
	}

	public function test_feed_title_uses_override_when_set() {
		update_option( 'podcasting_title', 'My Podcast Show' );

		$this->assertSame( 'My Podcast Show', Customize_Feed::feed_title( 'Default Title' ) );
	}

	public function test_feed_title_falls_through_when_no_override_and_no_category() {
		update_option( 'podcasting_title', '' );
		update_option( 'podcasting_category_id', 0 );

		$this->assertSame( 'Default Title', Customize_Feed::feed_title( 'Default Title' ) );
	}

	public function test_category_tag_emits_empty_for_unset_value() {
		$this->assertSame( '', Customize_Feed::category_tag( '' ) );
	}

	public function test_category_tag_emits_single_category() {
		$xml = Customize_Feed::category_tag( 'Technology' );

		$this->assertStringContainsString( "<itunes:category text='Technology' />", $xml );
		$this->assertStringNotContainsString( '</itunes:category>', $xml );
	}

	public function test_category_tag_emits_nested_subcategory() {
		$xml = Customize_Feed::category_tag( 'Technology,Tech News' );

		$this->assertStringContainsString( "<itunes:category text='Technology'>", $xml );
		$this->assertStringContainsString( "<itunes:category text='Tech News' />", $xml );
		$this->assertStringContainsString( '</itunes:category>', $xml );
	}

	public function test_category_tag_translates_legacy_aliases() {
		// 'Tech News' on its own was a legacy malformed value; should be promoted to Technology > Tech News.
		$xml = Customize_Feed::category_tag( 'Tech News' );

		$this->assertStringContainsString( "<itunes:category text='Technology'>", $xml );
		$this->assertStringContainsString( "<itunes:category text='Tech News' />", $xml );
	}

	public function test_pass_through_empty_excerpt_returns_empty_when_post_has_none() {
		// `get_the_excerpt()` returns '' when no global $post is set.
		$this->assertSame( '', Customize_Feed::pass_through_empty_excerpt( 'Some auto-generated excerpt' ) );
	}
}
