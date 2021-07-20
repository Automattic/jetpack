<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Tests the Identity_Crisis package.
 *
 * @package automattic/jetpack-identity-crisis
 */

namespace Automattic\Jetpack;

use Jetpack_Options;
use WorDBless\BaseTestCase;

/**
 * Test Identity_Crisis class
 */
class Test_Identity_Crisis extends BaseTestCase {
	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		// Reset IDC singleton.
		$idc        = Identity_Crisis::init();
		$reflection = new \ReflectionClass( $idc );
		$instance   = $reflection->getProperty( 'instance' );

		$instance->setAccessible( true );
		$instance->setValue( null, null );
		$instance->setAccessible( false );
	}

	/**
	 * Test that clear_all_idc_options resets Options.
	 */
	public function test_clear_all_idc_options_clears_expected() {
		$options = array(
			'sync_error_idc',
			'safe_mode_confirmed',
			'migrate_for_idc',
		);

		foreach ( $options as $option ) {
			Jetpack_Options::update_option( $option, true );
		}

		Identity_Crisis::clear_all_idc_options();

		foreach ( $options as $option ) {
			$this->assertFalse( Jetpack_Options::get_option( $option ) );
		}
	}

	/**
	 * Test jetpack_connection_disconnect_site_wpcom_filter.
	 */
	public function test_jetpack_connection_disconnect_site_wpcom_filter() {
		Identity_Crisis::init();

		// No IDC.
		$this->assertTrue(
			apply_filters( 'jetpack_connection_disconnect_site_wpcom', false ),
			'IDC should not block the site from disconnecting on WPCOM.'
		);

		// Mock IDC.
		add_filter( 'jetpack_sync_error_idc_validation', '__return_true' );

		$this->assertFalse(
			apply_filters( 'jetpack_connection_disconnect_site_wpcom', true ),
			'IDC should block the site from disconnecting on WPCOM.'
		);

		// Clean up.
		remove_filter( 'jetpack_sync_error_idc_validation', '__return_true' );
	}
}
