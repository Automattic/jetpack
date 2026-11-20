<?php
/**
 * Tests for how the Sharing module registers the per-post sharing switch.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing.php';

use Automattic\Jetpack\Sharing_Likes\Post_Sharing_Switch;

/**
 * Sharing module wiring for the per-post sharing switch.
 */
class Sharing_Post_Switch_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Theme-registered post types get the Sharing field, not a second copy of the Likes one.
	 */
	public function test_registers_the_per_post_switch_on_both_rest_hooks() {
		$callback = array( Post_Sharing_Switch::class, 'register_rest_field' );

		$this->assertSame( 10, has_action( 'rest_api_init', $callback ) );
		$this->assertSame( 20, has_action( 'restapi_theme_init', $callback ) );
		$this->assertFalse( has_action( 'restapi_theme_init', 'jetpack_post_likes_register_rest_field' ) );
	}

	/**
	 * The deprecated functions still read, write and register the switch.
	 */
	public function test_deprecated_rest_field_functions_delegate_to_the_switch() {
		$this->setExpectedDeprecated( 'jetpack_post_sharing_get_value' );
		$this->setExpectedDeprecated( 'jetpack_post_sharing_update_value' );
		$this->setExpectedDeprecated( 'jetpack_post_sharing_register_rest_field' );

		$post_id = self::factory()->post->create();

		// @phan-suppress-next-line PhanDeprecatedFunction -- The deprecated wrapper is the subject under test.
		jetpack_post_sharing_update_value( false, get_post( $post_id ) );
		$this->assertSame( '1', get_post_meta( $post_id, 'sharing_disabled', true ) );
		// @phan-suppress-next-line PhanDeprecatedFunction -- The deprecated wrapper is the subject under test.
		$this->assertFalse( jetpack_post_sharing_get_value( array( 'id' => $post_id ) ) );

		// @phan-suppress-next-line PhanDeprecatedFunction -- The deprecated wrapper is the subject under test.
		jetpack_post_sharing_register_rest_field();
		$this->assertSame(
			array( Post_Sharing_Switch::class, 'get_value' ),
			$GLOBALS['wp_rest_additional_fields']['post']['jetpack_sharing_enabled']['get_callback']
		);
	}
}
