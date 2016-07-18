<?php


/**
 * Testing CRUD on Terms
 */
class WP_Test_Jetpack_Sync_Terms extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;
	protected $term_object;
	protected $taxonomy;
	protected $terms_module;

	public function setUp() {
		parent::setUp();
		$this->sender->reset_data();

		$this->terms_module = Jetpack_Sync_Modules::get_module( "terms" );

		$this->taxonomy = 'genre';
		register_taxonomy(
			$this->taxonomy,
			'post',
			array(
				'label'        => __( 'Genre' ),
				'rewrite'      => array( 'slug' => $this->taxonomy ),
				'hierarchical' => true,
			)
		);
		$this->terms_module->set_taxonomy_whitelist( array( $this->taxonomy ) );

		// create a post
		$this->post_id     = $this->factory->post->create();
		$this->term_object = wp_insert_term( 'dog', $this->taxonomy );

		$this->sender->do_sync();
	}

	public function tearDown() {
		parent::tearDown();
		$this->terms_module->set_defaults();
	}

	public function test_insert_term_is_synced() {
		$terms        = $this->get_terms();
		$server_terms = $this->server_replica_storage->get_terms( $this->taxonomy );
		$this->assertEqualsObject( $terms, $server_terms );
	}

	public function test_update_term_is_synced() {
		$args = array(
			'name' => 'Non Catégorisé',
			'slug' => 'non-categorise'
		);
		wp_update_term( $this->term_object['term_id'], $this->taxonomy, $args );
		$this->sender->do_sync();

		$terms        = $this->get_terms();
		$server_terms = $this->server_replica_storage->get_terms( $this->taxonomy );
		$this->assertEqualsObject( $terms, $server_terms );
	}

	public function test_delete_term_is_synced() {
		wp_delete_term( $this->term_object['term_id'], $this->taxonomy );
		$this->sender->do_sync();

		$terms        = $this->get_terms();
		$server_terms = $this->server_replica_storage->get_terms( $this->taxonomy );
		$this->assertEquals( $terms, $server_terms );;
	}

	public function test_added_terms_to_post_is_synced() {
		$anther_term = wp_insert_term( 'mouse', $this->taxonomy );
		wp_set_post_terms( $this->post_id, array( $anther_term['term_id'] ), $this->taxonomy, false );
		$this->sender->do_sync();

		$object_terms        = get_the_terms( $this->post_id, $this->taxonomy );
		$server_object_terms = $this->server_replica_storage->get_the_terms( $this->post_id, $this->taxonomy );
		$this->assertEqualsObject( $object_terms, $server_object_terms );
	}

	public function test_added_terms_to_post_is_synced_appended() {
		$anther_term = wp_insert_term( 'mouse', $this->taxonomy );
		wp_set_post_terms( $this->post_id, array( $anther_term['term_id'] ), $this->taxonomy, false );

		$anther_term_2 = wp_insert_term( 'cat', $this->taxonomy );
		wp_set_post_terms( $this->post_id, array( $anther_term_2['term_id'] ), $this->taxonomy, true );
		$this->sender->do_sync();

		$object_terms        = get_the_terms( $this->post_id, $this->taxonomy );
		$server_object_terms = $this->server_replica_storage->get_the_terms( $this->post_id, $this->taxonomy );
		$server_object_terms = array_reverse( $server_object_terms );
		$this->assertEqualsObject( $object_terms, $server_object_terms );
	}

	public function test_deleted_terms_to_post_is_synced() {
		$anther_term = wp_insert_term( 'mouse', $this->taxonomy );
		wp_set_post_terms( $this->post_id, array( $anther_term['term_id'] ), $this->taxonomy, false );

		$anther_term_2 = wp_insert_term( 'cat', $this->taxonomy );
		wp_set_post_terms( $this->post_id, array( $anther_term_2['term_id'] ), $this->taxonomy, true );

		wp_remove_object_terms( $this->post_id, array( $anther_term_2['term_id'] ), $this->taxonomy );
		$this->sender->do_sync();

		$object_terms = get_the_terms( $this->post_id, $this->taxonomy );

		$server_object_terms = $this->server_replica_storage->get_the_terms( $this->post_id, $this->taxonomy );
		$server_object_terms = array_reverse( $server_object_terms );

		$this->assertEqualsObject( $object_terms, $server_object_terms );
	}

	public function test_delete_object_term_relationships() {
		$anther_term = wp_insert_term( 'mouse', $this->taxonomy );
		wp_set_post_terms( $this->post_id, array( $anther_term['term_id'] ), $this->taxonomy, false );

		$anther_term_2 = wp_insert_term( 'cat', $this->taxonomy );
		wp_set_post_terms( $this->post_id, array( $anther_term_2['term_id'] ), $this->taxonomy, true );

		wp_delete_object_term_relationships( $this->post_id, array( $this->taxonomy ) );

		$this->sender->do_sync();

		$object_terms = get_the_terms( $this->post_id, $this->taxonomy );

		$server_object_terms = $this->server_replica_storage->get_the_terms( $this->post_id, $this->taxonomy );

		$this->assertEquals( $object_terms, $server_object_terms );
	}

	function get_terms() {
		global $wp_version;
		if ( version_compare( $wp_version, '4.5', '>=' ) ) {
			return get_terms( array(
				'taxonomy'   => $this->taxonomy,
				'hide_empty' => false,
			) );

		} else {
			return array_map( array( $this, 'upgrade_terms_to_pass_test' ), get_terms( $this->taxonomy, array(
					'hide_empty' => false,
				) )
			);

		}
	}

	function upgrade_terms_to_pass_test( $term ) {
		$term->filter = 'raw';

		return $term;
	}

}
