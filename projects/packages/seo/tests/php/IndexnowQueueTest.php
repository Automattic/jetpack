<?php
/**
 * IndexNow consent, scope and concurrent-update regressions.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\SEO\Indexnow_Queue
 */
#[CoversClass( Indexnow_Queue::class )]
class IndexnowQueueTest extends SeoTestCase {
	protected function setUp(): void {
		parent::setUp();
		self::set_seo_tools_active( true );
		add_filter( 'rsm_jetpack_seo', '__return_true' );
		update_option( 'blog_public', 1 );
		update_option( Indexnow_Client::ENABLED_OPTION, true );
		update_option( 'home', 'https://example.com' );
		update_option( Indexnow_Client::SCOPE_OPTION, home_url( '/' ) );
	}

	protected function tearDown(): void {
		Indexnow_Queue::clear();
		foreach ( array( Indexnow_Client::ENABLED_OPTION, Indexnow_Client::SCOPE_OPTION, Indexnow_Client::KEY_OPTION, Indexnow_Queue::STATUS_OPTION, Indexnow_Queue::ACCEPTED_OPTION, Indexnow_Queue::GENERATION_OPTION, 'jetpack_seo_indexnow_enqueue_error', 'home' ) as $option ) {
			delete_option( $option );
		}
		remove_filter( 'rsm_jetpack_seo', '__return_true' );
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'jetpack_seo_indexnow_queue_capacity' );
		remove_all_filters( 'jetpack_seo_indexnow_batch_size' );
		remove_all_filters( 'jetpack_seo_indexnow_can_notify' );
		parent::tearDown();
	}

	private function make_pending_due() {
		foreach ( Indexnow_Queue::rows() as $row ) {
			$item        = json_decode( $row['option_value'], true );
			$item['due'] = time() - 1;
			Indexnow_Queue::compare_and_swap( $row, $item );
		}
	}

	public function test_an_old_worker_cannot_delete_a_newer_save() {
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/guide/', 1 ) );
		$row              = Indexnow_Queue::rows()[0];
		$claimed          = json_decode( $row['option_value'], true );
		$claimed['lease'] = time() + 300;
		$this->assertTrue( Indexnow_Queue::compare_and_swap( $row, $claimed ) );
		$old_worker = array(
			'option_name'  => $row['option_name'],
			'option_value' => wp_json_encode( $claimed, JSON_UNESCAPED_SLASHES ),
		);
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/guide/', 1 ) );
		$this->assertFalse( Indexnow_Queue::compare_and_swap( $old_worker, null ) );
		$this->assertCount( 1, Indexnow_Queue::rows() );
	}
	public function test_accepted_notification_does_not_retain_the_url() {
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Public guide',
			)
		);
		$url     = get_permalink( $post_id );
		$this->assertTrue( Indexnow_Queue::enqueue( $url, $post_id ) );
		add_filter(
			'pre_http_request',
			function ( $pre, $args, $target ) use ( $url ) {
				$this->assertSame( Indexnow_Client::ENDPOINT, $target );
				$this->assertSame( array( $url ), json_decode( $args['body'], true )['urlList'] );
				return array(
					'headers'  => array(),
					'body'     => '',
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
				);
			},
			10,
			3
		);
		$this->make_pending_due();
		Indexnow_Queue::work();
		$this->assertCount( 0, Indexnow_Queue::rows() );
		$this->assertSame( 'accepted', get_option( Indexnow_Queue::STATUS_OPTION )['state'] );
	}
	public function test_private_content_is_removed_from_pending_discovery() {
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Public guide',
			)
		);
		$this->assertTrue( Indexnow_Queue::enqueue( get_permalink( $post_id ), $post_id ) );
		wp_update_post(
			array(
				'ID'          => $post_id,
				'post_status' => 'private',
			)
		);
		$calls = 0;
		add_filter(
			'pre_http_request',
			static function () use ( &$calls ) {
				++$calls;
				return new \WP_Error( 'unexpected_network' );
			}
		);
		$this->make_pending_due();
		Indexnow_Queue::work();
		$this->assertSame( 0, $calls );
		$this->assertCount( 0, Indexnow_Queue::rows() );
	}
	public function test_full_queue_refuses_new_work_without_overwriting_admitted_urls() {
		add_filter(
			'jetpack_seo_indexnow_queue_capacity',
			static function () {
				return 3;
			}
		);
		for ( $slot = 0; $slot < 3; ++$slot ) {
			add_option( Indexnow_Queue::PREFIX . $slot, wp_json_encode( array( 'url' => 'https://example.com/admitted/' . $slot ), JSON_UNESCAPED_SLASHES ), '', false );
		}
		$this->assertFalse( Indexnow_Queue::enqueue( 'https://example.com/overflow/', 1 ) );
		$this->assertSame( 3, Indexnow_Queue::size() );
		$this->assertSame( 'queue_full_or_busy', get_option( 'jetpack_seo_indexnow_enqueue_error' )['state'] );
	}
	public function test_domain_changes_drop_pending_urls_before_any_network_request() {
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/guide/', 1, true ) );
		update_option( 'home', 'https://new.example.com' );
		$calls = 0;
		add_filter(
			'pre_http_request',
			static function () use ( &$calls ) {
				++$calls;
				return new \WP_Error( 'unexpected_network' );
			}
		);
		$this->make_pending_due();
		Indexnow_Queue::work();
		$this->assertSame( 0, $calls );
		$this->assertCount( 0, Indexnow_Queue::rows() );
	}
	public function test_expired_work_is_reported_without_retaining_its_url() {
		$url = 'https://example.com/expired-guide/';
		Indexnow_Queue::enqueue( $url, 1, true );
		$row             = Indexnow_Queue::rows()[0];
		$item            = json_decode( $row['option_value'], true );
		$item['created'] = time() - 3 * DAY_IN_SECONDS;
		Indexnow_Queue::compare_and_swap( $row, $item );
		Indexnow_Queue::work();
		$this->assertCount( 0, Indexnow_Queue::rows() );
		$status = get_option( Indexnow_Queue::STATUS_OPTION );
		$this->assertSame( 'expired', $status['state'] );
		$this->assertSame( 1, $status['expired'] );
		$this->assertStringNotContainsString( $url, wp_json_encode( $status, JSON_UNESCAPED_SLASHES ) );
	}
	public function test_key_verification_delay_cannot_turn_into_a_tight_retry_loop() {
		Indexnow_Queue::enqueue( 'https://example.com/guide/', 1, true );
		add_filter(
			'pre_http_request',
			static function () {
				return array(
					'headers'  => array( 'retry-after' => '86400' ),
					'body'     => '',
					'response' => array(
						'code'    => 429,
						'message' => '',
					),
				);
			}
		);
		$this->make_pending_due();
		wp_clear_scheduled_hook( Indexnow_Queue::HOOK );
		Indexnow_Queue::work();
		$item = json_decode( Indexnow_Queue::rows()[0]['option_value'], true );
		$this->assertGreaterThanOrEqual( time() + DAY_IN_SECONDS - 1, $item['due'] );
		$this->assertGreaterThanOrEqual( $item['due'], wp_next_scheduled( Indexnow_Queue::HOOK ) );
	}
	public function test_restricted_deletion_does_not_revive_an_older_removal_notification() {
		$hooks = array_map(
			static function ( $hook ) {
				return clone $hook;
			},
			$GLOBALS['wp_filter']
		);
		try {
			Indexnow_Events::init();
			Indexnow_Queue::init();
			$id = wp_insert_post(
				array(
					'post_status' => 'publish',
					'post_title'  => 'Previously public guide',
				)
			);
			wp_update_post(
				array(
					'ID'          => $id,
					'post_status' => 'draft',
				)
			);
			$this->assertNotEmpty( Indexnow_Queue::rows() );
			wp_update_post(
				array(
					'ID'          => $id,
					'post_status' => 'private',
				)
			);
			wp_delete_post( $id, true );
			$this->make_pending_due();
			$calls = 0;
			add_filter(
				'pre_http_request',
				static function () use ( &$calls ) {
					++$calls;
					return array(
						'response' => array( 'code' => 200 ),
						'headers'  => array(),
						'body'     => '',
					);
				}
			);
			Indexnow_Queue::work();
			$this->assertSame( 0, $calls );
			$this->assertSame( array(), Indexnow_Queue::rows() );
		} finally {
			$GLOBALS['wp_filter'] = $hooks; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}
	}
	public function test_latest_failure_retains_the_last_accepted_batch() {
		$id   = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Delivery status guide',
			)
		);
		$url  = get_permalink( $id );
		$code = 200;
		add_filter(
			'pre_http_request',
			static function () use ( &$code ) {
				return array(
					'response' => array( 'code' => $code ),
					'headers'  => array(),
					'body'     => '',
				);
			}
		);
		Indexnow_Queue::enqueue( $url, $id );
		$this->make_pending_due();
		Indexnow_Queue::work();
		$accepted = get_option( Indexnow_Queue::ACCEPTED_OPTION );
		$this->assertNotNull( $accepted );
		$code = 503;
		Indexnow_Queue::enqueue( $url, $id );
		$this->make_pending_due();
		Indexnow_Queue::work();
		$status = get_option( Indexnow_Queue::STATUS_OPTION );
		$this->assertSame( 'http_503', $status['state'] );
		$this->assertSame( $accepted, get_option( Indexnow_Queue::ACCEPTED_OPTION ) );
	}
	public function test_exhausted_retries_are_reported_after_dropping_the_notification() {
		$id = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Public guide',
			)
		);
		Indexnow_Queue::enqueue( get_permalink( $id ), $id );
		$row             = Indexnow_Queue::rows()[0];
		$item            = json_decode( $row['option_value'], true );
		$item['attempt'] = 5;
		$item['due']     = time() - 1;
		Indexnow_Queue::compare_and_swap( $row, $item );
		add_filter(
			'pre_http_request',
			static function () {
				return array(
					'headers'  => array(),
					'body'     => '',
					'response' => array( 'code' => 503 ),
				);
			}
		);
		Indexnow_Queue::work();
		$this->assertSame( array(), Indexnow_Queue::rows() );
		$this->assertSame( 1, get_option( Indexnow_Queue::STATUS_OPTION )['exhausted'] ?? 0 );
	}
	public function test_received_pending_verification_does_not_consume_retries() {
		Indexnow_Queue::enqueue( 'https://example.com/removed/', 42, true );
		$this->make_pending_due();
		add_filter(
			'pre_http_request',
			static function () {
				return array(
					'headers'  => array(),
					'body'     => '',
					'response' => array( 'code' => 202 ),
				);
			}
		);
		Indexnow_Queue::work();
		$this->assertSame( 0, Indexnow_Queue::size() );
		$this->assertSame( 'verification_pending', get_option( Indexnow_Queue::ACCEPTED_OPTION )['state'] );
		$this->assertSame( 0, get_option( Indexnow_Queue::STATUS_OPTION )['exhausted'] );
	}

	public function test_lowering_capacity_preserves_and_processes_existing_rows() {
		add_filter(
			'jetpack_seo_indexnow_queue_capacity',
			static function () {
				return 3;
			}
		);
		foreach ( array( 'one', 'two', 'three' ) as $slug ) {
			$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/' . $slug, 42, true ) );
		}
		add_filter(
			'jetpack_seo_indexnow_queue_capacity',
			static function () {
				return 1;
			},
			20
		);
		$this->assertFalse( Indexnow_Queue::enqueue( 'https://example.com/four', 42, true ) );
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/one', 42, true ) );
		$this->assertSame( 3, Indexnow_Queue::size() );
		$this->make_pending_due();
		$urls = array();
		add_filter(
			'pre_http_request',
			static function ( $pre, $args ) use ( &$urls ) {
				$urls = json_decode( $args['body'], true )['urlList'];
				return array(
					'headers'  => array(),
					'body'     => '',
					'response' => array( 'code' => 200 ),
				);
			},
			10,
			2
		);
		Indexnow_Queue::work();
		sort( $urls );
		$this->assertSame( array( 'https://example.com/one', 'https://example.com/three', 'https://example.com/two' ), $urls );
		$this->assertSame( 0, Indexnow_Queue::size() );
	}

	/**
	 * @dataProvider throttling_headers
	 * @param array $headers Response headers.
	 * @param int   $minimum Minimum pause in seconds.
	 */
	#[DataProvider( 'throttling_headers' )]
	public function test_throttling_stops_new_urls_as_well_as_retries( $headers, $minimum ) {
		Indexnow_Queue::enqueue( 'https://example.com/first', 42, true );
		$this->make_pending_due();
		$calls = 0;
		add_filter(
			'pre_http_request',
			static function () use ( &$calls, $headers ) {
				++$calls;
				return array(
					'headers'  => $headers,
					'body'     => '',
					'response' => array( 'code' => 429 ),
				);
			}
		);
		Indexnow_Queue::work();
		$this->assertGreaterThanOrEqual( time() + $minimum - 1, get_option( Indexnow_Queue::COOLDOWN_OPTION ) );
		Indexnow_Queue::enqueue( 'https://example.com/second', 42, true );
		$this->make_pending_due();
		Indexnow_Queue::work();
		$this->assertSame( 1, $calls );
		$this->assertSame( 2, Indexnow_Queue::size() );
	}

	public function test_expired_worker_lock_recovers_without_erasing_a_new_save() {
		Indexnow_Queue::enqueue( 'https://example.com/removed', 42, true );
		$this->make_pending_due();
		update_option(
			Indexnow_Queue::WORKER_LOCK,
			wp_json_encode(
				array(
					'owner'   => 'dead',
					'expires' => time() - 1,
				),
				JSON_UNESCAPED_SLASHES
			),
			false
		);
		add_filter(
			'pre_http_request',
			static function () {
				Indexnow_Queue::enqueue( 'https://example.com/removed', 42, true );
				return array(
					'headers'  => array(),
					'body'     => '',
					'response' => array( 'code' => 200 ),
				);
			}
		);
		Indexnow_Queue::work();
		$this->assertSame( 1, Indexnow_Queue::size() );
		$this->assertFalse( get_option( Indexnow_Queue::WORKER_LOCK ) );
	}

	public function test_provider_pause_preserves_pending_work() {
		Indexnow_Queue::enqueue( 'https://example.com/removed', 42, true );
		add_filter( 'jetpack_seo_indexnow_can_notify', '__return_false' );
		Indexnow_Queue::work();
		$this->assertSame( 1, Indexnow_Queue::size() );
	}

	public function test_stale_local_option_cache_cannot_block_a_released_admission_lock() {
		wp_cache_set(
			Indexnow_Queue::ADMISSION_LOCK,
			wp_json_encode(
				array(
					'owner'   => 'other-request',
					'expires' => time() + 60,
				),
				JSON_UNESCAPED_SLASHES
			),
			'options'
		);
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/new', 42, true ) );
		$this->assertSame( 1, Indexnow_Queue::size() );
	}

	public function test_large_batch_filter_keeps_payload_memory_bounded_and_remaining_urls_pending() {
		add_filter(
			'jetpack_seo_indexnow_batch_size',
			static function () {
				return 10000;
			}
		);
		for ( $i = 0; $i < 600; ++$i ) {
			$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/' . str_repeat( 'a', 1900 ) . '/' . $i, 42, true ) );
		}
		$after = '';
		$rows  = Indexnow_Queue::rows( 250, $after );
		while ( $rows ) {
			foreach ( $rows as $row ) {
				$after       = $row['option_name'];
				$item        = json_decode( $row['option_value'], true );
				$item['due'] = time() - 1;
				Indexnow_Queue::compare_and_swap( $row, $item );
			}
			$rows = Indexnow_Queue::rows( 250, $after );
		}
		$sent = array();
		add_filter(
			'pre_http_request',
			static function ( $pre, $args ) use ( &$sent ) {
				$sent = json_decode( $args['body'], true )['urlList'];
				return array(
					'headers'  => array(),
					'body'     => '',
					'response' => array( 'code' => 200 ),
				);
			},
			10,
			2
		);
		Indexnow_Queue::work();
		$this->assertNotEmpty( $sent );
		$this->assertLessThan( 600, count( $sent ) );
		$this->assertSame( 600 - count( $sent ), Indexnow_Queue::size() );
		$this->assertSameSize( $sent, array_unique( $sent ) );
	}
	public function test_vip_preserves_saved_work_without_admitting_or_delivering() {
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/retained', 42, true ) );
		\Automattic\Jetpack\Constants::set_constant( 'WPCOM_IS_VIP_ENV', true );
		try {
			$this->assertFalse( Indexnow_Client::enabled() );
			$this->assertFalse( Indexnow_Queue::enqueue( 'https://example.com/new', 42, true ) );
			Indexnow_Queue::work();
			Indexnow_Queue::clear();
			$this->assertSame( 1, Indexnow_Queue::size() );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'WPCOM_IS_VIP_ENV' );
		}
	}

	public function test_invalid_filters_fall_back_and_protocol_limits_remain_enforced() {
		add_filter(
			'jetpack_seo_indexnow_queue_capacity',
			static function () {
				return array();
			}
		);
		add_filter(
			'jetpack_seo_indexnow_batch_size',
			static function () {
				return 'invalid';
			}
		);
		$this->assertSame( 10000, Indexnow_Queue::capacity() );
		$this->assertSame( 100, Indexnow_Client::batch_size() );
		add_filter(
			'jetpack_seo_indexnow_queue_capacity',
			static function () {
				return 1000000;
			},
			20
		);
		add_filter(
			'jetpack_seo_indexnow_batch_size',
			static function () {
				return 10001;
			},
			20
		);
		$this->assertSame( 50000, Indexnow_Queue::capacity() );
		$this->assertSame( 10000, Indexnow_Client::batch_size() );
	}
	public function test_disable_and_reenable_during_admission_cannot_restore_stale_work() {
		$intercepted = false;
		$interrupt   = static function ( $query ) use ( &$intercepted ) {
			if ( ! $intercepted && strpos( $query, 'INSERT INTO' ) === 0 && strpos( $query, 'SELECT' ) !== false ) {
				$intercepted = true;
				update_option( Indexnow_Client::ENABLED_OPTION, false );
				Indexnow_Queue::clear();
				update_option( Indexnow_Client::ENABLED_OPTION, true );
			}
			return $query;
		};
		add_filter( 'query', $interrupt );
		try {
			$this->assertFalse( Indexnow_Queue::enqueue( 'https://example.com/interrupted', 42, true ) );
			$this->assertTrue( $intercepted );
			$this->assertSame( 0, Indexnow_Queue::size() );
		} finally {
			remove_filter( 'query', $interrupt );
		}
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/fresh', 42, true ) );
	}

	/** @dataProvider replacement_interruptions */
	#[DataProvider( 'replacement_interruptions' )]
	public function test_replacing_a_url_cannot_cross_a_queue_reset( $before_read ) {
		$url = 'https://example.com/replaced';
		$this->assertTrue( Indexnow_Queue::enqueue( $url, 42, true ) );
		$name        = Indexnow_Queue::PREFIX . hash( 'sha256', $url );
		$intercepted = false;
		$fresh       = null;
		$interrupt   = static function ( $query ) use ( $before_read, $url, $name, &$intercepted, &$fresh ) {
			$operation = $before_read ? 'SELECT option_name, option_value' : 'UPDATE';
			if ( ! $intercepted && strpos( $query, $operation ) === 0 && strpos( $query, $name ) !== false ) {
				$intercepted = true;
				if ( $before_read ) {
					update_option( Indexnow_Client::ENABLED_OPTION, false );
					Indexnow_Queue::clear();
					update_option( Indexnow_Client::ENABLED_OPTION, true );
					Indexnow_Queue::enqueue( $url, 43, true );
				} else {
					// A concurrent clear has advanced the fence but has not yet deleted the old rows.
					update_option( Indexnow_Queue::GENERATION_OPTION, wp_generate_uuid4(), false );
				}
				$fresh = Indexnow_Queue::rows()[0]['option_value'];
			}
			return $query;
		};
		add_filter( 'query', $interrupt );
		try {
			$this->assertFalse( Indexnow_Queue::enqueue( $url, 42, true ) );
			$this->assertTrue( $intercepted );
			$this->assertSame( $fresh, Indexnow_Queue::rows()[0]['option_value'] );
		} finally {
			remove_filter( 'query', $interrupt );
		}
	}

	public static function replacement_interruptions() {
		return array(
			'reset before row read'          => array( true ),
			'reset before conditional write' => array( false ),
		);
	}
	public function test_failed_insert_is_not_admitted_and_releases_the_lock() {
		$fail_insert = static function ( $query ) {
			return strpos( $query, 'INSERT INTO' ) === 0 && strpos( $query, 'database-failure' ) !== false ? '' : $query;
		};
		global $wpdb;
		$previous_errors = $wpdb->suppress_errors( true );
		add_filter( 'query', $fail_insert );
		try {
			$this->assertFalse( Indexnow_Queue::enqueue( 'https://example.com/database-failure', 42, true ) );
			$this->assertSame( 0, Indexnow_Queue::size() );
			$this->assertFalse( get_option( Indexnow_Queue::ADMISSION_LOCK ) );
		} finally {
			remove_filter( 'query', $fail_insert );
			$wpdb->suppress_errors( $previous_errors );
		}
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/recovered', 42, true ) );
	}
	public static function throttling_headers() {
		return array(
			'explicit retry time' => array( array( 'retry-after' => '1200' ), 1200 ),
			'no retry header'     => array( array(), 600 ),
		);
	}
}
