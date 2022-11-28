<?php

use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Settings;

/**
 * Testing CRUD on Terms
 */
class WP_Test_Jetpack_Sync_Terms extends WP_Test_Jetpack_Sync_Base {
	protected $post_id;
	protected $term_object;
	protected $taxonomy;
	protected $terms_module;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->sender->reset_data();

		$this->terms_module = Modules::get_module( 'terms' );

		$this->taxonomy = 'genre';
		register_taxonomy(
			$this->taxonomy,
			'post',
			array(
				'label'        => __( 'Genre', 'jetpack' ),
				'rewrite'      => array( 'slug' => $this->taxonomy ),
				'hierarchical' => true,
			)
		);

		// create a post
		$this->post_id     = self::factory()->post->create();
		$this->term_object = wp_insert_term( 'dog', $this->taxonomy );

		$this->sender->do_sync();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		parent::tear_down();
		$this->terms_module->set_defaults();
	}

	public function test_insert_term_is_synced() {
		$terms        = $this->get_terms();
		$server_terms = $this->server_replica_storage->get_terms( $this->taxonomy );
		$this->assertEqualsObject( $terms, $server_terms, 'Synced terms do not match local terms.' );

		$event_data = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_add_term' );
		$this->assertTrue( (bool) $event_data );
	}

	public function test_update_term_is_synced() {
		$args = array(
			'name' => 'Non Catégorisé',
			'slug' => 'non-categorise',
		);
		wp_update_term( $this->term_object['term_id'], $this->taxonomy, $args );
		$this->sender->do_sync();

		$terms        = $this->get_terms();
		$server_terms = $this->server_replica_storage->get_terms( $this->taxonomy );
		$this->assertEqualsObject( $terms, $server_terms, 'Synced terms do not match local terms.' );
	}

	public function test_delete_term_is_synced() {
		wp_delete_term( $this->term_object['term_id'], $this->taxonomy );
		$this->sender->do_sync();

		$terms        = $this->get_terms();
		$server_terms = $this->server_replica_storage->get_terms( $this->taxonomy );
		$this->assertEquals( $terms, $server_terms );

	}

	public function test_added_terms_to_post_is_synced() {
		$anther_term = wp_insert_term( 'mouse', $this->taxonomy );
		wp_set_post_terms( $this->post_id, array( $anther_term['term_id'] ), $this->taxonomy, false );
		$this->sender->do_sync();

		$object_terms        = get_the_terms( $this->post_id, $this->taxonomy );
		$server_object_terms = $this->server_replica_storage->get_the_terms( $this->post_id, $this->taxonomy );
		$this->assertEqualsObject( $object_terms, $server_object_terms, 'Synced terms do not match local terms.' );
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
		$this->assertEqualsObject( $object_terms, $server_object_terms, 'Synced terms do not match local terms.' );
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

		$this->assertEqualsObject( $object_terms, $server_object_terms, 'Synced terms do not match local terms.' );
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

	/**
	 * Validate filter_set_object_terms_no_update filters out set_object_terms without changes.
	 */
	public function test_filter_set_object_terms_no_update() {
		$anther_term = wp_insert_term( 'mouse', $this->taxonomy );
		wp_set_post_terms( $this->post_id, array( $anther_term['term_id'] ), $this->taxonomy, false );

		// Sync actions.
		$this->sender->do_sync();
		// Verify set_object_terms was triggered.
		$this->assertNotFalse( $this->server_event_storage->get_most_recent_event( 'set_object_terms' ) );
		// Reset event (actions) storage.
		$this->server_event_storage->reset();

		// Re-trigger and Sync actions.
		wp_set_post_terms( $this->post_id, array( $anther_term['term_id'] ), $this->taxonomy, false );
		$this->sender->do_sync();
		// Verify set_object_terms was *not* triggered.
		$this->assertFalse( $this->server_event_storage->get_most_recent_event( 'set_object_terms' ) );
	}

	public function test_filters_out_blacklisted_taxonomies() {
		register_taxonomy( 'bloginfo_rss', 'post' );

		$term_id = self::factory()->term->create( array( 'taxonomy' => 'bloginfo_rss' ) );

		$this->sender->do_sync();

		$this->assertEquals( array(), $this->server_replica_storage->get_term( 'bloginfo_rss', $term_id ) );
	}

	public function test_taxonomies_blacklist_can_be_appended_in_settings() {
		register_taxonomy( 'filter_me', 'post' );

		$term_id = self::factory()->term->create( array( 'taxonomy' => 'filter_me' ) );

		$this->sender->do_sync();

		// first, show that term is being synced
		$this->assertTrue( (bool) $this->server_replica_storage->get_term( 'filter_me', $term_id ) );

		Settings::update_settings( array( 'taxonomies_blacklist' => array( 'filter_me' ) ) );

		$term_id = self::factory()->term->create( array( 'taxonomy' => 'filter_me' ) );

		$this->sender->do_sync();

		$this->assertEquals( array(), $this->server_replica_storage->get_term( 'filter_me', $term_id ) );

		// also assert that the taxonomies blacklist still contains the hard-coded values
		$setting = Settings::get_setting( 'taxonomies_blacklist' );

		$this->assertContains( 'filter_me', $setting );

		foreach ( Defaults::$blacklisted_taxonomies as $hardcoded_blacklist_taxonomy ) {
			$this->assertContains( $hardcoded_blacklist_taxonomy, $setting );
		}
	}

	public function test_returns_term_object_by_id() {
		$term_sync_module = Modules::get_module( 'terms' );

		$event       = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_add_term' );
		$synced_term = $event->args[0];

		// Grab the codec - we need to simulate the stripping of types that comes with encoding/decoding.
		$codec = $this->sender->get_codec();

		$retrieved_term = $codec->decode(
			$codec->encode(
				$term_sync_module->get_object_by_id( 'term', $synced_term->term_id )
			)
		);

		$this->assertEquals( $synced_term, $retrieved_term );
	}

	public function test_returns_term_taxonomy_by_id() {
		$term_sync_module = Modules::get_module( 'terms' );

		$event         = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_add_term' );
		$synced_term   = $event->args[0];
		$term_taxonomy = $term_sync_module->get_object_by_id( 'term_taxonomy', $synced_term->term_taxonomy_id );

		$this->assertEquals( $term_taxonomy->term_taxonomy_id, $synced_term->term_taxonomy_id );
		$this->assertEquals( $term_taxonomy->term_id, $synced_term->term_id );
		$this->assertEquals( $term_taxonomy->taxonomy, $synced_term->taxonomy );
	}

	public function get_terms() {
		return get_terms(
			array(
				'taxonomy'   => $this->taxonomy,
				'hide_empty' => false,
			)
		);
	}
}
