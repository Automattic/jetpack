<?php
/**
 * Tests for the Protect dashboard's threat formatter.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Dashboard_Threats
 */
#[CoversClass( Dashboard_Threats::class )]
class Dashboard_Threats_Test extends BaseTestCase {

	/**
	 * Threats, and the part of the formatted threat each one decides.
	 *
	 * @return array[]
	 */
	public static function provider_format() {
		$fixable = (object) array( 'fixer' => 'update' );

		return array(
			'plugin type is pluralized'      => array(
				array( 'extension' => (object) array( 'type' => 'plugin' ) ),
				array( 'extension', 'type' ),
				'plugins',
			),
			'theme type is pluralized'       => array(
				array( 'extension' => (object) array( 'type' => 'theme' ) ),
				array( 'extension', 'type' ),
				'themes',
			),
			'core type is kept'              => array(
				array( 'extension' => (object) array( 'type' => 'core' ) ),
				array( 'extension', 'type' ),
				'core',
			),
			'no extension is null'           => array(
				array(),
				array( 'extension' ),
				null,
			),
			'empty fixable is false'         => array(
				array( 'fixable' => array() ),
				array( 'fixable' ),
				false,
			),
			'populated fixable is unchanged' => array(
				array( 'fixable' => $fixable ),
				array( 'fixable' ),
				$fixable,
			),
			'context drops the marks'        => array(
				array(
					'context' => (object) array(
						'4'     => 'echo 1;',
						'marks' => (object) array(),
					),
				),
				array( 'context' ),
				array(
					array(
						'line' => 4,
						'code' => 'echo 1;',
					),
				),
			),
			'vulnerability fields are kept'  => array(
				array(
					'vulnerabilities' => array(
						(object) array(
							'title'    => 'XSS',
							'fixed_in' => '1.2',
							'source'   => 'https://example.com/v',
						),
					),
				),
				array( 'vulnerabilities', 0 ),
				array(
					'id'     => null,
					'title'  => 'XSS',
					'source' => 'https://example.com/v',
				),
			),
		);
	}

	/**
	 * Icons in the plugin update check, and the one a threat should show.
	 *
	 * @return array[]
	 */
	public static function provider_icon() {
		return array(
			'svg is preferred'      => array(
				array(
					'1x'  => 'https://ps.w.org/a/icon-128.png',
					'svg' => 'https://ps.w.org/a/icon.svg',
				),
				'https://ps.w.org/a/icon.svg',
			),
			'2x is preferred to 1x' => array(
				array(
					'1x' => 'https://ps.w.org/a/icon-128.png',
					'2x' => 'https://ps.w.org/a/icon-256.png',
				),
				'https://ps.w.org/a/icon-256.png',
			),
			'no icons give null'    => array( array(), null ),
		);
	}

	/**
	 * Test that a plugin threat carries its WordPress.org icon.
	 *
	 * @dataProvider provider_icon
	 * @param array       $icons    The plugin's icons in the update check.
	 * @param string|null $expected The expected icon.
	 */
	#[DataProvider( 'provider_icon' )]
	public function test_plugin_icon( $icons, $expected ) {
		set_site_transient(
			'update_plugins',
			(object) array(
				'response'  => array(),
				'no_update' => array(
					'other/other.php' => (object) array(
						'slug'  => 'other',
						'icons' => array( '1x' => 'https://ps.w.org/other/icon.png' ),
					),
					'a/a.php'         => (object) array(
						'slug'  => 'a',
						'icons' => $icons,
					),
				),
			)
		);

		$threat = Dashboard_Threats::format(
			(object) array(
				'extension' => (object) array(
					'slug' => 'a',
					'type' => 'plugin',
				),
			)
		);

		$this->assertSame( $expected, $threat['extension']['icon'] );
	}

	/**
	 * Whether the plugin is active, and the state a threat in it reports.
	 *
	 * @return array[]
	 */
	public static function provider_plugin_state() {
		return array(
			'active plugin'   => array( true, 'active' ),
			'inactive plugin' => array( false, 'inactive' ),
		);
	}

