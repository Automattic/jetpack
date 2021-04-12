<?php
/**
 * Integration Tests for Search syncing.
 *
 * @package automattic/jetpack-sync
 */

// phpcs:disable Squiz.Commenting
// phpcs:disable Generic.Commenting

use Automattic\Jetpack\Sync\Modules;

class Test_Jetpack_Sync_Search extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;
	protected static $search_sync;

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();

		\Jetpack::activate_module( 'search' );
		self::$search_sync = Modules::get_module( 'search' );
	}

	public function setUp() {
		parent::setUp();

		// create a post.
		$this->post_id = $this->factory->post->create();
		$this->sender->do_sync();
	}

	public function test_module_is_enabled() {
		$this->assertTrue( (bool) Modules::get_module( 'search' ) );
		$this->assertTrue( \Jetpack::is_module_active( 'search' ) );
	}

	/**
	 * Data Providers.
	 */

	public function get_allowed_postmeta_keys() {
		$search_sync = Modules::get_module( 'search' );
		$params      = array();
		$keys        = $search_sync->get_all_postmeta_keys();
		foreach ( $keys as $k ) {
			$params[] = array( $k );
		}
		return $params;
	}

	public function get_allowed_taxonomies() {
		$search_sync = Modules::get_module( 'search' );
		$params      = array();
		$keys        = $search_sync->get_all_taxonomies();
		foreach ( $keys as $k ) {
			$params[] = array( $k );
		}
		return $params;
	}

	/**
	 * Post meta tests.
	 */

	// Note: Adding tested in WP_Test_Jetpack_Sync_Meta::test_sync_whitelisted_post_meta().

	public function test_doesn_t_sync_meta() {
		add_post_meta( $this->post_id, 'no_sync_jetpack_search', 'foo' );

		$this->sender->do_sync();

		$this->assertEquals(
			array(),
			$this->server_replica_storage->get_metadata( 'post', $this->post_id, 'no_sync_jetpack_search' )
		);
		delete_post_meta( $this->post_id, 'no_sync_jetpack_search', 'foo' );
	}

	public function test_meta_is_indexable() {
		$this->assertTrue( self::$search_sync->is_indexable( 'postmeta', 'jetpack-search-meta0' ) );
	}

	public function test_meta_is_not_indexable() {
		$this->assertFalse( self::$search_sync->is_indexable( 'postmeta', 'no_one_wants_to_index_me' ), 'no_one_wants_to_index_me' );
		$this->assertFalse( self::$search_sync->is_indexable( 'postmeta', '_no_one_wants_to_index_me' ), '_no_one_wants_to_index_me' );
	}

	public function test_meta_no_overlap() {
		$indexed_keys = self::$search_sync->get_all_postmeta_keys();
		asort( $indexed_keys );
		$unindexed_keys = self::$search_sync->get_all_unindexed_postmeta_keys();
		asort( $unindexed_keys );
		$this->assertEmpty( array_intersect( $unindexed_keys, $indexed_keys ), 'Indexable meta keys are also contained in the $unindexed_postmeta array. Please remove them from the unindexed list.' );
	}

	/**
	 * Important that we double check the specification format since
	 * this will often get added to.
	 *
	 * @dataProvider get_allowed_postmeta_keys
	 */
	public function test_check_postmeta_spec( $key ) {
		$spec = self::$search_sync->get_postmeta_spec( $key );

		$this->assertInternalType( 'array', $spec );
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
					$this->assertInternalType( 'bool', $spec['searchable_in_all_content'] );
					break;
				case 'available':
					$this->assertInternalType( 'bool', $spec['available'] );
					break;
				case 'alternatives':
					$this->assertInternalType( 'array', $spec['alternatives'] );
					break;
			}
		}
	}

	/**
	 * Custom Taxonomy Tests.
	 */

	/**
	 * @dataProvider get_allowed_taxonomies
	 */
	public function test_add_taxonomy( $taxonomy ) {
		register_taxonomy(
			$taxonomy,
			'post',
			array(
				'label'        => __( 'Taxonomy Test', 'jetpack' ),
				'rewrite'      => array( 'slug' => $taxonomy ),
				'hierarchical' => true,
			)
		);

		$term = md5( wp_rand() );
		if ( 'post_format' === $taxonomy ) {
			// Special case in Core.
			$term = 'Standard';
		}
		$term_obj = wp_insert_term( $term, $taxonomy );
		wp_set_post_terms( $this->post_id, array( $term_obj['term_id'] ), $taxonomy, false );
		$this->sender->do_sync();

		// Check taxonomy and added term.
		$this->assertEquals(
			$this->get_terms( $taxonomy ),
			$this->server_replica_storage->get_terms( $taxonomy ),
			'Terms on cache site match do not match client site'
		);

		$this->assertEqualsObject(
			get_the_terms( $this->post_id, $taxonomy ),
			$this->server_replica_storage->get_the_terms( $this->post_id, $taxonomy ),
			'Adeded term does not match local term.'
		);

		// clean up - speeds up tests
		wp_remove_object_terms( $this->post_id, array( $term_obj['term_id'] ), $taxonomy );
		unregister_taxonomy_for_object_type( $taxonomy, 'post' );
	}

	public function test_taxonomy_is_indexable() {
		$this->assertTrue( self::$search_sync->is_indexable( 'taxonomy', 'jetpack-search-tag0' ) );
	}

	public function test_taxonomy_is_not_indexable() {
		$this->assertFalse( self::$search_sync->is_indexable( 'taxonomy', 'no_one_wants_to_index_me' ) );
	}

	public function test_no_blacklisted_taxonomies() {
		$search_sync = Modules::get_module( 'search' );
		$params      = array();
		$taxes       = $search_sync->get_all_taxonomies();
		$anti_taxes  = \Automattic\Jetpack\Sync\Defaults::$blacklisted_taxonomies;
		$this->assertEmpty(
			array_intersect( $taxes, $anti_taxes ),
			'Some taxonomies for Search sync are explicitly in the blacklist.'
		);
	}

	/**
	 * Helpers
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

}

