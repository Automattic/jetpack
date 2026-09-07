<?php
/**
 * Tests for the Jetpack SEO Breadcrumb_Schema_Node builder.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Breadcrumb_Schema_Node
 */
#[CoversClass( Breadcrumb_Schema_Node::class )]
class BreadcrumbSchemaNodeTest extends TestCase {

	/**
	 * Posts created during a test.
	 *
	 * @var int[]
	 */
	private $post_ids = array();

	/**
	 * Users created during a test.
	 *
	 * @var int[]
	 */
	private $user_ids = array();

	/**
	 * Terms created during a test.
	 *
	 * @var array[]
	 */
	private $terms = array();

	/**
	 * Term IDs injected into the object cache during a test.
	 *
	 * @var int[]
	 */
	private $cached_term_ids = array();

	/**
	 * Post types registered during a test.
	 *
	 * @var string[]
	 */
	private $post_types = array();

	/**
	 * Configurable values returned by option filters.
	 *
	 * @var string
	 */
	private $show_on_front = 'page';

	/** @var int */
	private $front_page_id = 0;

	/** @var int */
	private $posts_page_id = 0;

	/**
	 * Pin site routing options and home URL for deterministic links.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();

		add_filter(
			'pre_option_home',
			static function () {
				return 'https://example.test';
			}
		);
		add_filter(
			'pre_option_show_on_front',
			function () {
				return $this->show_on_front;
			}
		);
		add_filter(
			'pre_option_page_on_front',
			function () {
				return $this->front_page_id;
			}
		);
		add_filter(
			'pre_option_page_for_posts',
			function () {
				return $this->posts_page_id;
			}
		);

		$this->set_query( array() );
	}

	/**
	 * Clean up test content, registrations, filters, and the global query.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		foreach ( $this->post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}
		foreach ( $this->user_ids as $user_id ) {
			if ( function_exists( 'wp_delete_user' ) ) {
				wp_delete_user( $user_id );
			}
		}
		foreach ( $this->terms as $term ) {
			wp_delete_term( $term['term_id'], $term['taxonomy'] );
		}
		foreach ( $this->cached_term_ids as $term_id ) {
			wp_cache_delete( $term_id, 'terms' );
		}
		foreach ( $this->post_types as $post_type ) {
			unregister_post_type( $post_type );
		}

		foreach ( array( 'pre_option_home', 'pre_option_show_on_front', 'pre_option_page_on_front', 'pre_option_page_for_posts' ) as $hook ) {
			remove_all_filters( $hook );
		}
		$this->set_query( array() );

		parent::tearDown();
	}

	/**
	 * Hierarchical pages use their published parent chain.
	 */
	public function test_builds_hierarchical_page_trail() {
		$parent = $this->insert_post(
			array(
				'post_type'  => 'page',
				'post_title' => 'Parent page',
			)
		);
		$child  = $this->insert_post(
			array(
				'post_type'   => 'page',
				'post_title'  => 'Child page',
				'post_parent' => $parent->ID,
			)
		);

		$this->set_query( array( 'is_singular' ), $child );
		$this->assert_trail(
			array( 'Home', 'Parent page', 'Child page' ),
			array( home_url( '/' ), get_permalink( $parent ) ),
			Breadcrumb_Schema_Node::build()
		);
	}

	/**
	 * A static front page is already represented by the seeded Home item.
	 */
	public function test_does_not_duplicate_front_page_ancestor() {
		$front               = $this->insert_post(
			array(
				'post_type'  => 'page',
				'post_title' => 'Welcome',
			)
		);
		$this->front_page_id = $front->ID;
		$child               = $this->insert_post(
			array(
				'post_type'   => 'page',
				'post_title'  => 'Child page',
				'post_parent' => $front->ID,
			)
		);

		$this->set_query( array( 'is_singular' ), $child );
		$this->assert_trail(
			array( 'Home', 'Child page' ),
			array( home_url( '/' ) ),
			Breadcrumb_Schema_Node::build()
		);
	}

