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

		wp_set_current_user( $admin_id );
		$this->assertTrue( current_user_can( 'edit_post', $post_id ) );
		$this->assertTrue( current_user_can( 'delete_post', $post_id ) );
	}
}
