<?php
/**
 * Tests for the sharing buttons' global options.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php';
require_once JETPACK__PLUGIN_DIR . 'modules/likes/jetpack-likes-settings.php';

use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Options;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Sharing_Service global options on a site that never chose where buttons appear.
 */
class Sharing_Service_Global_Options_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Start every test from a site that never saved sharing options.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( 'sharing-options' );
		register_post_type(
			'book',
			array(
				'public'   => true,
				'supports' => array( 'title', 'editor', 'comments' ),
			)
		);
	}

	/**
	 * Remove the post type and options the tests add.
	 */
	public function tear_down() {
		unregister_post_type( 'book' );
		delete_option( 'sharing-options' );
		parent::tear_down();
	}

	public function test_reading_then_saving_another_option_keeps_each_features_placement_default() {
		( new Sharing_Service() )->get_global_options();
		Sharing_Options::update( array( 'button_style' => 'icon' ) );

		$this->assertSame( 'icon', ( new Sharing_Service() )->get_global_options()['button_style'] );
		$this->assertSame( array( 'post', 'page' ), ( new Sharing_Service() )->get_global_options()['show'] );
		$this->assertContains( 'book', ( new Jetpack_Likes_Settings() )->get_options()['show'] );
	}

	/**
	 * @dataProvider chosen_placements
	 * @param string[] $show Placement to save.
	 */
	#[DataProvider( 'chosen_placements' )]
	public function test_a_chosen_placement_is_stored( array $show ) {
		( new Sharing_Service() )->get_global_options();
		( new Sharing_Service() )->set_global_options( array( 'show' => $show ) );

		$this->assertSame( $show, get_option( 'sharing-options' )['global']['show'] );
	}

	/**
	 * Placements that match a default or select nothing, which are easy to mistake for no choice.
	 */
	public static function chosen_placements(): array {
		return array(
			'posts and pages' => array( array( 'post', 'page' ) ),
			'nowhere'         => array( array() ),
		);
	}

	public function test_sharing_buttons_stay_off_a_static_front_page_once_the_options_are_saved() {
		$front = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$other = self::factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $front );
		( new Sharing_Service() )->get_global_options();

		$this->go_to( get_permalink( $other ) );
		$GLOBALS['post'] = get_post( $other );
		$this->assertStringContainsString( 'sharedaddy', sharing_display( 'Content' ) );

		$this->go_to( home_url( '/' ) );
		$GLOBALS['post'] = get_post( $front );
		$this->assertSame( 'Content', sharing_display( 'Content' ) );
	}
}
