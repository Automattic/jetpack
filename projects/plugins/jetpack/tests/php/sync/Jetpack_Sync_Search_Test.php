<?php
/**
 * Integration Tests for Search syncing.
 *
 * @package automattic/jetpack-sync
 */

use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Settings;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/Jetpack_Sync_TestBase.php';

/**
 * Testing Search Sync modifications.
 *
 * @group jetpack-sync
 */
#[Group( 'jetpack-sync' )]
class Jetpack_Sync_Search_Test extends Jetpack_Sync_TestBase {

	/**
	 * Identifying number for post under test.
	 *
	 * @var int Post Id
	 */
	protected $post_id;

	/**
	 * Search Sync Module for use in tests.
	 *
	 * @var Modules\Module Search Sync Module
	 */
	protected static $search_sync;

	/**
	 * Configure Jetpack/Search settings for use in all tests.
	 *
	 * @return void
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		// Activate Search module.
		\Jetpack::activate_module( 'search' );
		self::$search_sync = new Modules\Search();
	}

	/**
	 * Deactivate search module
	 *
	 * @return void
	 */
	public static function tear_down_after_class() {
		\Jetpack::deactivate_module( 'search' );
		remove_filter( 'jetpack_sync_post_meta_whitelist', array( 'Automattic\\Jetpack\\Sync\\Modules\\Search', 'add_search_post_meta_whitelist' ), 10 );
		parent::tear_down_after_class();
	}

	/**
	 * Setup test data.
	 */
	public function set_up() {
		parent::set_up();

		// create a post.
		$this->post_id = self::factory()->post->create();
		$this->sender->do_sync();
	}

	/**
	 * Data Provider of allowed postmeta keys.
	 *
	 * @return string[][]
	 */
	public static function get_random_allowed_postmeta_keys() {
		$params = array();
		$keys   = Modules\Search::get_all_postmeta_keys();
		foreach ( array_rand( $keys, 10 ) as $k ) {
			$params[] = array( $keys[ $k ] );
		}

		return $params;
	}

	/**
	 * Data Provider of allowed taxonomies.
	 *
	 * @return string[][]
	 */
	public static function get_random_allowed_taxonomies() {
		$params = array(
			'link_category' => array( 'link_category' ),
			'nav_menu'      => array( 'nav_menu' ),
			'post_format'   => array( 'post_format' ),
		);

		$allowed = array_unique( Modules\Search::get_all_taxonomies() );
		$params  = array_intersect_key( $params, array_flip( $allowed ) );
		$keys    = array_diff( $allowed, array_keys( $params ) );
		foreach ( array_rand( $keys, 10 ) as $k ) {
			$params[ $keys[ $k ] ] = array( $keys[ $k ] );
		}

		return $params;
	}

	/**
	 * Verify that all allowed post meta are synced.
	 */
	public function test_sync_whitelisted_post_meta() {
		Settings::update_settings( array( 'post_meta_whitelist' => array() ) );
		$this->setSyncClientDefaults();
		// check that these values exists in the whitelist options.
		$white_listed_post_meta = Modules\Search::get_all_postmeta_keys();

		// update all the options.
		foreach ( $white_listed_post_meta as $meta_key ) {
			add_post_meta( $this->post_id, $meta_key, 'foo' );
		}

		$this->sender->do_sync();

		foreach ( $white_listed_post_meta as $meta_key ) {
			$this->assertOptionIsSynced( $meta_key, 'foo', 'post', $this->post_id );
		}
		$whitelist = Settings::get_setting( 'post_meta_whitelist' );

		// Are we testing all the options.
		$unique_whitelist = array_unique( $whitelist );

		$this->assertSameSize( $unique_whitelist, $whitelist, 'The duplicate keys are: ' . print_r( array_diff_key( $whitelist, array_unique( $whitelist ) ), 1 ) );
	}

	/**
	 * Verify that unexpected meta (not in allow list) is not synced.
	 */
	public function test_sync_does_not_include_all_meta() {
		add_post_meta( $this->post_id, 'no_sync_jetpack_search', 'foo' );

		$this->sender->do_sync();

		$this->assertEquals(
			array(),
			$this->server_replica_storage->get_metadata( 'post', $this->post_id, 'no_sync_jetpack_search' )
		);
		delete_post_meta( $this->post_id, 'no_sync_jetpack_search', 'foo' );
	}

	/**
	 * Verify that is_indexable returns true for indexable post meta.
	 */
	public function test_meta_is_indexable() {
		$this->assertTrue( Modules\Search::is_indexable( 'postmeta', 'jetpack-search-meta0' ) );
	}

	/**
	 * Verify that is_indexable returns false for non-indexable post meta.
	 */
	public function test_meta_is_not_indexable() {
		$this->assertFalse( Modules\Search::is_indexable( 'postmeta', 'no_one_wants_to_index_me' ), 'no_one_wants_to_index_me' );
		$this->assertFalse( Modules\Search::is_indexable( 'postmeta', '_no_one_wants_to_index_me' ), '_no_one_wants_to_index_me' );
	}

	/**
	 * Verify that we don't have any overlap between our lists of indexed and unindexed meta.
	 */
	public function test_meta_no_overlap() {
		$indexed_keys = Modules\Search::get_all_postmeta_keys();
		asort( $indexed_keys );
		$unindexed_keys = Modules\Search::get_all_unindexed_postmeta_keys();
		asort( $unindexed_keys );
		$this->assertEmpty( array_intersect( $unindexed_keys, $indexed_keys ), 'Indexable meta keys are also contained in the $unindexed_postmeta array. Please remove them from the unindexed list.' );
	}

