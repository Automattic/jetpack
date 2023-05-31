<?php
/**
 * Smoke Tests for Table Checksum functionality.
 *
 * @package automattic/jetpack-sync
 */

use Automattic\Jetpack\Sync\Replicastore\Table_Checksum;

/**
 * Testing Table Checksum
 *
 * @group jetpack-sync
 */
class WP_Test_Jetpack_Sync_Checksum_Smoke extends WP_UnitTestCase {

	/**
	 * Setup Test Data.
	 */
	public function set_up() {
		parent::set_up();

		// create user.
		$user_id = self::factory()->user->create();

		// create posts.
		$post_id  = self::factory()->post->create( array( 'post_author' => $user_id ) );
		$post_id2 = self::factory()->post->create( array( 'post_author' => $user_id ) );

		// add meta.
		add_post_meta( $post_id, 'content_width', 220 );
		add_post_meta( $post_id, 'content_width', 180 );

		// add comments.
		$comment_ids = self::factory()->comment->create_post_comments( $post_id );
		$comment     = get_comment( $comment_ids[0] );

		// add comment_meta.
		add_comment_meta( $comment->comment_ID, 'hc_avatar', 'red' );

		// add terms.
		$taxonomy = 'genre';
		register_taxonomy(
			$taxonomy,
			'post',
			array(
				'label'        => __( 'Genre', 'jetpack' ),
				'rewrite'      => array( 'slug' => $taxonomy ),
				'hierarchical' => true,
			)
		);
		$term_object  = wp_insert_term( 'fiction', $taxonomy );
		$term_object2 = wp_insert_term( 'mystery', $taxonomy );

		// add term relationships.
		wp_set_post_terms( $post_id, array( $term_object['term_id'] ), $taxonomy, false );
		wp_set_post_terms( $post_id2, array( $term_object2['term_id'] ), $taxonomy, false );

		// add term meta.
		add_term_meta( $term_object['term_id'], 'test', 'red' );
		// TODO :: we don't sync this so if we every use this feature it will need to use allowed keys.
	}

	/**
	 * Array of Tables for which we can checksum.
	 *
	 * @return int[][]
	 */
	public function table_provider() {
		return array(
			array( 'posts' ),
			array( 'comments' ),
			array( 'postmeta' ),
			array( 'commentmeta' ),
			array( 'terms' ),
			array( 'termmeta' ),
			array( 'term_relationships' ),
			array( 'term_taxonomy' ),
		);
	}

	/**
	 * Validate a non 0 checksum is returned for each table.
	 *
	 * @dataProvider table_provider
	 *
	 * @param string $table Table name.
	 */
	public function test_checksum_validate_table_name( $table ) {

		$tc  = new Table_Checksum( $table );
		$sum = $tc->calculate_checksum();

		// Validate we have a checksum value.
		// NO Exceptions/Errors are thrown.
		$this->assertFalse( is_wp_error( $sum ) );
		$this->assertGreaterThan( 0, (int) $sum );
	}

}
