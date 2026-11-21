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
		foreach ( array( Indexnow_Client::ENABLED_OPTION, Indexnow_Client::SCOPE_OPTION, Indexnow_Client::KEY_OPTION, Indexnow_Queue::STATUS_OPTION, Indexnow_Queue::ACCEPTED_OPTION, Indexnow_Queue::GENERATION_OPTION, Indexnow_Queue::ADMISSION_LOCK, 'jetpack_seo_indexnow_enqueue_error', 'home' ) as $option ) {
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

	/** @dataProvider scope_scheme_changes */
	#[DataProvider( 'scope_scheme_changes' )]
	public function test_pending_notifications_deliver_after_a_filtered_scheme_change( $saved_scheme, $worker_scheme ) {
		update_option( 'home', $saved_scheme . '://example.com/blog' );
		update_option( Indexnow_Client::SCOPE_OPTION, $saved_scheme . '://example.com/blog/' );
		$url = $saved_scheme . '://example.com/blog/removed/';
		$this->assertTrue( Indexnow_Queue::enqueue( $url, 42, true ) );
		$this->make_pending_due();
		$resolve = static function ( $home ) use ( $worker_scheme ) {
			return set_url_scheme( $home, $worker_scheme );
		};
		$calls   = 0;
		$submit  = function ( $pre, $args ) use ( $url, $worker_scheme, &$calls ) {
			++$calls;
			$payload = json_decode( $args['body'], true );
			$this->assertSame( array( $url ), $payload['urlList'] );
			$this->assertSame( $worker_scheme . '://example.com/blog/' . Indexnow_Client::key() . '.txt', $payload['keyLocation'] );
			return array(
				'headers'  => array(),
				'body'     => '',
				'response' => array( 'code' => 200 ),
			);
		};
		add_filter( 'home_url', $resolve );
		add_filter( 'pre_http_request', $submit, 10, 2 );
		try {
			Indexnow_Queue::work();
			$this->assertSame( 1, $calls );
			$this->assertSame( 0, Indexnow_Queue::size() );
			$this->assertSame( 'accepted', get_option( Indexnow_Queue::STATUS_OPTION )['state'] ?? null );
		} finally {
			remove_filter( 'home_url', $resolve );
			remove_filter( 'pre_http_request', $submit );
		}
	}

	public static function scope_scheme_changes() {
		return array(
			'HTTP capture, HTTPS worker' => array( 'http', 'https' ),
			'HTTPS capture, HTTP worker' => array( 'https', 'http' ),
		);
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
		$started_at = time();
		Indexnow_Queue::work();
		$item = json_decode( Indexnow_Queue::rows()[0]['option_value'], true );
		$this->assertGreaterThanOrEqual( $started_at + DAY_IN_SECONDS, $item['due'] );
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
	/** @dataProvider summary_cache_states */
	#[DataProvider( 'summary_cache_states' )]
	public function test_latest_failure_retains_the_last_accepted_batch( $cached ) {
		if ( $cached ) {
			$alloptions                                    = wp_load_alloptions();
			$alloptions[ Indexnow_Queue::STATUS_OPTION ]   = maybe_serialize( array( 'state' => 'stale' ) );
			$alloptions[ Indexnow_Queue::ACCEPTED_OPTION ] = maybe_serialize( array( 'state' => 'stale' ) );
			wp_cache_set( 'alloptions', $alloptions, 'options' );
		}
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
		$this->assertSame( 'accepted', $accepted['state'] ?? null );
		$code = 503;
		Indexnow_Queue::enqueue( $url, $id );
		$this->make_pending_due();
		Indexnow_Queue::work();
		$status = get_option( Indexnow_Queue::STATUS_OPTION );
		$this->assertSame( 'http_503', $status['state'] );
		$this->assertSame( $accepted, get_option( Indexnow_Queue::ACCEPTED_OPTION ) );
	}

	public static function summary_cache_states() {
		return array(
			'individual options'     => array( false ),
			'complete options cache' => array( true ),
		);
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
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', false );
		try {
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
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}
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

	/** @dataProvider reset_delivery_responses */
	#[DataProvider( 'reset_delivery_responses' )]
	public function test_a_reset_during_delivery_cannot_restore_old_status( $response_code, $during_write ) {
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/old', 42, true ) );
		$this->make_pending_due();
		$receipt = array(
			'state' => 'accepted',
			'time'  => 100,
			'count' => 1,
		);
		update_option( Indexnow_Queue::ACCEPTED_OPTION, $receipt, false );
		$reset = static function () {
			update_option( Indexnow_Client::ENABLED_OPTION, false );
			Indexnow_Queue::clear();
			delete_option( Indexnow_Queue::STATUS_OPTION );
			update_option( Indexnow_Client::ENABLED_OPTION, true );
			Indexnow_Queue::enqueue( 'https://example.com/new', 43, true );
		};
		add_filter(
			'pre_http_request',
			static function () use ( $response_code, $during_write, $reset ) {
				if ( ! $during_write ) {
					$reset(); }
				return array(
					'headers'  => array(),
					'body'     => '',
					'response' => array( 'code' => $response_code ),
				);
			}
		);
		$option      = 200 === $response_code ? Indexnow_Queue::ACCEPTED_OPTION : ( 429 === $response_code ? Indexnow_Queue::COOLDOWN_OPTION : Indexnow_Queue::STATUS_OPTION );
		$intercepted = false;
		$interrupt   = static function ( $query ) use ( $during_write, $option, $reset, &$intercepted ) {
			if ( $during_write && ! $intercepted && preg_match( '/^(INSERT|UPDATE) /', $query ) && false !== strpos( $query, $option ) ) {
				$intercepted = true;
				$reset();
			}
			return $query;
		};
		add_filter( 'query', $interrupt );
		try {
			Indexnow_Queue::work();
			$this->assertSame( $during_write, $intercepted );
			$this->assertFalse( get_option( Indexnow_Queue::STATUS_OPTION ) );
			$this->assertSame( $receipt, get_option( Indexnow_Queue::ACCEPTED_OPTION ) );
			$this->assertFalse( get_option( Indexnow_Queue::COOLDOWN_OPTION ) );
			$this->assertSame( 'https://example.com/new', json_decode( Indexnow_Queue::rows()[0]['option_value'], true )['url'] );
		} finally {
			remove_filter( 'query', $interrupt );
		}
	}

	public static function reset_delivery_responses() {
		return array(
			'accepted during HTTP'        => array( 200, false ),
			'server failure during HTTP'  => array( 500, false ),
			'throttled during HTTP'       => array( 429, false ),
			'accepted before write'       => array( 200, true ),
			'server failure before write' => array( 500, true ),
			'throttled before write'      => array( 429, true ),
		);
	}
	public function test_option_opt_out_resets_work_without_the_settings_endpoint() {
		$hooks = array_map(
			static function ( $hook ) {
				return clone $hook;
			},
			$GLOBALS['wp_filter']
		);
		try {
			Indexnow_Queue::init();
			$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/old', 42, true ) );
			$generation = get_option( Indexnow_Queue::GENERATION_OPTION );
			update_option( Indexnow_Queue::COOLDOWN_OPTION, time() + DAY_IN_SECONDS, false );
			update_option( Indexnow_Client::ENABLED_OPTION, false );
			update_option( Indexnow_Client::ENABLED_OPTION, true );
			$this->assertNotSame( $generation, get_option( Indexnow_Queue::GENERATION_OPTION ) );
			$this->assertSame( 0, Indexnow_Queue::size() );
			$this->assertFalse( get_option( Indexnow_Queue::COOLDOWN_OPTION ) );
			$this->assertFalse( wp_next_scheduled( Indexnow_Queue::HOOK ) );
			$this->assertFalse( wp_next_scheduled( Indexnow_Queue::RECOVERY_HOOK ) );
			$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/fresh', 43, true ) );
		} finally {
			$GLOBALS['wp_filter'] = $hooks; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}
	}

	public function test_retry_cannot_escape_an_opt_out_between_the_clear_snapshot_and_delete() {
		global $wpdb;
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/old', 42, true ) );
		$this->make_pending_due();
		add_filter(
			'pre_http_request',
			static function () {
				return array(
					'response' => array( 'code' => 503 ),
					'headers'  => array(),
					'body'     => '',
				);
			}
		);
		$intercepted = false;
		$replayed    = false;
		$interrupt   = static function ( $query ) use ( &$intercepted, &$replayed, $wpdb ) {
			if ( $intercepted || 0 !== strpos( $query, 'UPDATE ' ) || false === strpos( $query, Indexnow_Queue::PREFIX ) || false === strpos( stripslashes( $query ), '"attempt":1' ) ) {
				return $query;
			}
			$intercepted = true;
			$replay      = static function ( $deletion ) use ( $query, &$replayed, $wpdb ) {
				if ( ! $replayed && 0 === strpos( $deletion, 'DELETE FROM' ) && false !== strpos( $deletion, Indexnow_Queue::PREFIX ) ) {
					$replayed = true;
					$wpdb->query( $query ); // phpcs:ignore WordPress.DB -- Replay the intercepted worker statement at the actual deletion boundary.
				}
				return $deletion;
			};
			add_filter( 'query', $replay, 20 );
			try {
				update_option( Indexnow_Client::ENABLED_OPTION, false );
				Indexnow_Queue::clear();
			} finally {
				remove_filter( 'query', $replay, 20 );
			}
			return 'SELECT 1 WHERE 0';
		};
		add_filter( 'query', $interrupt );
		try {
			Indexnow_Queue::work();
			$this->assertTrue( $intercepted );
			$this->assertTrue( $replayed );
			$this->assertSame( array(), Indexnow_Queue::rows() );
		} finally {
			remove_filter( 'query', $interrupt );
		}
	}

	public function test_clearing_a_never_used_queue_does_not_create_state() {
		delete_option( Indexnow_Queue::GENERATION_OPTION );
		Indexnow_Queue::clear_if_used();
		$this->assertFalse( get_option( Indexnow_Queue::GENERATION_OPTION ) );
	}

	public function test_status_write_preserves_an_unrelated_autoload_cache() {
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/old', 42, true ) );
		$cached = wp_load_alloptions();
		unset( $cached[ Indexnow_Queue::STATUS_OPTION ] );
		$cached['seo_cache_marker'] = 'retained';
		wp_cache_set( 'alloptions', $cached, 'options' );
		$this->invoke_private( Indexnow_Queue::class, 'store_status_option', Indexnow_Queue::STATUS_OPTION, array( 'state' => 'accepted' ), get_option( Indexnow_Queue::GENERATION_OPTION ) );
		if ( ( new \Automattic\Jetpack\Status\Host() )->is_wpcom_simple() ) {
			$this->assertFalse( wp_cache_get( 'alloptions', 'options' ) );
		} else {
			$this->assertSame( 'retained', wp_cache_get( 'alloptions', 'options' )['seo_cache_marker'] ?? null );
		}
	}

	public function test_direct_clear_removes_actionable_history_but_retains_a_confirmed_receipt() {
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/old', 42, true ) );
		update_option( Indexnow_Queue::STATUS_OPTION, array( 'state' => 'http_429' ), false );
		update_option( 'jetpack_seo_indexnow_enqueue_error', array( 'state' => 'queue_full_or_busy' ), false );
		$receipt = array(
			'state' => 'accepted',
			'time'  => time(),
			'count' => 1,
		);
		update_option( Indexnow_Queue::ACCEPTED_OPTION, $receipt, false );
		Indexnow_Queue::clear();
		$this->assertFalse( get_option( Indexnow_Queue::STATUS_OPTION ) );
		$this->assertFalse( get_option( 'jetpack_seo_indexnow_enqueue_error' ) );
		$this->assertSame( $receipt, get_option( Indexnow_Queue::ACCEPTED_OPTION ) );
		update_option( Indexnow_Queue::ACCEPTED_OPTION, array( 'state' => 'verification_pending' ), false );
		Indexnow_Queue::clear();
		$this->assertFalse( get_option( Indexnow_Queue::ACCEPTED_OPTION ) );
	}

	/** @dataProvider enqueue_warning_recoveries */
	#[DataProvider( 'enqueue_warning_recoveries' )]
	public function test_receipt_clears_an_old_enqueue_warning_without_losing_a_newer_failure( $code, $new_failure ) {
		add_filter(
			'jetpack_seo_indexnow_queue_capacity',
			static function () {
				return 1;
			}
		);
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/pending', 42, true ) );
		$this->assertFalse( Indexnow_Queue::enqueue( 'https://example.com/overflow', 43, true ) );
		$old = get_option( 'jetpack_seo_indexnow_enqueue_error' );
		$this->make_pending_due();
		$new = null;
		add_filter(
			'pre_http_request',
			static function () use ( $code, $new_failure, &$new ) {
				if ( $new_failure ) {
					Indexnow_Queue::enqueue( 'https://example.com/new-overflow', 44, true );
					$new = get_option( 'jetpack_seo_indexnow_enqueue_error' );
				}
				return array(
					'response' => array( 'code' => $code ),
					'headers'  => array(),
					'body'     => '',
				);
			}
		);
		Indexnow_Queue::work();
		if ( $new_failure ) {
			$this->assertNotSame( $old['version'], $new['version'] );
			$this->assertSame( $new, get_option( 'jetpack_seo_indexnow_enqueue_error' ) );
		} elseif ( 503 === $code ) {
			$this->assertSame( $old, get_option( 'jetpack_seo_indexnow_enqueue_error' ) );
		} else {
			$this->assertFalse( get_option( 'jetpack_seo_indexnow_enqueue_error' ) );
		}
	}

	public static function enqueue_warning_recoveries() {
		return array(
			'accepted'                   => array( 200, false ),
			'received'                   => array( 202, false ),
			'failed'                     => array( 503, false ),
			'new failure during receipt' => array( 200, true ),
		);
	}

	/** @dataProvider delivery_dispositions */
	#[DataProvider( 'delivery_dispositions' )]
	public function test_status_distinguishes_retained_retries_from_dropped_notifications( $code, $attempt, $retrying, $dropped, $exhausted, $newer = false ) {
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/pending', 42, true ) );
		$row             = Indexnow_Queue::rows()[0];
		$item            = json_decode( $row['option_value'], true );
		$item['attempt'] = $attempt;
		$item['due']     = time() - 1;
		Indexnow_Queue::compare_and_swap( $row, $item );
		add_filter(
			'pre_http_request',
			static function () use ( $code, $newer ) {
				if ( $newer ) {
					Indexnow_Queue::enqueue( 'https://example.com/pending', 42, true );
				}
				return array(
					'response' => array( 'code' => $code ),
					'headers'  => array(),
					'body'     => '',
				);
			}
		);
		Indexnow_Queue::work();
		$status = get_option( Indexnow_Queue::STATUS_OPTION );
		$this->assertSame( $retrying, $status['retrying'] );
		$this->assertSame( $dropped, $status['dropped'] );
		$this->assertSame( $exhausted, $status['exhausted'] );
		$this->assertSame( $retrying + (int) $newer, Indexnow_Queue::size() );
	}

	public static function delivery_dispositions() {
		return array(
			'permanent rejection'              => array( 404, 0, 0, 1, 0 ),
			'temporary failure'                => array( 503, 0, 1, 0, 0 ),
			'exhausted retries'                => array( 503, 5, 0, 0, 1 ),
			'newer save after rejection'       => array( 404, 0, 0, 0, 0, true ),
			'newer save after exhausted retry' => array( 503, 5, 0, 0, 0, true ),
		);
	}

	/** @dataProvider clear_interruptions */
	#[DataProvider( 'clear_interruptions' )]
	public function test_clear_preserves_new_generation_work_and_schedules( $phase ) {
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/old', 42, true ) );
		$intercepted = false;
		$fresh       = null;
		$admit       = static function () use ( &$intercepted, &$fresh ) {
			$intercepted = true;
			$fresh       = Indexnow_Queue::enqueue( 'https://example.com/fresh', 43, true );
		};
		$rotate      = static function () use ( $phase, $admit ) {
			if ( 'after rotation' === $phase ) {
				$admit();
			}
		};
		$delete      = static function ( $query ) use ( $phase, $admit, &$intercepted ) {
			if ( 'during deletion' === $phase && ! $intercepted && strpos( $query, 'DELETE FROM' ) === 0 && strpos( $query, Indexnow_Queue::PREFIX ) !== false ) {
				$intercepted = true;
				Indexnow_Queue::clear();
				$admit();
			}
			return $query;
		};
		$schedule    = static function ( $pre, $hook ) use ( $phase, $admit, &$intercepted ) {
			if ( 'before unscheduling' === $phase && ! $intercepted && Indexnow_Queue::HOOK === $hook ) {
				$admit();
			}
			return $pre;
		};
		add_action( 'update_option_' . Indexnow_Queue::GENERATION_OPTION, $rotate );
		add_filter( 'query', $delete );
		add_filter( 'pre_clear_scheduled_hook', $schedule, 10, 2 );
		try {
			Indexnow_Queue::clear();
			$this->assertTrue( $intercepted );
			$this->assertTrue( $fresh );
			$rows = Indexnow_Queue::rows();
			$this->assertCount( 1, $rows );
			$item = json_decode( $rows[0]['option_value'], true );
			$this->assertSame( 'https://example.com/fresh', $item['url'] );
			$this->assertSame( get_option( Indexnow_Queue::GENERATION_OPTION ), $item['generation'] );
			$this->assertNotFalse( wp_next_scheduled( Indexnow_Queue::HOOK ) );
			$this->assertNotFalse( wp_next_scheduled( Indexnow_Queue::RECOVERY_HOOK ) );
		} finally {
			remove_action( 'update_option_' . Indexnow_Queue::GENERATION_OPTION, $rotate );
			remove_filter( 'query', $delete );
			remove_filter( 'pre_clear_scheduled_hook', $schedule );
		}
	}

	public static function clear_interruptions() {
		return array(
			'new generation admitted during clear'    => array( 'after rotation' ),
			'newer clear and admission before delete' => array( 'during deletion' ),
			'admission before schedule cleanup'       => array( 'before unscheduling' ),
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
		} finally {
			remove_filter( 'query', $fail_insert );
			$wpdb->suppress_errors( $previous_errors );
		}
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/recovered', 42, true ) );
	}
	public function test_normal_updates_coalesce_by_post_without_storing_the_url() {
		$id = $this->publish();
		$this->assertTrue( Indexnow_Queue::enqueue( get_permalink( $id ), $id ) );
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/a-new-address/', $id ) );
		$rows = Indexnow_Queue::rows();
		$this->assertCount( 1, $rows );
		$item = json_decode( $rows[0]['option_value'], true );
		$this->assertSame( $id, $item['post'] );
		$this->assertArrayNotHasKey( 'url', $item );
	}

	public function test_url_snapshots_survive_beside_the_normal_post_record() {
		$id  = $this->publish();
		$url = get_permalink( $id );
		$this->assertTrue( Indexnow_Queue::enqueue( $url, $id ) );
		$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/previous-address/', $id, true ) );
		$urls = array();
		$http = static function ( $pre, $args ) use ( &$urls ) {
			$urls = json_decode( $args['body'], true )['urlList'];
			return array(
				'headers'  => array(),
				'body'     => '',
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
			);
		};
		add_filter( 'pre_http_request', $http, 10, 2 );
		$this->make_pending_due();
		Indexnow_Queue::work();
		sort( $urls );
		$expected = array( $url, 'https://example.com/previous-address/' );
		sort( $expected );
		$this->assertSame( $expected, $urls );
		$this->assertSame( 0, Indexnow_Queue::size() );
	}

	public function test_legacy_and_id_rows_deliver_the_same_url_only_once() {
		global $wpdb;
		$id  = $this->publish();
		$url = get_permalink( $id );
		$this->assertTrue( Indexnow_Queue::enqueue( $url, $id ) );
		$item        = json_decode( Indexnow_Queue::rows()[0]['option_value'], true );
		$item['url'] = $url;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Reproduce a notification persisted by the URL-only worker.
		$wpdb->insert(
			$wpdb->options,
			array(
				'option_name'  => Indexnow_Queue::PREFIX . hash( 'sha256', $url ),
				'option_value' => wp_json_encode( $item, JSON_UNESCAPED_SLASHES ),
				'autoload'     => 'no',
			)
		);
		$this->assertSame( 2, Indexnow_Queue::size() );
		$http = function ( $pre, $args ) use ( $url ) {
			$this->assertSame( array( $url ), json_decode( $args['body'], true )['urlList'] );
			return array(
				'headers'  => array(),
				'body'     => '',
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
			);
		};
		add_filter( 'pre_http_request', $http, 10, 2 );
		$this->make_pending_due();
		Indexnow_Queue::work();
		$this->assertSame( 0, Indexnow_Queue::size() );
		$this->assertSame( 1, get_option( Indexnow_Queue::STATUS_OPTION )['count'] );
	}

	public function test_simple_counts_unicode_bytes_and_preserves_unchanged_records_at_capacity() {
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );
		try {
			$id = $this->publish();
			$this->assertTrue( Indexnow_Queue::enqueue( get_permalink( $id ), $id ) );
			update_option( 'indexnow_test_padding', str_repeat( 'é', 380000 ), false );
			$this->assertFalse( Indexnow_Queue::enqueue( 'https://example.com/another/', $id + 1, true ) );
			$this->assertTrue( Indexnow_Queue::enqueue( get_permalink( $id ), $id ) );
			$this->assertSame( 1, Indexnow_Queue::size() );
			delete_option( 'indexnow_test_padding' );
			$this->assertTrue( Indexnow_Queue::enqueue( 'https://example.com/another/', $id + 1, true ) );
		} finally {
			delete_option( 'indexnow_test_padding' );
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	public function test_simple_refuses_a_growing_replacement_without_overwriting_it() {
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );
		try {
			$url = 'https://example.com/removed-address/';
			$this->assertTrue( Indexnow_Queue::enqueue( $url, 1, true ) );
			$old = Indexnow_Queue::rows()[0];
			update_option( 'indexnow_test_padding', str_repeat( 'é', 380000 ), false );
			$this->assertFalse( Indexnow_Queue::enqueue( $url, 999999999, true ) );
			$this->assertSame( $old, Indexnow_Queue::rows()[0] );
		} finally {
			delete_option( 'indexnow_test_padding' );
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	/**
	 * @dataProvider simple_admission_interruptions
	 * @param string $phase Interruption before the admission statement executes.
	 */
	#[DataProvider( 'simple_admission_interruptions' )]
	public function test_simple_admission_uses_current_quota_and_ownership( $phase ) {
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );
		$intercepted = false;
		$interrupt   = static function ( $query ) use ( &$intercepted, $phase ) {
			if ( ! $intercepted && ( ( 'quota' === $phase && strpos( $query, 'SELECT COALESCE(SUM(OCTET_LENGTH' ) === 0 ) || ( 'quota' !== $phase && strpos( $query, 'INSERT INTO' ) === 0 && strpos( $query, 'AS queue_owner' ) !== false ) ) ) {
				$intercepted = true;
				if ( 'quota' === $phase ) {
					update_option( 'indexnow_test_padding', str_repeat( 'é', 380000 ), false );
				} elseif ( 'lock' === $phase ) {
					update_option(
						Indexnow_Queue::ADMISSION_LOCK,
						wp_json_encode(
							array(
								'owner'   => 'new-owner',
								'expires' => time() + 60,
							),
							JSON_UNESCAPED_SLASHES
						),
						false
					);
				} else {
					Indexnow_Queue::clear();
				}
			}
			return $query;
		};
		add_filter( 'query', $interrupt );
		try {
			$this->assertFalse( Indexnow_Queue::enqueue( 'https://example.com/interrupted/', 42, true ) );
			$this->assertTrue( $intercepted );
			$this->assertSame( 0, Indexnow_Queue::size() );
			if ( 'generation' === $phase ) {
				$this->assertFalse( get_option( 'jetpack_seo_indexnow_enqueue_error' ) );
			}
		} finally {
			remove_filter( 'query', $interrupt );
			delete_option( 'indexnow_test_padding' );
			delete_option( Indexnow_Queue::ADMISSION_LOCK );
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	public function test_late_permalink_growth_cannot_bypass_the_delivery_byte_budget() {
		$long    = false;
		$claimed = 0;
		$link    = static function ( $url, $post ) use ( &$long ) {
			return home_url( '/' . ( $long ? str_repeat( 'a', 1900 ) : 'short' ) . '/' . $post->ID );
		};
		$grow    = static function ( $query ) use ( &$long, &$claimed ) {
			if ( strpos( $query, 'SELECT option_name, option_value' ) === 0 && strpos( $query, 'option_name IN (' ) !== false ) {
				$long    = true;
				$claimed = substr_count( $query, Indexnow_Queue::PREFIX . 'p_' );
			}
			return $query;
		};
		add_filter( 'post_link', $link, 10, 2 );
		add_filter(
			'jetpack_seo_indexnow_batch_size',
			static function () {
				return 10000;
			}
		);
		try {
			for ( $i = 0; $i < 600; ++$i ) {
				$id = wp_insert_post(
					array(
						'post_title'  => 'Late permalink ' . $i,
						'post_status' => 'publish',
					)
				);
				$this->assertTrue( Indexnow_Queue::enqueue( get_permalink( $id ), $id ) );
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
				function ( $pre, $args ) use ( &$sent ) {
					$this->assertLessThan( 1048576, strlen( $args['body'] ) );
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
			add_filter( 'query', $grow );
			Indexnow_Queue::work();
			$this->assertTrue( $long );
			$this->assertSame( 600, $claimed );
			$this->assertNotEmpty( $sent );
			$this->assertLessThan( 600, count( $sent ) );
			$this->assertSame( 600 - count( $sent ), Indexnow_Queue::size() );
		} finally {
			remove_filter( 'query', $grow );
			remove_filter( 'post_link', $link, 10 );
		}
	}

	public static function simple_admission_interruptions() {
		return array(
			'quota fills'  => array( 'quota' ),
			'lock changes' => array( 'lock' ),
			'queue resets' => array( 'generation' ),
		);
	}

	public static function throttling_headers() {
		return array(
			'explicit retry time' => array( array( 'retry-after' => '1200' ), 1200 ),
			'no retry header'     => array( array(), 600 ),
		);
	}
}
