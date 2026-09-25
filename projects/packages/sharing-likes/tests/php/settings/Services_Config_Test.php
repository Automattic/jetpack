<?php
/**
 * Tests for the sharing services save.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use PHPUnit\Framework\Attributes\CoversClass;
use RuntimeException;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../lib/class-sharing-service.php';
require_once __DIR__ . '/../lib/trait-section-environment.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Services_Config
 */
#[CoversClass( Services_Config::class )]
class Services_Config_Test extends BaseTestCase {

	use Section_Environment;

	/**
	 * Start every case from a site with no theme, no blocks and no modules.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
	}

	/**
	 * Leave no request state, option or recorded payload behind.
	 */
	public function tear_down() {
		$_POST = array();
		unset( $GLOBALS['sharing_likes_test_global_options'] );

		remove_all_filters( 'wp_redirect' );
		remove_all_actions( 'sharing_global_options' );
		delete_option( 'sharing-options' );
		$this->tear_down_site();

		parent::tear_down();
	}

	/**
	 * Stand in for the redirect the handler would otherwise `die()` on.
	 *
	 * @return never
	 * @throws RuntimeException Always.
	 */
	public function stop_at_redirect() {
		throw new RuntimeException( 'redirected' );
	}

	/**
	 * Run the save, and return what the handler passed to `Sharing_Service`.
	 *
	 * @param array<string,mixed> $payload Fields the services form submits.
	 * @return array<string,mixed>
	 */
	private function submit_services_form( array $payload ): array {
		$_POST             = $payload;
		$_POST['_wpnonce'] = wp_create_nonce( 'sharing-options' );

		add_filter( 'wp_redirect', array( $this, 'stop_at_redirect' ) );

		try {
			( new Services_Config() )->process_requests();
			$this->fail( 'The handler was expected to redirect.' );
		} catch ( RuntimeException $e ) {
			$this->assertSame( 'redirected', $e->getMessage() );
		}

		return $GLOBALS['sharing_likes_test_global_options'];
	}

	/**
	 * The services form carries no `show` field, and `set_global_options()`
	 * rebuilds the whole global array from defaults — so without the handler
	 * carrying placement through, saving a button style would silently stop the
	 * buttons rendering anywhere.
	 */
	public function test_services_save_carries_the_stored_placement_through(): void {
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'post', 'index' ) ) ) );

		$saved = $this->submit_services_form( array( 'button_style' => 'icon' ) );

		$this->assertSame( array( 'post', 'index' ), $saved['show'] );
	}

	/**
	 * A site that has never saved placement still shows buttons somewhere, so
	 * the defaults are what gets carried through rather than an empty list.
	 */
	public function test_services_save_carries_the_defaults_when_placement_was_never_saved(): void {
		$saved = $this->submit_services_form( array( 'button_style' => 'icon' ) );

		$this->assertSame( array( 'post', 'page' ), $saved['show'] );
	}

	/**
	 * A payload that does carry placement is passed through untouched.
	 */
	public function test_services_save_leaves_a_posted_placement_alone(): void {
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'post' ) ) ) );

		$saved = $this->submit_services_form(
			array(
				'button_style' => 'icon',
				'show'         => array( 'page' ),
			)
		);

		$this->assertSame( array( 'page' ), $saved['show'] );
	}

	/**
	 * Print a field, standing in for a third-party consumer.
	 */
	public function print_field(): void {
		echo '<tr><th>Third party</th><td><input name="third-party-field" /></td></tr>';
	}

	/**
	 * "Disable CSS and JS" belongs to the buttons configured above it, so it comes
	 * before the Twitter Cards heading. Third parties close the table.
	 */
	public function test_global_options_lead_with_the_screen_own_rows(): void {
		$this->given_connection( true );
		$this->given_modules( array( 'sharedaddy' ) );
		add_action( 'sharing_global_options', array( $this, 'print_field' ) );

		$markup = Services_Config::global_options();

		$resources   = strpos( $markup, 'name="disable_resources"' );
		$heading     = strpos( $markup, '<h3>Twitter Cards</h3>' );
		$third_party = strpos( $markup, 'name="third-party-field"' );

		$this->assertIsInt( $resources );
		$this->assertIsInt( $heading );
		$this->assertIsInt( $third_party );
		$this->assertLessThan( $heading, $resources );
		$this->assertLessThan( $third_party, $heading );
	}
}