	/**
	 * A stale page_on_front option does not hide a normal page in posts mode.
	 */
	public function test_keeps_stale_front_page_ancestor_in_posts_mode() {
		$former_front        = $this->insert_post(
			array(
				'post_type'  => 'page',
				'post_title' => 'Former front page',
			)
		);
		$this->front_page_id = $former_front->ID;
		$this->show_on_front = 'posts';
		$child               = $this->insert_post(
			array(
				'post_type'   => 'page',
				'post_title'  => 'Child page',
				'post_parent' => $former_front->ID,
			)
		);

		$this->set_query( array( 'is_singular' ), $child );
		$this->assert_trail(
			array( 'Home', 'Former front page', 'Child page' ),
			array( home_url( '/' ), get_permalink( $former_front ) ),
			Breadcrumb_Schema_Node::build()
		);
	}

	/**
	 * Standard posts sit under the distinct posts page and never guess a category.
	 */
	public function test_builds_post_trail_without_a_guessed_category() {
		$posts_page          = $this->insert_post(
			array(
				'post_type'  => 'page',
				'post_title' => 'Journal',
			)
		);
		$this->posts_page_id = $posts_page->ID;

		$category = wp_insert_term( 'Breadcrumb News ' . wp_rand(), 'category' );
		$this->assertIsArray( $category );
		$this->terms[] = array(
			'term_id'  => $category['term_id'],
			'taxonomy' => 'category',
		);

		$post = $this->insert_post( array( 'post_title' => 'A post' ) );
		wp_set_post_categories( $post->ID, array( $category['term_id'] ) );

		$this->set_query( array( 'is_singular' ), $post );
		$this->assert_trail(
			array( 'Home', 'Journal', 'A post' ),
			array( home_url( '/' ), get_permalink( $posts_page ) ),
			Breadcrumb_Schema_Node::build()
		);
	}

	/**
	 * Hierarchical custom content includes its archive before its parent chain.
	 */
	public function test_builds_custom_post_type_archive_and_parent_trail() {
		$this->register_post_type(
			'seo_book',
			array(
				'public'       => true,
				'hierarchical' => true,
				'has_archive'  => true,
				'rewrite'      => false,
				'labels'       => array( 'name' => 'Books' ),
			)
		);
		$parent = $this->insert_post(
			array(
				'post_type'  => 'seo_book',
				'post_title' => 'Series',
			)
		);
		$child  = $this->insert_post(
			array(
				'post_type'   => 'seo_book',
				'post_title'  => 'Volume one',
				'post_parent' => $parent->ID,
			)
		);

		$this->set_query( array( 'is_singular' ), $child );
		$this->assert_trail(
			array( 'Home', 'Books', 'Series', 'Volume one' ),
			array( home_url( '/' ), get_post_type_archive_link( 'seo_book' ), get_permalink( $parent ) ),
			Breadcrumb_Schema_Node::build()
		);
	}

	/**
	 * Hierarchical taxonomy archives include their root-to-leaf term ancestry.
	 */
	public function test_builds_taxonomy_ancestor_trail() {
		$parent = $this->cache_term( 900001, 'Parent topic' );
		$child  = $this->cache_term( 900002, 'Child topic', $parent->term_id );

		$this->set_query( array( 'is_archive', 'is_category' ), $child, array( 'paged' => 3 ) );
		$this->assert_trail(
			array( 'Home', 'Parent topic', 'Child topic' ),
			array( home_url( '/' ), get_term_link( $parent ) ),
			Breadcrumb_Schema_Node::build()
		);
	}

	/**
	 * Blog pagination keeps the underlying two-item archive trail.
	 */
	public function test_builds_blog_archive_without_a_page_number_item() {
		$posts_page          = $this->insert_post(
			array(
				'post_type'  => 'page',
				'post_title' => 'Journal',
			)
		);
		$this->posts_page_id = $posts_page->ID;

		$this->set_query( array( 'is_home' ), null, array( 'paged' => 4 ) );
		$this->assert_trail(
			array( 'Home', 'Journal' ),
			array( home_url( '/' ) ),
			Breadcrumb_Schema_Node::build()
		);
	}

	/**
	 * A public custom post type archive uses its plural label.
	 */
	public function test_builds_post_type_archive_trail() {
		$this->register_post_type(
			'seo_book',
			array(
				'public'      => true,
				'has_archive' => true,
				'labels'      => array( 'name' => 'Books' ),
			)
		);
		$post_type = get_post_type_object( 'seo_book' );

		$this->set_query( array( 'is_archive', 'is_post_type_archive' ), $post_type );
		$this->assert_trail(
			array( 'Home', 'Books' ),
			array( home_url( '/' ) ),
			Breadcrumb_Schema_Node::build()
		);
	}

