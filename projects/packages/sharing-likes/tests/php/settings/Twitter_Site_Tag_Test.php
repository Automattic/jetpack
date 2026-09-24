<?php
/**
 * Tests for the Twitter Site Tag setting.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Twitter_Site_Tag
 */
#[CoversClass( Twitter_Site_Tag::class )]
class Twitter_Site_Tag_Test extends BaseTestCase {

	/**
	 * Leave no request state or options behind.
	 */
	public function tear_down() {
		$_POST = array();
		delete_option( Twitter_Site_Tag::OPTION );
		remove_all_filters( 'jetpack_disable_twitter_cards' );
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * The field shows the stored username, under a heading naming the feature.
	 */
	public function test_renders_the_stored_username_under_a_heading(): void {
		update_option( Twitter_Site_Tag::OPTION, 'jetpack' );

		$markup = Twitter_Site_Tag::render();

		$this->assertStringContainsString( '<h3>Twitter Cards</h3>', $markup );
		$this->assertStringContainsString( '<label for="jetpack-twitter-cards-site-tag">Twitter Site Tag</label>', $markup );
		$this->assertStringContainsString( 'type="text" id="jetpack-twitter-cards-site-tag"', $markup );
		$this->assertStringContainsString( 'name="jetpack-twitter-cards-site-tag" value="jetpack"', $markup );
	}

	/**
	 * The width override is easy to tidy away; `Twitter_Site_Tag::render()` says why it stays.
	 */
	public function test_renders_a_description_that_overrides_the_screen_width(): void {
		$this->assertStringContainsString( '<p class="description" style="width: auto;">The Twitter username', Twitter_Site_Tag::render() );
	}

	/**
	 * Simple's Twitter Cards read `twitter_via`, and wpcom maps this option onto it, so the field configures them there too.
	 */
	public function test_renders_on_simple(): void {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertStringContainsString( 'name="jetpack-twitter-cards-site-tag"', Twitter_Site_Tag::render() );
	}

	/**
	 * Nothing reads the option once Twitter Cards are switched off.
	 */
	public function test_renders_nothing_with_twitter_cards_disabled(): void {
		add_filter( 'jetpack_disable_twitter_cards', '__return_true' );

		$this->assertSame( '', Twitter_Site_Tag::render() );
	}

	/**
	 * Posted values and what gets stored.
	 *
	 * @return array<string, array{0: mixed, 1: string}>
	 */
	public static function provide_posted_usernames(): array {
		return array(
			'plain username'       => array( 'jetpack', 'jetpack' ),
			'leading @'            => array( '@jetpack', 'jetpack' ),
			'padded leading @'     => array( '  @jetpack ', 'jetpack' ),
			'space after the @'    => array( '@ jetpack', 'jetpack' ),
			'markup'               => array( '<b>jetpack</b>', 'jetpack' ),
			'stray less-than'      => array( 'jetpack <', 'jetpack' ),
			'unterminated tag'     => array( 'jetpack <foo', 'jetpack' ),
			'cleared'              => array( '', '' ),
			'array posted'         => array( array( 'jetpack' ), '' ),
			'slashed by WordPress' => array( 'jet\\\'pack', "jet'pack" ),
		);
	}

	/**
	 * The option holds the bare username; Twitter Cards add the `@` back on output.
	 *
	 * @param mixed  $posted   Posted field value.
	 * @param string $expected Stored option value.
	 * @dataProvider provide_posted_usernames
	 */
	#[DataProvider( 'provide_posted_usernames' )]
	public function test_save_stores_the_bare_username( $posted, string $expected ): void {
		$_POST[ Twitter_Site_Tag::OPTION ] = $posted;

		Twitter_Site_Tag::save();

		$this->assertSame( $expected, get_option( Twitter_Site_Tag::OPTION ) );
	}

	/**
	 * With the field off the screen, a save must not clear what is stored.
	 */
	public function test_save_leaves_the_option_alone_where_the_field_does_not_render(): void {
		update_option( Twitter_Site_Tag::OPTION, 'jetpack' );
		add_filter( 'jetpack_disable_twitter_cards', '__return_true' );

		Twitter_Site_Tag::save();

		$this->assertSame( 'jetpack', get_option( Twitter_Site_Tag::OPTION ) );
	}
}
