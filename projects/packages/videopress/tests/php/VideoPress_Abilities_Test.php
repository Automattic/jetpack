<?php
/**
 * Tests for VideoPress abilities.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\VideoPress\Abilities\VideoPress_Abilities;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests the settings ability contract and access control.
 */
class VideoPress_Abilities_Test extends BaseTestCase {
	/**
	 * Restore request state.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_action( 'wp_abilities_api_categories_init', array( VideoPress_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( VideoPress_Abilities::class, 'register_abilities' ) );
		delete_option( 'videopress_share_menu_disabled' );
		delete_option( 'videopress_abilities_enabled' );
		parent::tear_down();
	}

	/**
	 * Direct invocation must not bypass the ability permission callback.
	 *
	 * @dataProvider unauthorized_roles
	 * @param string|null $role User role, or null for anonymous.
	 */
	#[DataProvider( 'unauthorized_roles' )]
	public function test_direct_read_rejects_unauthorized_users( $role ) {
		if ( $role ) {
			$id = wp_insert_user(
				array(
					'user_login' => 'ability_user',
					'user_pass'  => 'password',
					'role'       => $role,
				)
			);
			wp_set_current_user( $id );
		} else {
			wp_set_current_user( 0 );
		}

		$this->assertFalse( VideoPress_Abilities::can_manage_settings() );
		$result = VideoPress_Abilities::get_settings();
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	/**
	 * Users who cannot manage site settings.
	 *
	 * @return array
	 */
	public static function unauthorized_roles() {
		return array(
			'anonymous'  => array( null ),
			'subscriber' => array( 'subscriber' ),
			'author'     => array( 'author' ),
			'editor'     => array( 'editor' ),
		);
	}

	/**
	 * Settings remain readable without a connection and keep the declared schema.
	 */
	public function test_administrator_reads_effective_settings_without_connection() {
		$id = wp_insert_user(
			array(
				'user_login' => 'ability_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $id );
		update_option( 'videopress_share_menu_disabled', '1' );

		$result = VideoPress_Abilities::get_settings();
		$this->assertSame( Data::get_videopress_settings(), $result );
		$this->assertTrue( $result['videopress_share_menu_disabled'] );
		$spec = VideoPress_Abilities::get_abilities()['videopress/get-settings'];
		$this->assertTrue( rest_validate_value_from_schema( $result, $spec['output_schema'] ) );
		$this->assertInstanceOf( \WP_Error::class, rest_validate_value_from_schema( array( 'site_id' => 42 ), $spec['input_schema'] ) );
	}

	/**
	 * Loading the registrar must not opt other Jetpack features into registration.
	 */
	public function test_shared_registration_gate_remains_disabled_by_default() {
		update_option( 'videopress_abilities_enabled', true );
		VideoPress_Abilities::init();
		$this->assertFalse( has_action( 'wp_abilities_api_init', array( VideoPress_Abilities::class, 'register_abilities' ) ) );
		$this->assertFalse( apply_filters( 'jetpack_wp_abilities_enabled', false ) );
	}

	/**
	 * A shared rollout must not expose VideoPress on sites outside the pilot.
	 */
	public function test_shared_gate_alone_does_not_register_videopress() {
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		VideoPress_Abilities::init();
		$this->assertFalse( has_action( 'wp_abilities_api_init', array( VideoPress_Abilities::class, 'register_abilities' ) ) );
	}

	/**
	 * Core discovery and execution must use the registered settings contract.
	 */
	public function test_registered_ability_executes_with_core_validation() {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Requires the WordPress Abilities API.' );
		}
		$id = wp_insert_user(
			array(
				'user_login' => 'registered_ability_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $id );
		update_option( 'videopress_abilities_enabled', true );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		VideoPress_Abilities::init();
		try {
			$ability = wp_get_ability( 'videopress/get-settings' );
			$this->assertNotNull( $ability );
			$this->assertSame( Data::get_videopress_settings(), $ability->execute( array() ) );
			$this->assertInstanceOf( \WP_Error::class, $ability->execute( array( 'site_id' => 42 ) ) );
			wp_set_current_user( 0 );
			$this->assertInstanceOf( \WP_Error::class, $ability->execute( array() ) );
		} finally {
			wp_unregister_ability( 'videopress/get-settings' );
			wp_unregister_ability_category( 'videopress' );
		}
	}
}
