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

	/**
	 * One representative UA per directory we track — also serves as the
	 * regression net for the opawg sync (Amazon's spaced bot UA, the
	 * broadened `PodcastIndex` substring, etc.).
	 */
	public function test_promotes_pending_state_for_each_tracked_directory() {
		$cases = array(
			'AppleCoreMedia/1.0.0.20F71 (iPhone; U; CPU OS 16_5_1)' => 'apple',
			'Spotify/8.7.0 iOS/16.4'       => 'spotify',
			'Pocket Casts/7.45.0/iOS/16.4' => 'pocketcasts',
			'Amazon Music Podcast/1.0'     => 'amazon',
			'PodcastIndexer/2.1 (+https://podcastindex.org/)' => 'podcastindex',
			'GooglePodcasts/1.0 iOS/16.4'  => 'youtube',
		);

		foreach ( $cases as $ua => $expected_slug ) {
			update_option( 'podcasting_show_states', array( $expected_slug => 'pending' ) );
			$_SERVER['HTTP_USER_AGENT'] = $ua;

			Feed_Detection::detect_and_record();

			$states = get_option( 'podcasting_show_states', array() );
			$this->assertSame( 'active', $states[ $expected_slug ] ?? null, "UA: $ua" );
		}
	}

	public function test_promotes_pending_to_active() {
		update_option( 'podcasting_show_states', array( 'apple' => 'pending' ) );
		$_SERVER['HTTP_USER_AGENT'] = 'AppleCoreMedia/1.0.0.20F71';

		Feed_Detection::detect_and_record();

		$states = get_option( 'podcasting_show_states', array() );
		$this->assertSame( 'active', $states['apple'] );
	}

	public function test_does_not_create_state_for_recognized_directory_without_existing_state() {
		$_SERVER['HTTP_USER_AGENT'] = 'AppleCoreMedia/1.0.0.20F71';

		Feed_Detection::detect_and_record();

		$this->assertFalse( get_option( 'podcasting_show_states', false ) );
	}

	public function test_does_not_create_state_for_recognized_directory_with_empty_states_array() {
		update_option( 'podcasting_show_states', array() );
		$_SERVER['HTTP_USER_AGENT'] = 'AppleCoreMedia/1.0.0.20F71';

		Feed_Detection::detect_and_record();

		$this->assertSame( array(), get_option( 'podcasting_show_states', array() ) );
	}

	public function test_does_not_create_state_for_recognized_directory_missing_from_existing_states() {
		update_option( 'podcasting_show_states', array( 'spotify' => 'pending' ) );
		$_SERVER['HTTP_USER_AGENT'] = 'AppleCoreMedia/1.0.0.20F71';

		Feed_Detection::detect_and_record();

		$this->assertSame( array( 'spotify' => 'pending' ), get_option( 'podcasting_show_states', array() ) );
	}

	public function test_does_not_promote_empty_state_value() {
		update_option( 'podcasting_show_states', array( 'apple' => '' ) );
		$_SERVER['HTTP_USER_AGENT'] = 'AppleCoreMedia/1.0.0.20F71';

		Feed_Detection::detect_and_record();

		$this->assertSame( array( 'apple' => '' ), get_option( 'podcasting_show_states', array() ) );
	}

	public function test_does_not_rewrite_when_already_active() {
		update_option( 'podcasting_show_states', array( 'spotify' => 'active' ) );
		$_SERVER['HTTP_USER_AGENT'] = 'Spotify/8.7.0 iOS/16.4';

		// Count actual write attempts via the pre-update filter — asserting
		// state-equals-active alone wouldn't distinguish "early-returned" from
		// "wrote the same value back".
		$write_attempts = 0;
		add_filter(
			'pre_update_option_podcasting_show_states',
			static function ( $value ) use ( &$write_attempts ) {
				++$write_attempts;
				return $value;
			}
		);

		Feed_Detection::detect_and_record();

		$this->assertSame( 0, $write_attempts );

		remove_all_filters( 'pre_update_option_podcasting_show_states' );
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
