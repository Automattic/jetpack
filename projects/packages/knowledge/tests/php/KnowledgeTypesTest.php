<?php
/**
 * Tests for the public knowledge functions defined in lib/experimental/knowledge/knowledge.php.
 *
 * @package automattic/jetpack-knowledge
 *
 * @group knowledge
 */

use PHPUnit\Framework\Attributes\Group;
/**
 * @group knowledge
 */
#[Group( 'knowledge' )]
class KnowledgeTypesTest extends KnowledgeTestCase {
	public function test_concurrent_type_creation_preserves_the_saved_posts_type() {
		$existing = term_exists( 'note', 'wp_knowledge_type' );
		if ( $existing ) {
			wp_delete_term( (int) $existing['term_id'], 'wp_knowledge_type' );
		}

		$winner_id = null;
		$race      = static function ( $term, $taxonomy ) use ( &$race, &$winner_id ) {
			if ( 'wp_knowledge_type' !== $taxonomy || 'note' !== $term ) {
				return $term;
			}
			remove_filter( 'pre_insert_term', $race );
			$winner    = wp_insert_term( 'note', 'wp_knowledge_type' );
			$winner_id = (int) $winner['term_id'];
			return new WP_Error( 'term_exists', 'Concurrent insert', $winner_id );
		};
		add_filter( 'pre_insert_term', $race, 10, 2 );

		try {
			$post_id = wp_insert_post(
				array(
					'post_type'   => 'wp_knowledge',
					'post_status' => 'private',
					'post_title'  => 'Concurrent note',
				)
			);
			$this->assertGreaterThan( 0, $winner_id );
			$this->assertSame( array( $winner_id ), wp_get_object_terms( $post_id, 'wp_knowledge_type', array( 'fields' => 'ids' ) ) );
		} finally {
			remove_filter( 'pre_insert_term', $race );
		}
	}

	/**
	 * The function should expose the built-in knowledge types keyed by slug,
	 * sorted alphabetically, with their human-readable titles.
	 */
	public function test_returns_default_knowledge_types() {
		$this->assertSame(
			array(
				'guideline' => array( 'title' => 'Guideline' ),
				'memory'    => array( 'title' => 'Memory' ),
				'note'      => array( 'title' => 'Note' ),
			),
			wp_knowledge_types()
		);
	}

	/**
	 * The wp_knowledge_types filter should be able to add new entries.
	 */
	public function test_types_filter_can_register_additional_types() {
		add_filter(
			'wp_knowledge_types',
			static function ( $types ) {
				$types['custom'] = array( 'title' => 'Custom' );
				return $types;
			}
		);

		$types = wp_knowledge_types();

		$this->assertArrayHasKey( 'custom', $types );
		$this->assertSame( 'Custom', $types['custom']['title'] );
	}

	/**
	 * The wp_knowledge_types filter should be able to remove built-in entries.
	 */
	public function test_types_filter_can_remove_default_types() {
		add_filter(
			'wp_knowledge_types',
			static function ( $types ) {
				unset( $types['guideline'] );
				return $types;
			}
		);

		$types = wp_knowledge_types();

		$this->assertArrayNotHasKey( 'guideline', $types );
	}

	/**
	 * Other taxonomies must pass through untouched.
	 */
	public function test_label_filter_ignores_other_taxonomies() {
		$input  = array(
			'name' => 'note',
			'slug' => 'note',
		);
		$output = wp_knowledge_maybe_map_term_label( $input, 'category' );

		$this->assertSame( $input, $output );
	}

	/**
	 * A user-provided name (different from the slug) must not be overwritten.
	 */
	public function test_label_filter_preserves_user_provided_name() {
		$input  = array(
			'name' => 'My Custom Note',
			'slug' => 'note',
		);
		$output = wp_knowledge_maybe_map_term_label( $input, 'wp_knowledge_type' );

		$this->assertSame( $input, $output );
	}

	/**
	 * Slugs that aren't registered knowledge types must pass through untouched.
	 */
	public function test_label_filter_ignores_unknown_slugs() {
		$input  = array(
			'name' => 'unknown',
			'slug' => 'unknown',
		);
		$output = wp_knowledge_maybe_map_term_label( $input, 'wp_knowledge_type' );

		$this->assertSame( $input, $output );
	}

	/**
	 * End-to-end: when wp_set_object_terms() lazily creates the 'note' term, the resulting term name
	 * should be the human-readable title rather than the raw slug.
	 */
	public function test_label_filter_runs_through_wp_set_object_terms() {
		$post_id = wp_insert_post( array( 'post_title' => 'Knowledge fixture' ) );
		register_taxonomy( 'wp_knowledge_type', 'post' );

		wp_set_object_terms( $post_id, 'note', 'wp_knowledge_type' );

		$term = get_term_by( 'slug', 'note', 'wp_knowledge_type' );
		$this->assertInstanceOf( WP_Term::class, $term );
		$this->assertSame( 'Note', $term->name );
	}
}
