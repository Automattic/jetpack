<?php
/**
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/** @covers \Automattic\Jetpack\SEO\Indexnow_Events */
#[CoversClass( Indexnow_Events::class )]
class IndexnowEventsTest extends SeoTestCase {
	private $candidates = array();

	public function capture_candidate( $url, $post_id, $removed ) {
		$this->candidates[] = array(
			'url'     => $url,
			'post'    => $post_id,
			'deleted' => $removed,
		);
	}

	protected function setUp(): void {
		parent::setUp();
		self::set_seo_tools_active( true );
		add_filter( 'rsm_jetpack_seo', '__return_true' );
		update_option( 'blog_public', 1 );
		update_option( Indexnow_Client::ENABLED_OPTION, true );
		update_option( 'home', 'https://example.com' );
		update_option( Indexnow_Client::SCOPE_OPTION, home_url( '/' ) );
		Indexnow_Events::init();
		add_action( 'jetpack_seo_indexnow_url_changed', array( $this, 'capture_candidate' ), 10, 3 );
	}

	protected function tearDown(): void {
		Indexnow_Events::flush_metadata_changes();
		$this->candidates = array();
		foreach ( array(
			'pre_post_update'      => 'capture_previous_url',
			'wp_after_insert_post' => 'saved',
			'wp_trash_post'        => 'trashing',
			'before_delete_post'   => 'deleted',
			'deleted_post'         => 'forget_deleted',
			'add_post_metadata'    => 'remember_before_meta_change',
			'update_post_metadata' => 'remember_before_meta_change',
			'delete_post_metadata' => 'remember_before_meta_change',
			'updated_post_meta'    => 'meta_changed',
			'added_post_meta'      => 'meta_changed',
			'deleted_post_meta'    => 'meta_changed',
			'shutdown'             => 'flush_metadata_changes',
			'update_option_' . Indexnow_Client::ENABLED_OPTION => 'preference_changed',
		) as $hook => $callback ) {
			remove_action( $hook, array( Indexnow_Events::class, $callback ) );
		}
		remove_action( 'jetpack_seo_indexnow_url_changed', array( $this, 'capture_candidate' ) );
		remove_filter( 'rsm_jetpack_seo', '__return_true' );
		remove_all_filters( 'jetpack_active_modules' );
		foreach ( array( Indexnow_Client::ENABLED_OPTION, Indexnow_Client::SCOPE_OPTION, Indexnow_Client::KEY_OPTION, 'home' ) as $option ) {
			delete_option( $option );
		}
		parent::tearDown();
	}

	/** @dataProvider unrelated_metadata_operations */
	#[DataProvider( 'unrelated_metadata_operations' )]
	public function test_unrelated_metadata_changes_do_not_read_notification_settings( $operation ) {
		$id = wp_insert_post( array( 'post_title' => 'Template settings' ) );
		if ( 'add' !== $operation ) {
			add_post_meta( $id, '_wp_page_template', 'default' );
		}
		$filter = 'pre_option_' . Indexnow_Client::ENABLED_OPTION;
		$fail   = function () {
			$this->fail( 'Unrelated metadata must not read IndexNow settings.' );
		};
		add_filter( $filter, $fail );
		try {
			if ( 'add' === $operation ) {
				$this->assertNotFalse( add_post_meta( $id, '_wp_page_template', 'default' ) );
			} elseif ( 'update' === $operation ) {
				$this->assertTrue( update_post_meta( $id, '_wp_page_template', 'full-width.php' ) );
			} else {
				$this->assertTrue( delete_post_meta( $id, '_wp_page_template' ) );
			}
		} finally {
			remove_filter( $filter, $fail );
		}
	}

