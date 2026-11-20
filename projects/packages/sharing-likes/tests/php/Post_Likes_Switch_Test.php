<?php
/**
 * Tests for the per-post Likes switch.
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
 * @covers \Automattic\Jetpack\Sharing_Likes\Post_Likes_Switch
 */
#[CoversClass( Post_Likes_Switch::class )]
class Post_Likes_Switch_Test extends BaseTestCase {

	use Post_Switch_Helpers;

	/**
	 * Start every case from a published post and the extra post types.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_post_switch( 'jetpack-post-likes' );
	}

	/**
	 * Undo the registrations WorDBless does not reset.
	 */
	public function tear_down() {
		$this->tear_down_post_switch();

		parent::tear_down();
	}

	/**
	 * Turn sitewide Likes off, unless asked for on, which is the default.
	 *
	 * @param bool $sitewide Whether Likes are on by default.
	 */
	private function given_sitewide_likes( bool $sitewide ): void {
		if ( ! $sitewide ) {
			update_option( 'disabled_likes', 1 );
		}
	}

	public function test_init_hooks_registration_on_both_rest_api_hooks(): void {
		Post_Likes_Switch::init();

		$callback = array( Post_Likes_Switch::class, 'register_rest_field' );
		$this->assertSame( 10, has_action( 'rest_api_init', $callback ) );
		$this->assertSame( 20, has_action( 'restapi_theme_init', $callback ) );
	}

	/**
	 * More than one module calls `init()`.
	 */
	public function test_init_twice_hooks_each_action_once(): void {
		$rest_api_init      = $this->count_callbacks( 'rest_api_init' );
		$restapi_theme_init = $this->count_callbacks( 'restapi_theme_init' );

		Post_Likes_Switch::init();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Calling twice is the assertion.
		Post_Likes_Switch::init();

		$this->assertSame( $rest_api_init + 1, $this->count_callbacks( 'rest_api_init' ) );
		$this->assertSame( $restapi_theme_init + 1, $this->count_callbacks( 'restapi_theme_init' ) );
	}

	public function test_register_rest_field_covers_every_public_post_type(): void {
		Post_Likes_Switch::register_rest_field();

		foreach ( array( 'post', 'page', 'switch_public' ) as $post_type ) {
			$this->assertArrayHasKey( 'jetpack_likes_enabled', $GLOBALS['wp_rest_additional_fields'][ $post_type ] ?? array(), $post_type );
			$field = $GLOBALS['wp_rest_additional_fields'][ $post_type ]['jetpack_likes_enabled'];

			$this->assertSame( array( Post_Likes_Switch::class, 'get_value' ), $field['get_callback'] );
			$this->assertSame( array( Post_Likes_Switch::class, 'update_value' ), $field['update_callback'] );
			$this->assertSame(
				array(
					'description' => 'Are Likes enabled?',
					'type'        => 'boolean',
				),
				$field['schema']
			);
			$this->assertTrue( post_type_supports( $post_type, 'jetpack-post-likes' ), $post_type );
		}
	}

	public function test_register_rest_field_skips_non_public_post_types(): void {
		Post_Likes_Switch::register_rest_field();

		$this->assertArrayNotHasKey( 'switch_private', $GLOBALS['wp_rest_additional_fields'] );
		$this->assertFalse( post_type_supports( 'switch_private', 'jetpack-post-likes' ) );
	}

	/**
	 * Stored meta, sitewide default, and what the field reads.
	 *
	 * @return array<string, array{0: ?string, 1: bool, 2: ?bool}>
	 */
	public static function provide_stored_values(): array {
		return array(
			'unset, sitewide on'       => array( null, true, true ),
			'unset, sitewide off'      => array( null, false, false ),
			"'0', sitewide on"         => array( '0', true, false ),
			"'0', sitewide off"        => array( '0', false, false ),
			"'1', sitewide on"         => array( '1', true, true ),
			"'1', sitewide off"        => array( '1', false, true ),
			'unexpected, sitewide on'  => array( 'yes', true, null ),
			'unexpected, sitewide off' => array( '2', false, null ),
		);
	}

	/**
	 * Meta is seeded as strings because that is what the database hands back.
	 *
	 * @param string|null $stored   Stored `switch_like_status`, or null for none.
	 * @param bool        $sitewide Whether Likes are on by default.
	 * @param bool|null   $expected What the field reads.
	 * @dataProvider provide_stored_values
	 */
	#[DataProvider( 'provide_stored_values' )]
	public function test_get_value( ?string $stored, bool $sitewide, ?bool $expected ): void {
		$this->given_sitewide_likes( $sitewide );
		if ( null !== $stored ) {
			update_post_meta( $this->post_id, 'switch_like_status', $stored );
		}

		$this->assertSame( $expected, Post_Likes_Switch::get_value( array( 'id' => $this->post_id ) ) );
	}

	public function test_get_value_follows_the_sitewide_filter(): void {
		add_filter( 'wpl_is_enabled_sitewide', '__return_false' );

		$this->assertFalse( Post_Likes_Switch::get_value( array( 'id' => $this->post_id ) ) );
	}

	public function test_get_value_is_false_without_a_post_id(): void {
		$this->assertFalse( Post_Likes_Switch::get_value( array() ) );
	}

	/**
	 * Requested value, sitewide default, meta before, and meta after.
	 *
	 * @return array<string, array{0: bool, 1: bool, 2: ?string, 3: ?string}>
	 */
	public static function provide_updates(): array {
		return array(
			'enable, sitewide on, clears an override'   => array( true, true, '0', null ),
			'disable, sitewide on'                      => array( false, true, null, '0' ),
			'disable, sitewide on, replaces 1'          => array( false, true, '1', '0' ),
			'enable, sitewide off'                      => array( true, false, null, '1' ),
			'enable, sitewide off, replaces 0'          => array( true, false, '0', '1' ),
			'disable, sitewide off, clears an override' => array( false, false, '1', null ),
		);
	}

	/**
	 * Only a choice that contradicts the sitewide default is stored.
	 *
	 * @param bool        $enable   Requested value.
	 * @param bool        $sitewide Whether Likes are on by default.
	 * @param string|null $before   Stored `switch_like_status` beforehand, or null for none.
	 * @param string|null $after    Stored `switch_like_status` afterwards, as the database would return it, or null for none.
	 * @dataProvider provide_updates
	 */
	#[DataProvider( 'provide_updates' )]
	public function test_update_value( bool $enable, bool $sitewide, ?string $before, ?string $after ): void {
		$this->given_sitewide_likes( $sitewide );
		if ( null !== $before ) {
			update_post_meta( $this->post_id, 'switch_like_status', $before );
		}

		Post_Likes_Switch::update_value( $enable, get_post( $this->post_id ) );

		$this->assertSame( $after, $this->stored_meta( 'switch_like_status' ) );
	}

	/**
	 * WorDBless reports `true` for a new override where a database would return its meta ID.
	 */
	public function test_update_value_returns_what_update_post_meta_returned(): void {
		$this->assertTrue( Post_Likes_Switch::update_value( false, get_post( $this->post_id ) ) );
		$this->assertFalse( Post_Likes_Switch::update_value( false, get_post( $this->post_id ) ) );
	}

	/**
	 * True when an override was cleared, false when there was none.
	 */
	public function test_update_value_returns_what_delete_post_meta_returned(): void {
		update_post_meta( $this->post_id, 'switch_like_status', '0' );

		$this->assertTrue( Post_Likes_Switch::update_value( true, get_post( $this->post_id ) ) );
		$this->assertFalse( Post_Likes_Switch::update_value( true, get_post( $this->post_id ) ) );
	}
}
