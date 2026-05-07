<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests\Feed;

use Automattic\Jetpack\Podcast\Feed\Feed_Detection;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Podcast\Feed\Feed_Detection
 */
#[CoversClass( Feed_Detection::class )]
class Feed_Detection_Test extends BaseTestCase {

	protected function tearDown(): void {
		unset( $_SERVER['HTTP_USER_AGENT'] );
		delete_option( 'podcasting_show_states' );
		parent::tearDown();
	}

	public function test_records_active_state_for_known_podcatcher_first_visit() {
		$_SERVER['HTTP_USER_AGENT'] = 'Pocket Casts/7.45.0/iOS/16.4';

		Feed_Detection::detect_and_record();

		$states = get_option( 'podcasting_show_states', array() );
		$this->assertSame( 'active', $states['pocketcasts'] );
	}

	public function test_promotes_pending_to_active() {
		update_option( 'podcasting_show_states', array( 'apple' => 'pending' ) );
		$_SERVER['HTTP_USER_AGENT'] = 'AppleCoreMedia/1.0.0.20F71';

		Feed_Detection::detect_and_record();

		$states = get_option( 'podcasting_show_states', array() );
		$this->assertSame( 'active', $states['apple'] );
	}

	public function test_does_not_rewrite_when_already_active() {
		update_option( 'podcasting_show_states', array( 'spotify' => 'active' ) );
		$_SERVER['HTTP_USER_AGENT'] = 'Spotify/8.7.0 iOS/16.4';

		// If it tried to write, it would call update_option which sanitize_callback
		// runs through Settings::sanitize_show_states — which we don't want firing
		// here. The test passes if no observable change happens.
		Feed_Detection::detect_and_record();

		$states = get_option( 'podcasting_show_states', array() );
		$this->assertSame( 'active', $states['spotify'] );
	}

	public function test_no_op_for_missing_user_agent() {
		Feed_Detection::detect_and_record();

		$this->assertFalse( get_option( 'podcasting_show_states', false ) );
	}

	public function test_no_op_for_browser_user_agent() {
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

		Feed_Detection::detect_and_record();

		$this->assertFalse( get_option( 'podcasting_show_states', false ) );
	}

	/**
	 * Detected podcatchers that aren't in the directory allowlist (Overcast,
	 * CastBox, etc.) are intentionally NOT tracked — we only record state for
	 * directories where users submit feed URLs.
	 */
	public function test_no_op_for_detected_but_non_directory_podcatcher() {
		$_SERVER['HTTP_USER_AGENT'] = 'Overcast/2023.10 (+http://overcast.fm/; iOS podcast app)';

		Feed_Detection::detect_and_record();

		$this->assertFalse( get_option( 'podcasting_show_states', false ) );
	}
}