	/**
	 * Test that a plugin threat says whether the plugin is active.
	 *
	 * @dataProvider provider_plugin_state
	 * @param bool   $is_active Whether the plugin is active.
	 * @param string $expected  The expected state.
	 */
	#[DataProvider( 'provider_plugin_state' )]
	public function test_plugin_state( $is_active, $expected ) {
		$file = WP_PLUGIN_DIR . '/protect-state-test.php';
		wp_mkdir_p( WP_PLUGIN_DIR );
		file_put_contents( $file, "<?php\n/**\n * Plugin Name: Protect State Test\n */\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		wp_clean_plugins_cache( false );
		update_option( 'active_plugins', $is_active ? array( 'protect-state-test.php' ) : array() );

		$threat = Dashboard_Threats::format(
			(object) array(
				'extension' => (object) array(
					'slug' => 'protect-state-test',
					'type' => 'plugin',
				),
			)
		);
		wp_delete_file( $file );

		$this->assertSame( $expected, $threat['extension']['state'] );
	}

	/**
	 * A threat's status, and whether it offers to delete the inactive plugin it's in.
	 *
	 * @return array[]
	 */
	public static function provider_delete_action() {
		return array(
			'current threat offers delete' => array( 'current', true ),
			'ignored threat offers delete' => array( 'ignored', true ),
			'fixed threat does not'        => array( 'fixed', false ),
		);
	}

	/**
	 * Test that only a threat that still applies offers to delete its plugin.
	 *
	 * @dataProvider provider_delete_action
	 * @param string $status   The threat's status.
	 * @param bool   $expected Whether Delete is offered.
	 */
	#[DataProvider( 'provider_delete_action' )]
	public function test_delete_action( $status, $expected ) {
		$file = WP_PLUGIN_DIR . '/protect-state-test.php';
		wp_mkdir_p( WP_PLUGIN_DIR );
		file_put_contents( $file, "<?php\n/**\n * Plugin Name: Protect State Test\n */\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		wp_clean_plugins_cache( false );
		update_option( 'active_plugins', array() );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'admin',
					'user_pass'  => 'pass',
					'role'       => 'administrator',
				)
			)
		);

		$threat = Dashboard_Threats::format(
			(object) array(
				'status'    => $status,
				'extension' => (object) array(
					'slug' => 'protect-state-test',
					'type' => 'plugin',
				),
			)
		);
		wp_delete_file( $file );
		wp_set_current_user( 0 );

		$this->assertSame( $expected, ! empty( $threat['extension']['actions']['delete'] ) );
	}

	/**
	 * Test format().
	 *
	 * @dataProvider provider_format
	 * @param array    $threat   The threat's properties.
	 * @param string[] $path     Keys leading to the value under test.
	 * @param mixed    $expected The expected value.
	 */
	#[DataProvider( 'provider_format' )]
	public function test_format( $threat, $path, $expected ) {
		$actual = Dashboard_Threats::format( (object) $threat );
		foreach ( $path as $key ) {
			$this->assertArrayHasKey( $key, $actual );
			$actual = $actual[ $key ];
		}

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Inputs for format_all(), and the ids of the threats it should return.
	 *
	 * @return array[]
	 */
	public static function provider_format_all() {
		return array(
			'a Traversable is walked'         => array(
				new \ArrayIterator( array( (object) array( 'id' => 1 ), (object) array( 'id' => 2 ) ) ),
				array( 1, 2 ),
			),
			'a non-iterable gives no threats' => array( null, array() ),
		);
	}

	/**
	 * Test format_all().
	 *
	 * @dataProvider provider_format_all
	 * @param mixed $threats  The threats to format.
	 * @param int[] $expected The ids of the formatted threats.
	 */
	#[DataProvider( 'provider_format_all' )]
	public function test_format_all( $threats, $expected ) {
		$this->assertSame( $expected, array_column( Dashboard_Threats::format_all( $threats ), 'id' ) );
	}
}
