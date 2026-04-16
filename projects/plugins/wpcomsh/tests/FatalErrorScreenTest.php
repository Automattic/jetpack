<?php
/**
 * Fatal Error Screen Test file.
 *
 * @package wpcomsh
 */

/**
 * Class FatalErrorScreenTest.
 */
class FatalErrorScreenTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Load the standalone fatal-error template helpers.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		require_once dirname( __DIR__ ) . '/php-error.php';
		require_once dirname( __DIR__ ) . '/php-error-dropin.php';
	}

	/**
	 * Generic requests should show the default critical-error copy.
	 */
	public function test_screen_data_defaults_to_generic_message() {
		$data = wpcomsh_get_php_error_screen_data( false, false, false, false );

		$this->assertSame( 'There has been a critical error on this website.', $data['heading'] );
		$this->assertSame( 'There has been a critical error on this website.', $data['body'] );
		$this->assertFalse( $data['show_support_forums'] );
	}

	/**
	 * Single-site protected endpoints should link to the support forums.
	 */
	public function test_screen_data_shows_support_forums_for_single_site_protected_endpoint() {
		$data = wpcomsh_get_php_error_screen_data( false, true, false, false );

		$this->assertSame(
			'There has been a critical error on this website. Please check your site admin email inbox for instructions.',
			$data['body']
		);
		$this->assertTrue( $data['show_support_forums'] );
	}

	/**
	 * Multisite protected endpoints keep the administrator-contact branch.
	 */
	public function test_screen_data_keeps_multisite_branch_without_support_forums() {
		$data = wpcomsh_get_php_error_screen_data( false, true, true, false );

		$this->assertStringContainsString( 'your site administrator', $data['body'] );
		$this->assertFalse( $data['show_support_forums'] );
	}

	/**
	 * The rendered template should always include the WordPress.com help link.
	 */
	public function test_rendered_template_contains_wpcom_troubleshooting_link() {
		ob_start();
		wpcomsh_render_php_error_template(
			array(
				'type'    => E_ERROR,
				'message' => 'Boom',
				'file'    => __FILE__,
				'line'    => __LINE__,
			),
			false
		);
		$html = ob_get_clean();

		$this->assertStringContainsString( 'https://wordpress.com/support/plugins/troubleshooting/', $html );
		$this->assertStringContainsString( 'WordPress.com', $html );
	}

	/**
	 * Missing targets should be populated with the wpcom-managed drop-in.
	 */
	public function test_dropin_is_installed_when_missing() {
		$source_dir = sys_get_temp_dir() . '/wpcomsh-fatal-error-source-' . wp_rand();
		$target_dir = sys_get_temp_dir() . '/wpcomsh-fatal-error-target-' . wp_rand();
		$this->assertTrue( wp_mkdir_p( $source_dir ) );
		$this->assertTrue( wp_mkdir_p( $target_dir ) );

		$source = $source_dir . '/php-error.php';
		$target = $target_dir . '/php-error.php';

		file_put_contents( $source, "<?php\n/* " . WPCOMSH_PHP_ERROR_DROPIN_MARKER . " */\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		wpcomsh_maybe_install_php_error_dropin( $source, $target );

		$this->assertFileExists( $target );
		$this->assertSame(
			file_get_contents( $source ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $target ) // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		);

		unlink( $source ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $target ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		rmdir( $source_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
		rmdir( $target_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
	}

	/**
	 * Third-party php-error.php files should not be overwritten by wpcomsh.
	 */
	public function test_dropin_does_not_overwrite_unmanaged_file() {
		$source_dir = sys_get_temp_dir() . '/wpcomsh-fatal-error-source-' . wp_rand();
		$target_dir = sys_get_temp_dir() . '/wpcomsh-fatal-error-target-' . wp_rand();
		$this->assertTrue( wp_mkdir_p( $source_dir ) );
		$this->assertTrue( wp_mkdir_p( $target_dir ) );

		$source = $source_dir . '/php-error.php';
		$target = $target_dir . '/php-error.php';

		file_put_contents( $source, "<?php\n/* " . WPCOMSH_PHP_ERROR_DROPIN_MARKER . " */\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $target, "<?php\n/* Someone else owns this file. */\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents

		wpcomsh_maybe_install_php_error_dropin( $source, $target );

		$this->assertSame(
			"<?php\n/* Someone else owns this file. */\n",
			file_get_contents( $target ) // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		);

		unlink( $source ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $target ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		rmdir( $source_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
		rmdir( $target_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
	}
}
