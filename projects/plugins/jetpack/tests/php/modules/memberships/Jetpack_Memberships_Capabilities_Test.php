<?php
/**
 * Tests for ownership enforcement on membership plan and coupon post types.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';

/**
 * @covers Jetpack_Memberships
 */
#[\PHPUnit\Framework\Attributes\CoversClass( Jetpack_Memberships::class )]
class Jetpack_Memberships_Capabilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The map_meta_cap filter is registered on init; the plan/coupon post types are too.
	 */
	public function set_up() {
		parent::set_up();
		// Registers the plan/coupon post types and the ownership map_meta_cap filter.
		Jetpack_Memberships::get_instance()->init_hook_action();
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public static function post_type_provider() {
		return array(
			'plan'   => array( Jetpack_Memberships::$post_type_plan ),
			'coupon' => array( Jetpack_Memberships::$post_type_coupon ),
		);
	}

	/**
	 * A contributor cannot edit or delete a plan or coupon owned by someone else.
	 *
	 * @dataProvider post_type_provider
	 * @param string $post_type The membership post type under test.
	 */
	#[DataProvider( 'post_type_provider' )]
	public function test_contributor_cannot_edit_or_delete_others_post( $post_type ) {
		$admin_id       = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$contributor_id = self::factory()->user->create( array( 'role' => 'contributor' ) );
		$post_id        = self::factory()->post->create(
			array(
				'post_type'   => $post_type,
				'post_status' => 'publish',
				'post_author' => $admin_id,
			)
		);

		wp_set_current_user( $contributor_id );
		$this->assertFalse( current_user_can( 'edit_post', $post_id ) );
		$this->assertFalse( current_user_can( 'delete_post', $post_id ) );
		$this->assertFalse( current_user_can( 'edit_post_meta', $post_id, 'jetpack_memberships_price' ) );
	}

	/**
	 * The owner, and an administrator, keep full access.
	 *
	 * @dataProvider post_type_provider
	 * @param string $post_type The membership post type under test.
	 */
	#[DataProvider( 'post_type_provider' )]
	public function test_owner_and_admin_keep_access( $post_type ) {
		$admin_id       = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$contributor_id = self::factory()->user->create( array( 'role' => 'contributor' ) );
		$post_id        = self::factory()->post->create(
			array(
				'post_type'   => $post_type,
				'post_status' => 'publish',
				'post_author' => $contributor_id,
			)
		);

		wp_set_current_user( $contributor_id );
		$this->assertTrue( current_user_can( 'edit_post', $post_id ) );
		$this->assertTrue( current_user_can( 'delete_post', $post_id ) );

		wp_set_current_user( $admin_id );
		$this->assertTrue( current_user_can( 'edit_post', $post_id ) );
		$this->assertTrue( current_user_can( 'delete_post', $post_id ) );
	}

	/**
	 * An `edit_comment` check must not look the comment ID up as a post.
	 */
	public function test_edit_comment_does_not_query_comment_id_as_post() {
		global $wpdb;

		$author_id  = self::factory()->user->create( array( 'role' => 'author' ) );
		$post_id    = self::factory()->post->create( array( 'post_author' => $author_id ) );
		$missing_id = (int) $wpdb->get_var( "SELECT MAX(ID) FROM $wpdb->posts" ) + 1000;
		$comment_id = $this->create_comment_with_id( $missing_id, $post_id );
		$post_query = $wpdb->prepare( "SELECT * FROM $wpdb->posts WHERE ID = %d LIMIT 1", $comment_id );

		$queries = array();
		$logger  = function ( $query ) use ( &$queries ) {
			$queries[] = $query;
			return $query;
		};

		wp_set_current_user( $author_id );
		add_filter( 'query', $logger );
		current_user_can( 'edit_comment', $comment_id );
		remove_filter( 'query', $logger );

		$this->assertNotContains( $post_query, $queries );

		add_filter( 'query', $logger );
		get_post( $missing_id );
		remove_filter( 'query', $logger );

		$this->assertContains( $post_query, $queries, 'Control: a missing-post lookup should log this query.' );
	}

	/**
	 * A comment sharing its ID with someone else's plan gets the same `edit_comment` result as without the filter.
	 */
	public function test_edit_comment_with_plan_id_is_unaffected() {
		$admin_id   = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$author_id  = self::factory()->user->create( array( 'role' => 'author' ) );
		$plan_id    = self::factory()->post->create(
			array(
				'post_type'   => Jetpack_Memberships::$post_type_plan,
				'post_status' => 'publish',
				'post_author' => $admin_id,
			)
		);
		$post_id    = self::factory()->post->create( array( 'post_author' => $author_id ) );
		$comment_id = $this->create_comment_with_id( $plan_id, $post_id );

		wp_set_current_user( $author_id );
		$memberships = Jetpack_Memberships::get_instance();
		remove_filter( 'map_meta_cap', array( $memberships, 'map_plan_meta_cap' ), 10 );
		$expected = current_user_can( 'edit_comment', $comment_id );
		add_filter( 'map_meta_cap', array( $memberships, 'map_plan_meta_cap' ), 10, 4 );

		$this->assertTrue( $expected );
		$this->assertSame( $expected, current_user_can( 'edit_comment', $comment_id ) );
	}

	/**
	 * Create a comment on a post and give it a chosen ID.
	 *
	 * @param int $comment_id The ID the comment should have.
	 * @param int $post_id    The post the comment belongs to.
	 * @return int The comment ID.
	 */
	private function create_comment_with_id( $comment_id, $post_id ) {
		global $wpdb;

		$created_id = self::factory()->comment->create( array( 'comment_post_ID' => $post_id ) );
		$wpdb->update( $wpdb->comments, array( 'comment_ID' => $comment_id ), array( 'comment_ID' => $created_id ) );
		clean_comment_cache( array( $created_id, $comment_id ) );

		return $comment_id;
	}
}