	/**
	 * Author archives sit under the distinct posts page.
	 */
	public function test_builds_author_archive_trail() {
		$posts_page          = $this->insert_post(
			array(
				'post_type'  => 'page',
				'post_title' => 'Journal',
			)
		);
		$this->posts_page_id = $posts_page->ID;
		$author              = $this->insert_user( 'Jane Doe' );

		$this->set_query( array( 'is_archive', 'is_author' ), $author );
		$this->assert_trail(
			array( 'Home', 'Journal', 'Jane Doe' ),
			array( home_url( '/' ), get_permalink( $posts_page ) ),
			Breadcrumb_Schema_Node::build()
		);
	}

	/**
	 * Year, month, and day archives progressively add navigable date ancestors.
	 */
	public function test_builds_date_archive_trails() {
		$posts_page          = $this->insert_post(
			array(
				'post_type'  => 'page',
				'post_title' => 'Journal',
			)
		);
		$this->posts_page_id = $posts_page->ID;

		$this->set_query( array( 'is_archive', 'is_date', 'is_year' ), null, array( 'year' => 2026 ) );
		$this->assert_trail(
			array( 'Home', 'Journal', '2026' ),
			array( home_url( '/' ), get_permalink( $posts_page ) ),
			Breadcrumb_Schema_Node::build()
		);

		$this->set_query(
			array( 'is_archive', 'is_date', 'is_month' ),
			null,
			array(
				'year'     => 2026,
				'monthnum' => 7,
			)
		);
		$this->assert_trail(
			array( 'Home', 'Journal', '2026', 'July' ),
			array( home_url( '/' ), get_permalink( $posts_page ), get_year_link( 2026 ) ),
			Breadcrumb_Schema_Node::build()
		);

		$this->set_query(
			array( 'is_archive', 'is_date', 'is_day' ),
			null,
			array(
				'year'     => 2026,
				'monthnum' => 7,
				'day'      => 13,
			)
		);
		$this->assert_trail(
			array( 'Home', 'Journal', '2026', 'July', '13' ),
			array( home_url( '/' ), get_permalink( $posts_page ), get_year_link( 2026 ), get_month_link( 2026, 7 ) ),
			Breadcrumb_Schema_Node::build()
		);
	}

	/**
	 * Front-page, search, 404, and unknown archive requests emit no breadcrumbs.
	 */
	public function test_skips_unsupported_request_types() {
		$this->show_on_front = 'posts';
		$this->set_query( array( 'is_home' ) );
		$this->assertTrue( is_front_page() );
		$this->assertNull( Breadcrumb_Schema_Node::build() );

		$this->show_on_front = 'page';
		$this->set_query( array( 'is_search' ) );
		$this->assertNull( Breadcrumb_Schema_Node::build() );

		$this->set_query( array( 'is_404' ) );
		$this->assertNull( Breadcrumb_Schema_Node::build() );

		$this->set_query( array( 'is_archive' ) );
		$this->assertNull( Breadcrumb_Schema_Node::build() );
	}

	/**
	 * Invalid, unpublished, untitled, and non-public singular objects emit nothing.
	 */
	public function test_skips_invalid_singular_objects() {
		$this->set_query( array( 'is_singular' ), new \stdClass() );
		$this->assertNull( Breadcrumb_Schema_Node::build() );

		$draft = $this->insert_post(
			array(
				'post_status' => 'draft',
				'post_title'  => 'Draft',
			)
		);
		$this->set_query( array( 'is_singular' ), $draft );
		$this->assertNull( Breadcrumb_Schema_Node::build() );

		$untitled = $this->insert_post(
			array(
				'post_title'   => '',
				'post_content' => 'Content',
			)
		);
		$this->set_query( array( 'is_singular' ), $untitled );
		$this->assertNull( Breadcrumb_Schema_Node::build() );

		$this->register_post_type( 'seo_secret', array( 'public' => false ) );
		$private_type = $this->insert_post(
			array(
				'post_type'  => 'seo_secret',
				'post_title' => 'Secret',
			)
		);
		$this->set_query( array( 'is_singular' ), $private_type );
		$this->assertNull( Breadcrumb_Schema_Node::build() );
	}

