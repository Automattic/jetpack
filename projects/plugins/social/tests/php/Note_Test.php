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
		$option  = Note::JETPACK_SOCIAL_NOTE_CPT;
		$note    = new Note();
		$inserts = 0;
		$insert  = static function ( $result, $query ) use ( $option, &$inserts ) {
			if ( false !== strpos( $query, 'INSERT IGNORE INTO' ) && false !== strpos( $query, $option ) ) {
				++$inserts;
				add_option( $option, false, '', true );
			}
			return $result;
		};

		delete_option( $option );
		add_filter( 'wordbless_wpdb_query_results', $insert, 10, 2 );
		add_filter( 'wp_doing_cron', '__return_true' );
		try {
			$this->assertSame( 'missing', get_option( $option, 'missing' ) );
			$this->assertFalse( $note->enabled() );
			$this->assertNotSame( 'missing', get_option( $option, 'missing' ) );
			$this->assertFalse( $note->enabled() );
			$this->assertSame( 1, $inserts );

			update_option( $option, true );
			$reads = did_filter( "option_{$option}" );
			$this->assertTrue( $note->enabled() );
			$this->assertSame( $reads + 1, did_filter( "option_{$option}" ) );

			update_option( $option, false );
			$this->assertFalse( $note->enabled() );
			$this->assertSame( 1, $inserts );
		} finally {
			remove_filter( 'wordbless_wpdb_query_results', $insert );
			remove_filter( 'wp_doing_cron', '__return_true' );
		}
	}

	/**
	 * Do not replace an enable saved after the initial missing read.
	 */
	public function test_enabled_preserves_concurrent_enable() {
		$option = Note::JETPACK_SOCIAL_NOTE_CPT;
		$note   = new Note();
		delete_option( $option );

		$injected = false;
		$enable   = static function ( $result, $query ) use ( $option, &$injected ) {
			if ( ! $injected && false !== strpos( $query, 'INSERT IGNORE INTO' ) && false !== strpos( $query, $option ) ) {
				$injected = true;
				add_option( $option, true );
			}
			return $result;
		};
		add_filter( 'wordbless_wpdb_query_results', $enable, 10, 2 );
		add_filter( 'wp_doing_cron', '__return_true' );

		try {
			$this->assertTrue( $note->enabled() );
			$this->assertTrue( (bool) get_option( $option ) );
			$this->assertTrue( $injected );
		} finally {
			remove_filter( 'wordbless_wpdb_query_results', $enable );
			remove_filter( 'wp_doing_cron', '__return_true' );
		}
	}

	/**
	 * Only seed from a safe context without a persistent object cache.
	 */
	public function test_enabled_skips_seeding_on_frontend_and_with_external_cache() {
		$option = Note::JETPACK_SOCIAL_NOTE_CPT;
		$note   = new Note();
		delete_option( $option );

		$this->assertFalse( is_admin() );
		$this->assertFalse( wp_doing_cron() );
		$this->assertFalse( defined( 'WP_CLI' ) && WP_CLI );
		$this->assertFalse( $note->enabled() );
		$this->assertSame( 'missing', get_option( $option, 'missing' ) );

		$was_external = wp_using_ext_object_cache();
		wp_using_ext_object_cache( true );
		add_filter( 'wp_doing_cron', '__return_true' );
		try {
			$this->assertFalse( $note->enabled() );
			$this->assertSame( 'missing', get_option( $option, 'missing' ) );
		} finally {
			remove_filter( 'wp_doing_cron', '__return_true' );
			wp_using_ext_object_cache( $was_external );
		}
	}

	/**
	 * Ignore non-scalar values returned by option filters.
	 */
	public function test_enabled_ignores_non_scalar_option_value() {
		$option = Note::JETPACK_SOCIAL_NOTE_CPT;
		$filter = static function () {
			return array( 'enabled' => true );
		};
		add_option( $option, false );
		add_filter( "option_{$option}", $filter );
		try {
			$this->assertFalse( ( new Note() )->enabled() );
		} finally {
			remove_filter( "option_{$option}", $filter );
		}
	}
}
