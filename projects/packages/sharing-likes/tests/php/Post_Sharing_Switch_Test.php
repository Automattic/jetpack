<?php
/**
 * Tests for the per-post Sharing switch.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/lib/trait-post-switch-helpers.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Post_Sharing_Switch
 */
#[CoversClass( Post_Sharing_Switch::class )]
class Post_Sharing_Switch_Test extends BaseTestCase {

	use Post_Switch_Helpers;

	/**
	 * Start every case from a published post and the extra post types.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_post_switch( 'jetpack-sharing-buttons' );
	}

	/**
	 * Undo the registrations WorDBless does not reset.
	 */
	public function tear_down() {
		$this->tear_down_post_switch();

		parent::tear_down();
	}

	public function test_init_hooks_registration_on_both_rest_api_hooks(): void {
		Post_Sharing_Switch::init();

		$callback = array( Post_Sharing_Switch::class, 'register_rest_field' );
		$this->assertSame( 10, has_action( 'rest_api_init', $callback ) );
		$this->assertSame( 20, has_action( 'restapi_theme_init', $callback ) );
	}

	/**
	 * Why: see Post_Likes_Switch_Test::test_init_twice_hooks_each_action_once().
	 */
	public function test_init_twice_hooks_each_action_once(): void {
		$rest_api_init      = $this->count_callbacks( 'rest_api_init' );
		$restapi_theme_init = $this->count_callbacks( 'restapi_theme_init' );

		Post_Sharing_Switch::init();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Calling twice is the assertion.
		Post_Sharing_Switch::init();

		$this->assertSame( $rest_api_init + 1, $this->count_callbacks( 'rest_api_init' ) );
		$this->assertSame( $restapi_theme_init + 1, $this->count_callbacks( 'restapi_theme_init' ) );
	}

	public function test_register_rest_field_covers_every_public_post_type(): void {
		Post_Sharing_Switch::register_rest_field();

		foreach ( array( 'post', 'page', 'switch_public' ) as $post_type ) {
			$this->assertArrayHasKey( 'jetpack_sharing_enabled', $GLOBALS['wp_rest_additional_fields'][ $post_type ] ?? array(), $post_type );
			$field = $GLOBALS['wp_rest_additional_fields'][ $post_type ]['jetpack_sharing_enabled'];

			$this->assertSame( array( Post_Sharing_Switch::class, 'get_value' ), $field['get_callback'] );
			$this->assertSame( array( Post_Sharing_Switch::class, 'update_value' ), $field['update_callback'] );
			$this->assertSame(
				array(
					'description' => 'Are sharing buttons enabled?',
					'type'        => 'boolean',
				),
				$field['schema']
			);
			$this->assertTrue( post_type_supports( $post_type, 'jetpack-sharing-buttons' ), $post_type );
		}
	}

	public function test_register_rest_field_skips_non_public_post_types(): void {
		Post_Sharing_Switch::register_rest_field();

		$this->assertArrayNotHasKey( 'switch_private', $GLOBALS['wp_rest_additional_fields'] );
		$this->assertFalse( post_type_supports( 'switch_private', 'jetpack-sharing-buttons' ) );
	}

	/**
	 * Stored meta and what the field reads.
	 *
	 * @return array<string, array{0: ?string, 1: bool}>
	 */
	public static function provide_stored_values(): array {
		return array(
			'unset'        => array( null, true ),
			"'1'"          => array( '1', false ),
			"'0'"          => array( '0', true ),
			'other truthy' => array( 'yes', false ),
		);
	}

	/**
	 * Any truthy meta value opts the post out.
	 *
	 * @param string|null $stored   Stored `sharing_disabled`, or null for none.
	 * @param bool        $expected What the field reads.
	 * @dataProvider provide_stored_values
	 */
	#[DataProvider( 'provide_stored_values' )]
	public function test_get_value( ?string $stored, bool $expected ): void {
		if ( null !== $stored ) {
			update_post_meta( $this->post_id, 'sharing_disabled', $stored );
		}

		$this->assertSame( $expected, Post_Sharing_Switch::get_value( array( 'id' => $this->post_id ) ) );
	}

	public function test_get_value_is_false_without_a_post_id(): void {
		$this->assertFalse( Post_Sharing_Switch::get_value( array() ) );
	}

	public function test_disabling_stores_the_opt_out(): void {
		Post_Sharing_Switch::update_value( false, get_post( $this->post_id ) );

		$this->assertSame( '1', $this->stored_meta( 'sharing_disabled' ) );
	}

	public function test_enabling_clears_the_opt_out(): void {
		update_post_meta( $this->post_id, 'sharing_disabled', '1' );

		Post_Sharing_Switch::update_value( true, get_post( $this->post_id ) );

		$this->assertNull( $this->stored_meta( 'sharing_disabled' ) );
	}

	/**
	 * Why `true`: see Post_Likes_Switch_Test::test_update_value_returns_what_update_post_meta_returned().
	 */
	public function test_update_value_returns_what_update_post_meta_returned(): void {
		$this->assertTrue( Post_Sharing_Switch::update_value( false, get_post( $this->post_id ) ) );
		$this->assertFalse( Post_Sharing_Switch::update_value( false, get_post( $this->post_id ) ) );
	}

	/**
	 * True when an opt-out was cleared, false when there was none.
	 */
	public function test_update_value_returns_what_delete_post_meta_returned(): void {
		update_post_meta( $this->post_id, 'sharing_disabled', '1' );

		$this->assertTrue( Post_Sharing_Switch::update_value( true, get_post( $this->post_id ) ) );
		$this->assertFalse( Post_Sharing_Switch::update_value( true, get_post( $this->post_id ) ) );
	}
}