	/**
	 * Assert the complete ListItem contract for a breadcrumb trail.
	 *
	 * @param string[]   $names Expected item names.
	 * @param string[]   $urls  Expected ancestor URLs, excluding the current item.
	 * @param array|null $node  Built node.
	 * @return void
	 */
	private function assert_trail( array $names, array $urls, $node ) {
		$this->assertIsArray( $node );
		$this->assertSame( 'BreadcrumbList', $node['@type'] );
		$this->assertSame( $names, array_column( $node['itemListElement'], 'name' ) );
		$this->assertSame( range( 1, count( $names ) ), array_column( $node['itemListElement'], 'position' ) );
		$this->assertSame( $urls, array_column( array_slice( $node['itemListElement'], 0, -1 ), 'item' ) );

		foreach ( $node['itemListElement'] as $item ) {
			$this->assertSame( 'ListItem', $item['@type'] );
		}
		$this->assertArrayNotHasKey( 'item', $node['itemListElement'][ count( $names ) - 1 ] );
	}

	/**
	 * Replace the global query with controlled flags, object, and query vars.
	 *
	 * @param string[] $flags      WP_Query boolean property names.
	 * @param mixed    $object     Queried object.
	 * @param array    $query_vars Query variables.
	 * @return void
	 */
	private function set_query( array $flags, $object = null, array $query_vars = array() ) {
		global $wp_query;
		$wp_query = new \WP_Query();
		foreach ( $flags as $flag ) {
			$wp_query->{$flag} = true;
		}
		$wp_query->queried_object    = $object;
		$wp_query->queried_object_id = isset( $object->ID ) ? (int) $object->ID : ( isset( $object->term_id ) ? (int) $object->term_id : 0 );
		$wp_query->query_vars        = array_merge( $wp_query->query_vars, $query_vars );
	}

	/**
	 * Insert and track a published post.
	 *
	 * @param array $overrides Post fields.
	 * @return \WP_Post
	 */
	private function insert_post( array $overrides = array() ) {
		$post_id = wp_insert_post(
			array_merge(
				array(
					'post_type'   => 'post',
					'post_status' => 'publish',
					'post_title'  => 'Test post',
				),
				$overrides
			),
			true
		);
		$this->assertIsInt( $post_id );
		$this->post_ids[] = $post_id;
		return get_post( $post_id );
	}

	/**
	 * Register and track a custom post type.
	 *
	 * @param string $name Post type name.
	 * @param array  $args Registration arguments.
	 * @return void
	 */
	private function register_post_type( $name, array $args ) {
		$this->assertNotInstanceOf( \WP_Error::class, register_post_type( $name, $args ) );
		$this->post_types[] = $name;
	}

	/**
	 * Put a deterministic term in WordPress's object cache.
	 *
	 * WorDBless stores inserted terms but does not hydrate them through get_term(),
	 * while the production breadcrumb path uses get_term() to walk ancestors.
	 *
	 * @param int    $term_id Term ID.
	 * @param string $name    Term name.
	 * @param int    $parent  Parent term ID.
	 * @return \WP_Term
	 */
	private function cache_term( $term_id, $name, $parent = 0 ) {
		$term = new \WP_Term(
			(object) array(
				'term_id'          => $term_id,
				'name'             => $name,
				'slug'             => sanitize_title( $name ),
				'term_group'       => 0,
				'term_taxonomy_id' => $term_id,
				'taxonomy'         => 'category',
				'description'      => '',
				'parent'           => $parent,
				'count'            => 1,
			)
		);

		wp_cache_set( $term_id, $term, 'terms' );
		$this->cached_term_ids[] = $term_id;
		return $term;
	}

	/**
	 * Insert and track a WordPress user.
	 *
	 * @param string $display_name Display name.
	 * @return \WP_User
	 */
	private function insert_user( $display_name ) {
		$suffix  = (string) wp_rand();
		$user_id = wp_insert_user(
			array(
				'user_login'   => 'breadcrumb_author_' . $suffix,
				'user_pass'    => 'password',
				'user_email'   => 'breadcrumb_' . $suffix . '@example.test',
				'display_name' => $display_name,
			)
		);
		$this->assertIsInt( $user_id );
		$this->user_ids[] = $user_id;
		return get_userdata( $user_id );
	}
}
