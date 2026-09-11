<?php
/**
 * Tests for the repair of Jetpack AI feature options a General settings save emptied.
 *
 * Until the options moved to their own settings group, submitting Settings > General wrote
 * null over every one of them, and null stores as an empty string, which reads as the
 * feature being off. {@see Jetpack::repair_ai_empty_options()} deletes those rows
 * once so the registered on-by-default value applies again.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Class Jetpack_AI_Empty_Options_Repair_Test
 *
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_AI_Empty_Options_Repair_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Every option name the repair is responsible for.
	 *
	 * @var array
	 */
	private const REPAIRED_OPTIONS = array(
		'jetpack_ai_writing_assistant_enabled',
		'jetpack_ai_image_editor_enabled',
		'jetpack_ai_feature_clip_enabled',
		'jetpack_ai_seo_enabled',
	);

	/**
	 * Reset the platform, the repair guard, and every option these tests touch.
	 */
	public function tear_down() {
		delete_option( Jetpack::AI_EMPTY_OPTIONS_REPAIRED_OPTION );
		delete_option( 'jetpack_ai_enabled' );
		delete_option( 'jetpack_search_ai_answers_enabled' );
		foreach ( self::REPAIRED_OPTIONS as $option ) {
			delete_option( $option );
		}
		Constants::clear_single_constant( 'IS_WPCOM' );

		parent::tear_down();
	}

	/**
	 * Leave an option the way a Settings > General save did: the row holding an
	 * empty string. The flush stands in for the later request that reads it.
	 *
	 * @param string $option Option name.
	 * @return void
	 */
	private function empty_option_like_a_general_save( $option ) {
		update_option( $option, null );
		wp_cache_flush();
	}

	/**
	 * With the row gone the registered default applies, so the feature is on again.
	 */
	public function test_repair_deletes_the_emptied_feature_rows() {
		foreach ( self::REPAIRED_OPTIONS as $option ) {
			$this->empty_option_like_a_general_save( $option );
		}

		Jetpack::repair_ai_empty_options();

		foreach ( self::REPAIRED_OPTIONS as $option ) {
			$this->assertFalse( get_option( $option, false ), "$option should have no stored row after the repair." );
		}
	}

	/**
	 * The repair runs once, so a toggle switched off afterwards stays off.
	 */
	public function test_repair_runs_only_once() {
		Jetpack::repair_ai_empty_options();

		$this->empty_option_like_a_general_save( 'jetpack_ai_image_editor_enabled' );
		Jetpack::repair_ai_empty_options();

		$this->assertSame( '', get_option( 'jetpack_ai_image_editor_enabled' ) );
	}

	/**
	 * Off Simple the `ai` module is the master, and the option carries the legacy
	 * pre-module opt-out reconcile_ai_master_optout() reads.
	 */
	public function test_repair_leaves_the_master_option_alone() {
		$this->empty_option_like_a_general_save( 'jetpack_ai_enabled' );

		Jetpack::repair_ai_empty_options();

		$this->assertSame( '', get_option( 'jetpack_ai_enabled' ) );
	}

	/**
	 * Search owns its option, it was never in the general group, and it is opt-in.
	 */
	public function test_repair_leaves_the_search_option_alone() {
		$this->empty_option_like_a_general_save( 'jetpack_search_ai_answers_enabled' );

		Jetpack::repair_ai_empty_options();

		$this->assertSame( '', get_option( 'jetpack_search_ai_answers_enabled' ) );
	}

	/**
	 * Simple is repaired by jetpack-mu-wpcom, which runs before these options are read.
	 */
	public function test_repair_is_a_no_op_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->empty_option_like_a_general_save( 'jetpack_ai_image_editor_enabled' );

		Jetpack::repair_ai_empty_options();

		$this->assertSame( '', get_option( 'jetpack_ai_image_editor_enabled' ) );
		$this->assertFalse( get_option( Jetpack::AI_EMPTY_OPTIONS_REPAIRED_OPTION, false ) );
	}

	/**
	 * The repair is wired onto the upgrade path beside the master opt-out migration.
	 */
	public function test_repair_is_registered_on_the_upgrade_path() {
		Jetpack::register_upgrade_init_hooks();

		$this->assertNotFalse( has_action( 'init', array( 'Jetpack', 'repair_ai_empty_options' ) ) );
	}
}
