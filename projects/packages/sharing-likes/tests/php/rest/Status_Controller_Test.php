<?php
/**
 * Tests for the status and action routes.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sharing_Likes\Settings\Section_Environment;
use Automattic\Jetpack\Sharing_Likes\Settings\Section_State;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../lib/class-sharing-service.php';
require_once __DIR__ . '/../lib/class-jetpack-likes-settings.php';
require_once __DIR__ . '/../lib/trait-section-environment.php';
require_once __DIR__ . '/../lib/trait-rest-requests.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\REST\Status_Controller
 */
#[CoversClass( Status_Controller::class )]
class Status_Controller_Test extends BaseTestCase {

	use Section_Environment;
	use REST_Requests;

	/**
	 * Start every case as an administrator on a connected site with no theme, blocks or modules.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
		$this->set_up_rest();
		$this->given_connection( true );
		$this->log_in_as( 'administrator' );
	}

	/**
	 * Leave no options or constants behind.
	 */
	public function tear_down() {
		foreach ( array( 'sharing-services', 'disabled_likes', 'disabled_reblogs' ) as $option ) {
			delete_option( $option );
		}

		$this->tear_down_rest();
		$this->tear_down_site();
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * A block theme with both blocks, so each section can offer the block route.
	 */
	private function given_block_routes(): void {
		$this->given_block_theme();
		$this->given_block( 'jetpack/sharing-buttons' );
		$this->given_block( 'jetpack/like' );
	}

	/**
	 * Active module slugs, in order.
	 *
	 * @return string[]
	 */
	private function active_modules(): array {
		return array_values( (array) Jetpack_Options::get_option( 'active_modules', array() ) );
	}

	public function test_status_requires_manage_options(): void {
		$this->log_in_as( 'editor' );

		$this->assertSame( 403, $this->request( 'GET', 'status' )->get_status() );
	}

	public function test_status_reports_what_each_section_renders(): void {
		$this->given_modules( array( 'sharedaddy' ) );

		$data = $this->request( 'GET', 'status' )->get_data();

		$this->assertSame( Section_State::CONFIGURE, $data['sharing']['state'] );
		$this->assertSame( Section_State::OFF, $data['likes']['state'] );
		$this->assertTrue( $data['likes']['supported'] );
		$this->assertTrue( $data['placement'] );
		$this->assertSame( '', $data['site_editor_url'] );
	}

	public function test_status_reports_likes_unsupported_without_a_connection(): void {
		$this->given_connection( false );

		$this->assertFalse( $this->request( 'GET', 'status' )->get_data()['likes']['supported'] );
	}

	/**
	 * Off Simple, Comment Likes read the Likes settings, so they keep placement on screen with both button features off.
	 */
	public function test_status_reports_comment_likes_that_follow_the_likes_settings(): void {
		$this->given_modules( array( 'comment-likes' ) );

		$data = $this->request( 'GET', 'status' )->get_data();

		$this->assertTrue( $data['comment_likes']['supported'] );
		$this->assertTrue( $data['comment_likes']['follows_likes_settings'] );
		$this->assertTrue( $data['placement'] );
	}

	public function test_status_reports_comment_likes_on_simple_as_independent_of_the_likes_settings(): void {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertFalse( $this->request( 'GET', 'status' )->get_data()['comment_likes']['follows_likes_settings'] );
	}

	public function test_status_hides_placement_once_nothing_reads_it(): void {
		$this->given_modules( array() );

		$this->assertFalse( $this->request( 'GET', 'status' )->get_data()['placement'] );
	}

	public function test_status_links_the_single_template_where_the_block_is_a_route(): void {
		$this->given_block_routes();

		$this->assertStringContainsString( 'site-editor.php', $this->request( 'GET', 'status' )->get_data()['site_editor_url'] );
	}

	public function test_switching_to_the_block_turns_off_only_that_feature(): void {
		$this->given_block_routes();
		$this->given_modules( array( 'sharedaddy', 'likes' ) );

		$response = $this->request( 'POST', 'sharing/switch-to-block' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'likes' ), $this->active_modules() );
		$this->assertSame( Section_State::BLOCK_CALL_TO_ACTION, $response->get_data()['sharing']['state'] );
	}

	public function test_switching_likes_to_the_block_on_simple_turns_off_likes_and_reblogs(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->given_block_routes();

		$response = $this->request( 'POST', 'likes/switch-to-block' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '1', (string) get_option( 'disabled_likes' ) );
		$this->assertSame( '1', (string) get_option( 'disabled_reblogs' ) );
		$this->assertSame( Section_State::BLOCK_CALL_TO_ACTION, $response->get_data()['likes']['state'] );
	}

	/**
	 * Without a block to move to, the legacy options are the only way to configure the feature.
	 */
	public function test_switching_to_the_block_is_refused_without_a_block_route(): void {
		$this->given_modules( array( 'sharedaddy' ) );

		$response = $this->request( 'POST', 'sharing/switch-to-block' );

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( array( 'sharedaddy' ), $this->active_modules() );
	}

	public function test_turning_a_feature_on_from_off(): void {
		$this->given_modules( array() );

		$response = $this->request( 'POST', 'sharing/activate' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'sharedaddy' ), $this->active_modules() );
		$this->assertSame( Section_State::CONFIGURE, $response->get_data()['sharing']['state'] );
	}

	/**
	 * The Jetpack dashboard drops its module toggle on these sites, so the API must not add one back.
	 */
	public function test_turning_a_feature_on_is_refused_where_the_block_is_the_route(): void {
		$this->given_block_routes();
		$this->given_modules( array() );

		$response = $this->request( 'POST', 'likes/activate' );

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( array(), $this->active_modules() );
	}

	public function test_likes_actions_are_refused_without_a_connection(): void {
		$this->given_connection( false );
		$this->given_modules( array() );

		$response = $this->request( 'POST', 'likes/activate' );

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( array(), $this->active_modules() );
	}

	public function test_actions_require_manage_options(): void {
		$this->given_modules( array() );
		$this->log_in_as( 'editor' );

		$this->assertSame( 403, $this->request( 'POST', 'sharing/activate' )->get_status() );
		$this->assertSame( array(), $this->active_modules() );
	}
}
