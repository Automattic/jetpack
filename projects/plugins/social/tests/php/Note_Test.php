<?php
/**
 * Social Notes tests.
 *
 * @package automattic/jetpack-social-plugin
 */

use Automattic\Jetpack\Social\Note;
use WorDBless\BaseTestCase;

/**
 * Social Notes tests.
 */
class Note_Test extends BaseTestCase {
	/**
	 * Remove the option after the test.
	 */
	public function tear_down() {
		delete_option( Note::JETPACK_SOCIAL_NOTE_CPT );
	}

	/**
	 * Seed missing options without changing stored enabled or disabled values.
	 */
	public function test_enabled_seeds_missing_option_and_preserves_existing_values() {
		$option = Note::JETPACK_SOCIAL_NOTE_CPT;
		$note   = new Note();

		delete_option( $option );
		$this->assertSame( 'missing', get_option( $option, 'missing' ) );
		$this->assertFalse( $note->enabled() );
		$this->assertNotSame( 'missing', get_option( $option, 'missing' ) );

		update_option( $option, true );
		$this->assertTrue( $note->enabled() );

		update_option( $option, false );
		$this->assertFalse( $note->enabled() );
	}
}