	public function test_unsupported_content_does_not_read_settings_or_cancel_work() {
		register_post_type( 'seo_ignored', array( 'public' => true ) );
		$cancelled = array();
		$capture   = static function ( $id ) use ( &$cancelled ) {
			$cancelled[] = $id;
		};
		$fail      = function () {
			$this->fail( 'Unsupported content must not read IndexNow settings.' );
		};
		add_action( 'jetpack_seo_indexnow_post_restricted', $capture );
		add_filter( 'pre_option_' . Indexnow_Client::ENABLED_OPTION, $fail );
		try {
			$id = wp_insert_post(
				array(
					'post_type'   => 'seo_ignored',
					'post_status' => 'publish',
				)
			);
			update_post_meta( $id, Content_Coverage::META_TITLE, 'Ignored title' );
			wp_trash_post( $id );
			wp_delete_post( $id, true );
			$this->assertSame( array(), $cancelled );
			$this->assertSame( array(), $this->candidates );
		} finally {
			remove_filter( 'pre_option_' . Indexnow_Client::ENABLED_OPTION, $fail );
			remove_action( 'jetpack_seo_indexnow_post_restricted', $capture );
			unregister_post_type( 'seo_ignored' );
		}
	}

	public static function unrelated_metadata_operations() {
		return array(
			'add'    => array( 'add' ),
			'update' => array( 'update' ),
			'delete' => array( 'delete' ),
		);
	}