	/**
	 * Important that we double check the specification format since
	 * this will often get added to.
	 *
	 * @dataProvider get_random_allowed_postmeta_keys
	 * @param string $key Meta Key.
	 */
	#[DataProvider( 'get_random_allowed_postmeta_keys' )]
	public function test_check_postmeta_spec( $key ) {
		$spec = Modules\Search::get_postmeta_spec( $key );

		$this->assertIsArray( $spec );
		foreach ( $spec as $key => $v ) {
			$this->assertContains(
				$key,
				array(
					'searchable_in_all_content',
					'available',
					'alternatives',
				),
				'Post meta specification has an unsupported key: ' . $key
			);
			switch ( $key ) {
				case 'searchable_in_all_content':
					$this->assertIsBool( $spec['searchable_in_all_content'] );
					break;
				case 'available':
					$this->assertIsBool( $spec['available'] );
					break;
				case 'alternatives':
					$this->assertIsArray( $spec['alternatives'] );
					break;
			}
		}
	}

	/**
	 * Verify that allowed taxonomies are synced.
	 *
	 * @dataProvider get_random_allowed_taxonomies
	 * @param string $taxonomy Taxonomy Name.
	 */
	#[DataProvider( 'get_random_allowed_taxonomies' )]
	public function test_add_taxonomy( $taxonomy ) {
		$original_taxonomy   = get_taxonomy( $taxonomy );
		$original_post_types = $original_taxonomy ? $original_taxonomy->object_type : array();
		$attach_to_post      = $original_taxonomy && ! is_object_in_taxonomy( 'post', $taxonomy );
		if ( ! $original_taxonomy ) {
			register_taxonomy(
				$taxonomy,
				'post',
				array(
					'label'        => __( 'Taxonomy Test', 'jetpack' ),
					'rewrite'      => array( 'slug' => $taxonomy ),
					'hierarchical' => true,
				)
			);
		} elseif ( $attach_to_post ) {
			register_taxonomy_for_object_type( $taxonomy, 'post' );
		}

		try {
			$term     = 'post_format' === $taxonomy ? 'Standard' : md5( (string) wp_rand() );
			$term_obj = wp_insert_term( $term, $taxonomy );
			$this->assertIsArray( $term_obj );
			$term_id = $term_obj['term_id'];
			wp_set_post_terms( $this->post_id, array( $term_id ), $taxonomy, false );
			$this->assertSame(
				array( $term_id ),
				wp_get_post_terms( $this->post_id, $taxonomy, array( 'fields' => 'ids' ) ),
				'The fixture post must have the new term before Sync runs.'
			);
			$this->sender->do_sync();

			$this->assertEquals(
				$this->get_terms( $taxonomy ),
				$this->server_replica_storage->get_terms( $taxonomy ),
				'Terms on the replica do not match the client site.'
			);

			$this->assertEqualsObject(
				get_the_terms( $this->post_id, $taxonomy ),
				$this->server_replica_storage->get_the_terms( $this->post_id, $taxonomy ),
				'The added term does not match the local term.'
			);
		} finally {
			if ( isset( $term_id ) ) {
				wp_remove_object_terms( $this->post_id, array( $term_id ), $taxonomy );
			}
			if ( ! $original_taxonomy ) {
				unregister_taxonomy( $taxonomy );
			} elseif ( $attach_to_post ) {
				unregister_taxonomy_for_object_type( $taxonomy, 'post' );
			}
		}

		$restored_taxonomy = get_taxonomy( $taxonomy );
		$this->assertSame( $original_taxonomy, $restored_taxonomy, 'Existing taxonomy registrations must be preserved.' );
		$this->assertSame( $original_post_types, $restored_taxonomy->object_type ?? array(), 'Original taxonomy object types must be restored.' );
	}

	/**
	 * Verify that is_indexable returns true for indexable taxonomies.
	 */
	public function test_taxonomy_is_indexable() {
		$this->assertTrue( Modules\Search::is_indexable( 'taxonomy', 'jetpack-search-tag0' ) );
	}

	/**
	 * Verify that is_indexable returns false for non-indexable taxonomies.
	 */
	public function test_taxonomy_is_not_indexable() {
		$this->assertFalse( Modules\Search::is_indexable( 'taxonomy', 'no_one_wants_to_index_me' ) );
	}

	/**
	 * Verify that the allowed taxonomy list does not include any disallowed values.
	 */
	public function test_no_blacklisted_taxonomies() {
		$taxes      = Modules\Search::get_all_taxonomies();
		$anti_taxes = \Automattic\Jetpack\Sync\Defaults::$blacklisted_taxonomies;
		$this->assertEmpty(
			array_intersect( $taxes, $anti_taxes ),
			'Some taxonomies for Search sync are explicitly in the blacklist.'
		);
	}

	/**
	 * Helper to convert WP_Term into stdClass for tests.
	 *
	 * @param string $taxonomy Taxonomy name.
	 * @return object[]
	 */
	protected function get_terms( $taxonomy ) {
		$terms = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
			)
		);
		// We need an array of stdClass rather than WP_Term.
		return array_map(
			function ( $object ) {
				return (object) (array) $object; },
			$terms
		);
	}

	/**
	 * Helper to verify meta is synced.
	 *
	 * @param string $meta_key  Meta key.
	 * @param mixed  $value     Expected value.
	 * @param string $type      Meta type.
	 * @param mixed  $object_id Object Id.
	 */
	protected function assertOptionIsSynced( $meta_key, $value, $type, $object_id ) {
		$this->assertEqualsObject( $value, $this->server_replica_storage->get_metadata( $type, $object_id, $meta_key, true ), 'Synced option doesn\'t match local option.' );
	}
}
