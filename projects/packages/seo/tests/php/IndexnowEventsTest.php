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
		$this->candidates = array();
		foreach ( array(
			'pre_post_update'      => 'capture_previous_url',
			'wp_after_insert_post' => 'saved',
			'wp_trash_post'        => 'trashing',
			'before_delete_post'   => 'deleted',
			'deleted_post'         => 'forget_deleted',
			'add_post_metadata'    => 'remember_before_meta_change',
			'update_post_metadata' => 'remember_before_meta_change',
			'updated_post_meta'    => 'meta_changed',
			'added_post_meta'      => 'meta_changed',
			'deleted_post_meta'    => 'meta_changed',
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
		return array( array( true ), array( false ) );
	}

	/**
	 * @dataProvider deletion_paths
	 * @param bool $trash Whether to trash before deleting.
	 */
	#[DataProvider( 'deletion_paths' )]
	public function test_deletion_keeps_only_known_public_urls( $trash ) {
		$id  = wp_insert_post(
			array(
				'post_title'  => 'Removed guide',
				'post_status' => 'publish',
			)
		);
		$url = get_permalink( $id );
		update_post_meta( $id, Content_Coverage::META_DESCRIPTION, 'Public description' );
		$this->candidates = array();
		if ( $trash ) {
			wp_trash_post( $id );
		}
		wp_delete_post( $id, true );
		$rows = $this->candidates;
		$this->assertNotEmpty( $rows );
		$item = $rows[0];
		$this->assertTrue( $item['deleted'] );
		$this->assertSame( $url, $item['url'] );
		$this->assertSame( array( $url ), array_values( array_unique( array_column( $rows, 'url' ) ) ) );
		$this->assertSame( array( true ), array_values( array_unique( array_column( $rows, 'deleted' ) ) ) );
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
		$this->assertNotEmpty( $this->candidates );
		$item = $this->candidates[0];
		$this->assertTrue( $item['deleted'] );
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