	/** @dataProvider nonpublic_site_states */
	#[DataProvider( 'nonpublic_site_states' )]
	public function test_nonpublic_sites_preserve_provenance_without_emitting_changes( $visibility ) {
		$id               = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Public guide',
			)
		);
		$url              = get_post_meta( $id, Indexnow_Events::PUBLIC_URL_META, true );
		$this->candidates = array();
		update_option( 'blog_public', $visibility );
		wp_update_post(
			array(
				'ID'           => $id,
				'post_content' => 'Changed while paused.',
			)
		);
		$this->assertSame( $url, get_post_meta( $id, Indexnow_Events::PUBLIC_URL_META, true ) );
		update_post_meta( $id, Content_Coverage::META_NOINDEX, true );
		wp_delete_post( $id, true );
		Indexnow_Events::flush_metadata_changes();
		$this->assertSame( array(), $this->candidates );
	}

	public static function nonpublic_site_states() {
		return array(
			'discouraged' => array( 0 ),
			'private'     => array( -1 ),
		);
	}

	/** @dataProvider first_publish_metadata_paths */
	#[DataProvider( 'first_publish_metadata_paths' )]
	public function test_first_publish_with_noindex_does_not_advertise_the_url( $deferred ) {
		$metadata = array(
			Content_Coverage::META_TITLE   => 'Search title',
			Content_Coverage::META_NOINDEX => true,
		);
		$id       = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Never indexed',
				'meta_input'  => $deferred ? array() : $metadata,
			),
			true,
			! $deferred
		);
		if ( $deferred ) {
			foreach ( $metadata as $key => $value ) {
				update_post_meta( $id, $key, $value );
			}
			wp_after_insert_post( get_post( $id ), false, null );
		}
		Indexnow_Events::flush_metadata_changes();
		$this->assertSame( array(), $this->candidates );
		$this->assertSame( '', get_post_meta( $id, Indexnow_Events::PUBLIC_URL_META, true ) );
	}

	public static function first_publish_metadata_paths() {
		return array(
			'meta_input'                   => array( false ),
			'REST-style deferred metadata' => array( true ),
		);
	}

	/**
	 * @dataProvider editor_saves_on_tracked_posts
	 * @param string $key SEO field saved with the title.
	 * @param mixed  $value Field value.
	 * @param bool   $removed Whether the one event is a removal.
	 */
	#[DataProvider( 'editor_saves_on_tracked_posts' )]
	public function test_editor_save_on_a_tracked_post_emits_one_event( $key, $value, $removed ) {
		$id = wp_insert_post(
			array(
				'post_title'  => 'Tracked guide',
				'post_status' => 'publish',
			)
		);
		$this->assertNotSame( '', get_post_meta( $id, Indexnow_Events::PUBLIC_URL_META, true ) );
		$url              = get_permalink( $id );
		$before           = get_post( $id );
		$this->candidates = array();

		// The REST controller saves the row, then metadata, then fires the after-insert hooks.
		wp_update_post(
			array(
				'ID'         => $id,
				'post_title' => 'Tracked guide, retitled',
			),
			true,
			false
		);
		update_post_meta( $id, $key, $value );
		wp_after_insert_post( get_post( $id ), true, $before );
		Indexnow_Events::flush_metadata_changes();

		$this->assertSame(
			array(
				array(
					'url'     => $url,
					'post'    => $id,
					'deleted' => $removed,
				),
			),
			$this->candidates
		);
	}

	public static function editor_saves_on_tracked_posts() {
		return array(
			'title and SEO description' => array( Content_Coverage::META_DESCRIPTION, 'Search description', false ),
			'title and noindex'         => array( Content_Coverage::META_NOINDEX, true, true ),
		);
	}

	public function test_never_public_content_is_not_announced_as_a_removal() {
		$id = wp_insert_post(
			array(
				'post_title'  => 'Subscriber guide',
				'post_status' => 'publish',
				'meta_input'  => array( Content_Gate::META_NEWSLETTER_ACCESS => 'subscribers' ),
			)
		);
		Indexnow_Events::flush_metadata_changes();
		$this->assertSame( array(), $this->candidates );

		// Standalone writes in one request: the post is eligible only between them.
		delete_post_meta( $id, Content_Gate::META_NEWSLETTER_ACCESS );
		update_post_meta( $id, Content_Coverage::META_NOINDEX, true );
		Indexnow_Events::flush_metadata_changes();

		$this->assertSame( array(), $this->candidates );
	}

	public function test_standalone_metadata_reconciliation_ignores_noop_writes() {
		update_option( Indexnow_Client::ENABLED_OPTION, false );
		$id = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Existing guide',
				'meta_input'  => array( Content_Coverage::META_NOINDEX => '0' ),
			)
		);
		update_option( Indexnow_Client::ENABLED_OPTION, true );
		update_post_meta( $id, Content_Coverage::META_NOINDEX, '0' );
		Indexnow_Events::flush_metadata_changes();
		$this->assertSame( array(), $this->candidates );
		update_post_meta( $id, Content_Coverage::META_TITLE, 'Changed search title' );
		Indexnow_Events::flush_metadata_changes();
		$this->assertSame(
			array(
				array(
					'url'     => 'https://example.com/?p=' . $id,
					'post'    => $id,
					'deleted' => false,
				),
			),
			$this->candidates
		);
	}

	public function test_opt_out_discards_unflushed_metadata_changes() {
		update_option( Indexnow_Client::ENABLED_OPTION, false );
		$id = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Existing guide',
			)
		);
		update_option( Indexnow_Client::ENABLED_OPTION, true );
		update_post_meta( $id, Content_Coverage::META_TITLE, 'Changed search title' );
		update_option( Indexnow_Client::ENABLED_OPTION, false );
		update_option( Indexnow_Client::ENABLED_OPTION, true );
		Indexnow_Events::flush_metadata_changes();
		$this->assertSame( array(), $this->candidates );
		$this->assertSame( '', get_post_meta( $id, Indexnow_Events::PUBLIC_URL_META, true ) );
	}

	public function test_disabled_notifications_leave_post_provenance_unchanged() {
		$id  = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Public guide',
			)
		);
		$url = get_post_meta( $id, Indexnow_Events::PUBLIC_URL_META, true );
		$this->assertNotEmpty( $url );
		update_option( Indexnow_Client::ENABLED_OPTION, false );
		wp_update_post(
			array(
				'ID'           => $id,
				'post_content' => 'Changed while notifications are off.',
			)
		);
		$this->assertSame( $url, get_post_meta( $id, Indexnow_Events::PUBLIC_URL_META, true ) );
	}

	/** @dataProvider legacy_noindex_values */
	#[DataProvider( 'legacy_noindex_values' )]
	public function test_first_noindex_change_captures_an_existing_public_url( $has_stored_false ) {
		update_option( Indexnow_Client::ENABLED_OPTION, false );
		$id = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Existing public guide',
			)
		);
		if ( $has_stored_false ) {
			update_post_meta( $id, Content_Coverage::META_NOINDEX, false );
		}
		$this->assertSame( '', get_post_meta( $id, Indexnow_Events::PUBLIC_URL_META, true ) );
		update_option( Indexnow_Client::ENABLED_OPTION, true );
		$this->assertSame( array(), $this->candidates );
		$url = get_permalink( $id );
		update_post_meta( $id, Content_Coverage::META_NOINDEX, true );
		Indexnow_Events::flush_metadata_changes();
		$this->assertSame(
			array(
				array(
					'url'     => $url,
					'post'    => $id,
					'deleted' => true,
				),
			),
			$this->candidates
		);
	}

	public static function legacy_noindex_values() {
		return array(
			'new meta row'       => array( false ),
			'existing false row' => array( true ),
		);
	}

	public function test_noop_saves_do_not_requeue_and_never_public_content_stays_private() {
		$id = wp_insert_post(
			array(
				'post_title'  => 'Public guide',
				'post_status' => 'publish',
			)
		);
		$this->assertCount( 1, $this->candidates );
		$this->candidates = array();
		wp_update_post( array( 'ID' => $id ) );
		wp_insert_post(
			array(
				'post_title'  => 'Private guide',
				'post_status' => 'private',
			)
		);
		wp_insert_post(
			array(
				'post_title'    => 'Protected guide',
				'post_status'   => 'publish',
				'post_password' => 'secret',
			)
		);
		$this->assertCount( 0, $this->candidates );
	}

	public function test_noindex_transition_retains_only_the_previously_public_url() {
		$id               = wp_insert_post(
			array(
				'post_title'  => 'Public guide',
				'post_status' => 'publish',
			)
		);
		$url              = get_permalink( $id );
		$this->candidates = array();
		update_post_meta( $id, Content_Coverage::META_NOINDEX, true );
		$items = $this->candidates;
		$this->assertCount( 1, $items );
		$this->assertTrue( $items[0]['deleted'] );
		$this->assertSame( $url, $items[0]['url'] );
		$this->candidates = array();
		delete_post_meta( $id, Content_Coverage::META_NOINDEX );
		$item = $this->candidates[0];
		$this->assertFalse( $item['deleted'] );
	}

	public static function deletion_paths() {
		return array(
			'trash'                            => array( true, false ),
			'permanent'                        => array( false, false ),
			'trash after permalink change'     => array( true, true ),
			'permanent after permalink change' => array( false, true ),
		);
	}

	/**
	 * @dataProvider deletion_paths
	 * @param bool $trash Whether to trash before deleting.
	 */
	#[DataProvider( 'deletion_paths' )]
	public function test_deletion_keeps_only_known_public_urls( $trash, $changed_structure ) {
		global $wp_rewrite;
		$original_structure = $wp_rewrite->permalink_structure;
		$id                 = wp_insert_post(
			array(
				'post_title'  => 'Removed guide',
				'post_status' => 'publish',
			)
		);
		$url                = get_permalink( $id );
		update_post_meta( $id, Content_Coverage::META_DESCRIPTION, 'Public description' );
		$this->candidates = array();
		try {
			if ( $changed_structure ) {
				$wp_rewrite->set_permalink_structure( '/%postname%/' );
				$this->assertNotSame( $url, get_permalink( $id ) );
			}
			if ( $trash ) {
				wp_trash_post( $id );
			}
			wp_delete_post( $id, true );
		} finally {
			$wp_rewrite->set_permalink_structure( $original_structure );
		}
		$this->assertSame(
			array(
				array(
					'url'     => $url,
					'post'    => $id,
					'deleted' => true,
				),
			),
			$this->candidates
		);
	}

	public function test_deleting_an_old_public_post_is_a_new_change_without_a_backfill() {
		update_option( Indexnow_Client::ENABLED_OPTION, false );
		$id = wp_insert_post(
			array(
				'post_title'  => 'Existing public guide',
				'post_status' => 'publish',
			)
		);
		$this->assertCount( 0, $this->candidates );
		update_option( Indexnow_Client::ENABLED_OPTION, true );
		wp_trash_post( $id );
		$this->assertSame(
			array(
				array(
					'url'     => 'https://example.com/?p=' . $id,
					'post'    => $id,
					'deleted' => true,
				),
			),
			$this->candidates
		);
	}

	public function test_deletion_preserves_a_public_url_captured_before_a_deferred_noindex_change() {
		update_option( Indexnow_Client::ENABLED_OPTION, false );
		$id = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Existing public guide',
			)
		);
		update_option( Indexnow_Client::ENABLED_OPTION, true );
		$url = get_permalink( $id );
		update_post_meta( $id, Content_Coverage::META_NOINDEX, true );
		wp_delete_post( $id, true );
		Indexnow_Events::flush_metadata_changes();
		$this->assertSame(
			array(
				array(
					'url'     => $url,
					'post'    => $id,
					'deleted' => true,
				),
			),
			$this->candidates
		);
	}

	public function test_bulk_standalone_metadata_is_bounded_and_can_resume_after_a_flush() {
		update_option( Indexnow_Client::ENABLED_OPTION, false );
		$ids = array();
		for ( $i = 0; $i < 1001; ++$i ) {
			$ids[] = wp_insert_post(
				array(
					'post_status' => 'publish',
					'post_title'  => 'Existing guide ' . $i,
				)
			);
		}
		update_option( Indexnow_Client::ENABLED_OPTION, true );
		foreach ( $ids as $id ) {
			update_post_meta( $id, Content_Coverage::META_TITLE, 'Bulk title' );
		}
		$last      = end( $ids );
		$cancelled = array();
		$capture   = static function ( $id ) use ( &$cancelled ) {
			$cancelled[] = $id;
		};
		add_action( 'jetpack_seo_indexnow_post_restricted', $capture );
		try {
			update_post_meta( $last, Content_Gate::META_NEWSLETTER_ACCESS, 'subscribers' );
			$this->assertSame( array( $last ), $cancelled );
			delete_post_meta( $last, Content_Gate::META_NEWSLETTER_ACCESS );
		} finally {
			remove_action( 'jetpack_seo_indexnow_post_restricted', $capture );
		}
		Indexnow_Events::flush_metadata_changes();
		$this->assertCount( 1000, $this->candidates );
		$this->assertSame( array_slice( $ids, 0, 1000 ), array_column( $this->candidates, 'post' ) );
		$this->candidates = array();
		update_post_meta( $last, Content_Coverage::META_TITLE, 'Retried title' );
		Indexnow_Events::flush_metadata_changes();
		$this->assertSame(
			array(
				array(
					'url'     => get_permalink( $last ),
					'post'    => $last,
					'deleted' => false,
				),
			),
			$this->candidates
		);
	}

	public static function restrictions() {
		return array(
			'private'             => array( array( 'post_status' => 'private' ), null, null ),
			'password'            => array( array( 'post_password' => 'secret' ), null, null ),
			'paywall block'       => array( array( 'post_content' => '<!-- wp:jetpack/paywall /-->' ), null, null ),
			'newsletter access'   => array( array(), '_jetpack_newsletter_access', 'subscribers' ),
			'paid-content marker' => array( array(), '_jetpack_memberships_contains_paid_content', true ),
			'paywall marker'      => array( array(), '_jetpack_memberships_contains_paywalled_content', true ),
		);
	}

	/**
	 * @dataProvider restrictions
	 * @param array       $changes Post updates.
	 * @param string|null $key Access metadata.
	 * @param mixed       $value Access value.
	 */
	#[DataProvider( 'restrictions' )]
	public function test_restrictions_cancel_pending_urls_and_forget_public_provenance( $changes, $key, $value ) {
		$id               = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Public guide',
			)
		);
		$this->candidates = array();
		$cancelled        = array();
		$capture          = static function ( $post_id ) use ( &$cancelled ) {
			$cancelled[] = $post_id;
		};
		add_action( 'jetpack_seo_indexnow_post_restricted', $capture );
		try {
			if ( null !== $key ) {
				update_post_meta( $id, $key, $value );
			} else {
				wp_update_post( array_merge( array( 'ID' => $id ), $changes ) );
			}
			$this->assertSame( array( $id ), $cancelled );
			$this->assertSame( array(), $this->candidates );
			$this->assertSame( '', get_post_meta( $id, Indexnow_Events::PUBLIC_URL_META, true ) );
			update_post_meta( $id, Content_Coverage::META_NOINDEX, true );
			wp_delete_post( $id, true );
			$this->assertSame( array(), $this->candidates );
		} finally {
			remove_action( 'jetpack_seo_indexnow_post_restricted', $capture );
		}
	}

	/**
	 * @dataProvider access_metadata
	 * @param string $key Access metadata.
	 * @param mixed  $value Access value.
	 */
	#[DataProvider( 'access_metadata' )]
	public function test_failed_rest_save_still_cancels_restricted_content( $key, $value ) {
		$id = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Public guide',
			)
		);
		$this->assertNotEmpty( get_post_meta( $id, Indexnow_Events::PUBLIC_URL_META, true ) );
		$this->candidates = array();
		$user_id          = wp_insert_user(
			array(
				'user_login' => 'indexnow-rest-' . wp_generate_uuid4(),
				'user_pass'  => 'test',
				'role'       => 'administrator',
			)
		);
		$previous_user    = get_current_user_id();
		wp_set_current_user( $user_id );
		register_post_meta(
			'post',
			$key,
			array(
				'type'          => is_bool( $value ) ? 'boolean' : 'string',
				'single'        => true,
				'show_in_rest'  => true,
				'auth_callback' => '__return_true',
			)
		);
		register_rest_field(
			'post',
			'indexnow_save_error',
			array(
				'update_callback' => static function () {
					return new \WP_Error( 'indexnow_test_save_failed', 'Fixture error', array( 'status' => 500 ) );
				},
				'schema'          => array( 'type' => 'boolean' ),
			)
		);
		$cancelled = array();
		$capture   = static function ( $post_id ) use ( &$cancelled ) {
			$cancelled[] = $post_id;
		};
		add_action( 'jetpack_seo_indexnow_post_restricted', $capture );
		try {
			$request = new \WP_REST_Request( 'POST' );
			$request->set_param( 'id', $id );
			$request->set_param( 'meta', array( $key => $value ) );
			$request->set_param( 'indexnow_save_error', true );
			$result = ( new \WP_REST_Posts_Controller( 'post' ) )->update_item( $request );
			$this->assertInstanceOf( \WP_Error::class, $result );
			$this->assertSame( 'indexnow_test_save_failed', $result->get_error_code() );
			$this->assertSame( is_bool( $value ) ? '1' : $value, get_post_meta( $id, $key, true ) );
			$this->assertSame( array( $id ), $cancelled );
			$this->assertSame( '', get_post_meta( $id, Indexnow_Events::PUBLIC_URL_META, true ) );
			Indexnow_Events::flush_metadata_changes();
			$this->assertSame( array(), $this->candidates );
		} finally {
			remove_action( 'jetpack_seo_indexnow_post_restricted', $capture );
			unset( $GLOBALS['wp_rest_additional_fields']['post']['indexnow_save_error'] );
			unregister_post_meta( 'post', $key );
			wp_set_current_user( $previous_user );
			wp_delete_user( $user_id );
		}
	}

	public static function access_metadata() {
		return array(
			'newsletter access'   => array( '_jetpack_newsletter_access', 'subscribers' ),
			'paid-content marker' => array( '_jetpack_memberships_contains_paid_content', true ),
			'paywall marker'      => array( '_jetpack_memberships_contains_paywalled_content', true ),
		);
	}

	/**
	 * @dataProvider access_metadata
	 * @param string $key Access metadata.
	 * @param mixed  $value Access value.
	 */
	#[DataProvider( 'access_metadata' )]
	public function test_removing_access_metadata_only_advertises_newly_public_content( $key, $value ) {
		$id = wp_insert_post(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Restricted guide',
				'meta_input'  => array( $key => $value ),
			)
		);
		$this->assertSame( array(), $this->candidates );
		delete_post_meta( $id, $key );
		Indexnow_Events::flush_metadata_changes();
		$this->assertSame(
			array(
				array(
					'url'     => 'https://example.com/?p=' . $id,
					'post'    => $id,
					'deleted' => false,
				),
			),
			$this->candidates
		);
	}

	public function test_unpublishing_advertises_only_the_previous_public_url() {
		$id               = wp_insert_post(
			array(
				'post_title'  => 'Public guide',
				'post_status' => 'publish',
			)
		);
		$this->candidates = array();
		wp_update_post(
			array(
				'ID'          => $id,
				'post_status' => 'draft',
			)
		);
		$this->assertSame(
			array(
				array(
					'url'     => 'https://example.com/?p=' . $id,
					'post'    => $id,
					'deleted' => true,
				),
			),
			$this->candidates
		);
	}
}
