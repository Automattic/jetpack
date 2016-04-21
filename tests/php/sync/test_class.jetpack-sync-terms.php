<?php


/**
 * Testing CRUD on Terms
 */
class WP_Test_Jetpack_New_Sync_Terms extends WP_Test_Jetpack_New_Sync_Base {
	protected $post_id;
	protected $term_object;
	protected $taxonomy;

	public function setUp() {
		parent::setUp();
		$this->client->set_defaults();
		$this->client->reset_data();

		$this->taxonomy = 'genre';
		register_taxonomy(
			$this->taxonomy,
			'post',
			array(
				'label' => __( 'Genre' ),
				'rewrite' => array( 'slug' => $this->taxonomy ),
				'hierarchical' => true,
			)
		);
		$this->client->set_taxonomy_whitelist( array( $this->taxonomy ) );

		// create a post
		$this->post_id    = $this->factory->post->create();
		$this->term_object = wp_insert_term( 'dog', $this->taxonomy );

		$this->client->do_sync();
	}

	public function test_insert_term_is_synced() {

		$terms = get_terms( array(
			'taxonomy' => $this->taxonomy,
			'hide_empty' => false,
		) );
		$server_terms = $this->server_replica_storage->get_terms( $this->taxonomy );

		$this->assertEquals( $terms, $server_terms );
	}

	public function test_update_term_is_synced() {
		$args = array(
			'name' => 'Non Catégorisé',
			'slug' => 'non-categorise'
		);
		wp_update_term( $this->term_object['term_id'], $this->taxonomy, $args );
		$this->client->do_sync();

		$terms = get_terms( array(
			'taxonomy' => $this->taxonomy,
			'hide_empty' => false,
		) );

		$server_terms = $this->server_replica_storage->get_terms( $this->taxonomy );
		$this->assertEquals( $terms, $server_terms );
	}

	public function test_delete_term_is_synced() {
		wp_delete_term( $this->term_object['term_id'], $this->taxonomy );
		$this->client->do_sync();

		$terms = get_terms( array(
			'taxonomy' => $this->taxonomy,
			'hide_empty' => false,
		) );

		$server_terms = $this->server_replica_storage->get_terms( $this->taxonomy );
		$this->assertEquals( $terms, $server_terms );
;	}

//	public function test_append_categories_is_synced() {
//
//		$term_object = wp_insert_term( 'foo', 'category' );
//		$term_object_bar = wp_insert_term( 'bar', 'category' );
//
//		wp_set_post_categories( $this->post_id, array( $term_object['term_id'] ), true );
//		$this->client->do_sync();
//		$terms = get_categories( array(
//			'hide_empty' => false,
//		) );
//
//		$post_terms = get_the_category( $this->post_id );
//
//		 error_log(print_r( $terms, 1 ) );
//		 error_log(print_r( $post_terms, 1 ) );
//
//		$server_terms = $this->server_replica_storage->get_terms( 'category' );
//		$server_post_terms = $this->server_replica_storage->get_the_terms( $this->post_id, 'category' );
//
//		error_log(print_r( $terms, 1 ) );
//		error_log(print_r( $post_terms, 1 ) );
//		// $this->assertEquals( $terms, $server_terms );
//		// $this->assertEquals( $server_post_terms, $post_terms );
//	}
	public function test_over_ride_existing_categories_is_synced() {}
	public function test_delete_existing_categories_is_synced() {}

	public function test_update_term_data_is_synced() {}
	public function test_delete_term_data_is_synced() {}
	// Todo
}
