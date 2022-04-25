<?php

use Automattic\Jetpack\Sync\Modules;

/**
 * Testing sync on Term Relationships
 *
 * @group legacy-full-sync
 */
class WP_Test_Jetpack_Sync_Term_Relationships extends WP_Test_Jetpack_Sync_Base {
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

		$this->taxonomy    = 'category';
		$this->post_id     = $this->factory->post->create();
		$term              = wp_insert_term( 'dog', $this->taxonomy );
		$this->term_object = get_term_by( 'id', $term['term_id'], $this->taxonomy );

		$this->full_sync = Modules::get_module( 'full-sync' );
		$this->full_sync->start();
		$this->sender->do_full_sync();
	}

	/**
	 * Verify full sync syncs term relationships that are present on the site, but missing on WP.com.
	 */
	public function test_missing_term_relationships_are_synced_on_full_sync() {

		// Test needs to be reviewed and revised.
		$this->markTestSkipped( 'Needs Revision' );
		return;
		// phpcs:disable Squiz.PHP.NonExecutableCode.Unreachable

		// Retrieve the original categories of the post.
		$post_terms = $this->server_replica_storage->get_the_terms( $this->post_id, $this->taxonomy );

		$this->assertCount( 1, $post_terms );
		$this->assertEquals( $this->taxonomy, $post_terms[0]->taxonomy );
		$this->assertEquals( 'uncategorized', $post_terms[0]->slug );

		// Shallow insert a term relationship.
		global $wpdb;
		$wpdb->insert(
			$wpdb->term_relationships,
			array(
				'object_id'        => $this->post_id,
				'term_taxonomy_id' => $this->term_object->term_id,
			),
			array(
				'%d',
				'%d',
			)
		);

		// Perform a full sync.
		$this->full_sync->start();
		$this->sender->do_full_sync();

		// Retrieve the categories of the post, after the full sync.
		$post_terms_after_sync = $this->server_replica_storage->get_the_terms( $this->post_id, $this->taxonomy );

		$this->assertCount( 2, $post_terms_after_sync );
		$this->assertEquals( $this->taxonomy, $post_terms_after_sync[1]->taxonomy );
		$this->assertEquals( $this->term_object->term_id, $post_terms_after_sync[1]->term_id );
		// phpcs:enable Squiz.PHP.NonExecutableCode.Unreachable
	}

	/**
	 * Verify full sync removes term relationships that are missing on the site, but still present on WP.com.
	 */
	public function test_obsolete_term_relationships_are_deleted_on_full_sync() {

		// Test needs to be reviewed and revised.
		$this->markTestSkipped( 'Needs Revision' );
		return;
		// phpcs:disable Squiz.PHP.NonExecutableCode.Unreachable

		// Create an additional term relationship.
		wp_set_object_terms( $this->post_id, array( $this->term_object->term_id ), $this->taxonomy, true );

		// Perform sync.
		$this->sender->do_sync();

		// Retrieve the original categories of the post.
		$post_terms = $this->server_replica_storage->get_the_terms( $this->post_id, $this->taxonomy );

		$this->assertCount( 2, $post_terms );
		$this->assertEquals( $this->taxonomy, $post_terms[1]->taxonomy );
		$this->assertEquals( $this->term_object->term_id, $post_terms[1]->term_id );

		// Shallow delete the term relationship.
		global $wpdb;
		$wpdb->delete(
			$wpdb->term_relationships,
			array(
				'object_id'        => $this->post_id,
				'term_taxonomy_id' => $this->term_object->term_id,
			)
		);

		// Perform a full sync.
		$this->full_sync->start();
		$this->sender->do_full_sync();

		$post_terms_after_sync = $this->server_replica_storage->get_the_terms( $this->post_id, $this->taxonomy );
		$this->assertCount( 1, $post_terms_after_sync );
		$this->assertEquals( $this->taxonomy, $post_terms_after_sync[0]->taxonomy );
		$this->assertEquals( 'uncategorized', $post_terms_after_sync[0]->slug );
		// phpcs:enable Squiz.PHP.NonExecutableCode.Unreachable
	}
}
