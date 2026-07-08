<?php
/**
 * Tests for the post-level newsletter access meta (`_jetpack_newsletter_access`),
 * covering NL-715: corrupt (non-string) values must not reach the strict
 * string-typed access checks and fatal the render.
 *
 * Two layers are exercised:
 *  - Read side: Jetpack_Memberships::get_post_access_level() coerces any
 *    non-string stored value to the "everybody" default.
 *  - Write side: the register_post_meta() sanitize_callback coerces a non-string
 *    write to '' so the corrupt value can't be persisted via sanitize_meta()
 *    write paths in the first place.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use PHPUnit\Framework\Attributes\CoversClass;
use function Automattic\Jetpack\Extensions\Subscriptions\register_block as register_subscription_block;
use const Automattic\Jetpack\Extensions\Subscriptions\META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS;

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriptions/subscriptions.php';

/**
 * @covers Jetpack_Memberships
 */
#[CoversClass( Jetpack_Memberships::class )]
class Jetpack_Subscriptions_Access_Level_Meta_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset the static access-level cache between tests so a value cached under a
	 * blog/post key in one test cannot leak into another.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();
		Jetpack_Memberships::clear_post_access_level_cache();
	}

	/**
	 * Writes a raw value straight into the postmeta table, bypassing
	 * update_post_meta()'s sanitization, to faithfully reproduce the corrupt rows
	 * that non-REST write paths persisted in production (e.g. a:1:{i:0;s:0:"";}).
	 *
	 * @param int   $post_id The post to attach the meta to.
	 * @param mixed $value   The raw (already-serializable) value to store.
	 * @return void
	 */
	private function force_corrupt_access_meta( $post_id, $value ) {
		global $wpdb;
		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $post_id,
				'meta_key'   => META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
				'meta_value' => maybe_serialize( $value ),
			)
		);
		wp_cache_delete( $post_id, 'post_meta' );
		Jetpack_Memberships::clear_post_access_level_cache();
	}

	/**
	 * The exact corrupt shape seen in production — an array containing one empty
	 * string — must be treated as "everybody" rather than flowing through as an
	 * array and fataling the strict string-typed `earn_user_has_access` callback.
	 *
	 * This is the regression test for NL-715: it fails before the guard (returns
	 * the array) and passes after (returns the EVERYBODY default).
	 *
	 * @return void
	 */
	public function test_array_access_level_meta_defaults_to_everybody() {
		$post_id = self::factory()->post->create();
		$this->force_corrupt_access_meta( $post_id, array( '' ) );

		// Sanity check: the corrupt array really is persisted and is not empty().
		$raw = get_post_meta( $post_id, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, true );
		$this->assertIsArray( $raw );
		$this->assertNotEmpty( $raw );

		$this->assertSame(
			Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_EVERYBODY,
			Jetpack_Memberships::get_post_access_level( $post_id )
		);
	}

	/**
	 * A multi-value array (another corrupt shape a non-REST writer could persist)
	 * is likewise coerced to the everybody default rather than returned as an array.
	 *
	 * @return void
	 */
	public function test_multi_value_array_access_level_meta_defaults_to_everybody() {
		$post_id = self::factory()->post->create();
		$this->force_corrupt_access_meta(
			$post_id,
			array(
				Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS,
				Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_SUBSCRIBERS,
			)
		);

		$this->assertSame(
			Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_EVERYBODY,
			Jetpack_Memberships::get_post_access_level( $post_id )
		);
	}

	/**
	 * A valid string access level is returned unchanged — the guard must not
	 * regress the normal path.
	 *
	 * @return void
	 */
	public function test_valid_string_access_level_meta_is_returned_unchanged() {
		$post_id = self::factory()->post->create();
		update_post_meta(
			$post_id,
			META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
			Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_SUBSCRIBERS
		);
		Jetpack_Memberships::clear_post_access_level_cache();

		$this->assertSame(
			Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_SUBSCRIBERS,
			Jetpack_Memberships::get_post_access_level( $post_id )
		);
	}

	/**
	 * An unset access level falls back to everybody, as before.
	 *
	 * @return void
	 */
	public function test_missing_access_level_meta_defaults_to_everybody() {
		$post_id = self::factory()->post->create();

		$this->assertSame(
			Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_EVERYBODY,
			Jetpack_Memberships::get_post_access_level( $post_id )
		);
	}

	/**
	 * Write-side defense (NL-715): once the meta is registered, an array written
	 * through the normal update_post_meta() path is coerced to '' by the
	 * sanitize_callback, so the corrupt value can never be persisted in the first
	 * place via writers that route through sanitize_meta().
	 *
	 * @return void
	 */
	public function test_sanitize_callback_coerces_array_write_to_empty_string() {
		// Activate the subscriptions module so register_block() actually registers
		// the meta (it returns early when the module is inactive).
		Jetpack_Options::update_option( 'active_modules', array( 'subscriptions' ) );
		register_subscription_block();

		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, array( '' ) );

		$this->assertSame(
			'',
			get_post_meta( $post_id, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, true )
		);
	}

	/**
	 * The same write-side defense must leave a legitimate string write untouched.
	 *
	 * @return void
	 */
	public function test_sanitize_callback_preserves_valid_string_write() {
		Jetpack_Options::update_option( 'active_modules', array( 'subscriptions' ) );
		register_subscription_block();

		$post_id = self::factory()->post->create();
		update_post_meta(
			$post_id,
			META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
			Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_SUBSCRIBERS
		);

		$this->assertSame(
			Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_SUBSCRIBERS,
			get_post_meta( $post_id, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, true )
		);
	}
}
