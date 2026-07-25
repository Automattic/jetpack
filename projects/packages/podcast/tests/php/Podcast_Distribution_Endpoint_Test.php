<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Podcast_Distribution_Endpoint;
use Automattic\Jetpack\Podcast\Settings;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\UsesClass;
use WorDBless\BaseTestCase;

/**
 * Covers the local persistence the distribution proxy performs after relaying a
 * Pocket Casts submission: the wpcom relay writes its own copy of the option,
 * so the Jetpack side must mirror the verdict onto this site's local options or
 * the dashboard (which reads them) stays empty.
 *
 * @covers \Automattic\Jetpack\Podcast\Podcast_Distribution_Endpoint
 * @uses \Automattic\Jetpack\Podcast\Settings
 */
#[CoversClass( Podcast_Distribution_Endpoint::class )]
#[UsesClass( Settings::class )]
class Podcast_Distribution_Endpoint_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();

		// The registered sanitize_callbacks are what merge partial patches into
		// the stored maps, so persistence only behaves correctly once they exist.
		Settings::register_settings();
	}

	protected function tearDown(): void {
		foreach ( Settings::OPTION_NAMES as $name ) {
			delete_option( $name );
		}
		parent::tearDown();
	}

	/**
	 * Invoke the private save helper with a decoded relay body.
	 *
	 * @param mixed $data Relay body.
	 */
	private function save( $data ): void {
		$endpoint = new class() extends Podcast_Distribution_Endpoint {
			public function save( $data ): void {
				$this->save_show_state( $data );
			}
		};
		$endpoint->save( $data );
	}

	public function test_active_persists_state_and_share_link() {
		$this->save(
			array(
				'state'      => 'active',
				'share_link' => 'https://pca.st/abcd1234',
			)
		);

		$this->assertSame( 'active', get_option( 'podcasting_show_states' )['pocketcasts'] );
		$this->assertSame( 'https://pca.st/abcd1234', get_option( 'podcasting_show_urls' )['pocketcasts'] );
	}

	public function test_pending_persists_state_without_url() {
		$this->save( array( 'state' => 'pending' ) );

		$this->assertSame( 'pending', get_option( 'podcasting_show_states' )['pocketcasts'] );
		$this->assertArrayNotHasKey( 'pocketcasts', (array) get_option( 'podcasting_show_urls', array() ) );
	}

	public function test_rejected_clears_pocketcasts_but_preserves_other_podcatchers() {
		update_option(
			'podcasting_show_states',
			array(
				'apple'       => 'active',
				'pocketcasts' => 'active',
			)
		);

		$this->save( array( 'state' => 'rejected' ) );

		$states = get_option( 'podcasting_show_states' );
		$this->assertArrayNotHasKey( 'pocketcasts', $states );
		$this->assertSame( 'active', $states['apple'] );
	}

	public function test_pending_does_not_downgrade_an_active_state() {
		update_option( 'podcasting_show_states', array( 'pocketcasts' => 'active' ) );

		$this->save( array( 'state' => 'pending' ) );

		$this->assertSame( 'active', get_option( 'podcasting_show_states' )['pocketcasts'] );
	}

	public function test_disallowed_share_link_host_is_dropped() {
		$this->save(
			array(
				'state'      => 'active',
				'share_link' => 'https://evil.example.com/abcd',
			)
		);

		$this->assertArrayNotHasKey( 'pocketcasts', (array) get_option( 'podcasting_show_urls', array() ) );
	}

	/**
	 * @param mixed $data Relay body that should not touch any option.
	 * @dataProvider provide_noop_bodies
	 */
	#[DataProvider( 'provide_noop_bodies' )]
	public function test_non_verdict_bodies_persist_nothing( $data ) {
		$this->save( $data );

		$this->assertFalse( get_option( 'podcasting_show_states', false ) );
		$this->assertFalse( get_option( 'podcasting_show_urls', false ) );
	}

	public static function provide_noop_bodies(): array {
		return array(
			'missing state' => array( array( 'share_link' => 'https://pca.st/x' ) ),
			'unknown state' => array( array( 'state' => 'unreachable' ) ),
			'string body'   => array( 'Bad Gateway' ),
			'null body'     => array( null ),
		);
	}
}
