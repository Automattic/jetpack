<?php
/**
 * Media_Library tests.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use RuntimeException;

/**
 * Media_Library tests.
 *
 * @covers \Automattic\Jetpack\Admin_UI\Media_Library
 */
#[CoversClass( Media_Library::class )]
class Media_Library_Test extends TestCase {

	/**
	 * Start each test with nothing printed yet.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['wp_scripts'] = null;
		$GLOBALS['wp_styles']  = null;
	}

	/**
	 * Remove what the tests hooked.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		remove_all_actions( 'print_media_templates' );
		remove_all_filters( 'wp_doing_ajax' );
		remove_all_filters( 'wp_die_ajax_handler' );
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * The scripts come first, so a template callback's inline script finds wp.media, even when a plugin already ran wp_enqueue_media().
	 *
	 * @return void
	 */
	public function test_get_html_prints_the_scripts_before_the_templates() {
		add_action(
			'print_media_templates',
			static function () {
				echo '<script id="media-library-test-after-templates">wp.media.view;</script>';
			}
		);
		wp_enqueue_media();

		$html = Media_Library::get_html();

		$scripts   = strpos( $html, 'id="media-views-js"' );
		$templates = strpos( $html, 'id="tmpl-media-modal"' );
		$this->assertNotFalse( $scripts );
		$this->assertNotFalse( $templates );
		$this->assertGreaterThan( $scripts, $templates );
		$this->assertGreaterThan( $templates, strpos( $html, 'id="media-library-test-after-templates"' ) );
	}

	/**
	 * Handles the page already has, which it may have loaded concatenated with no id, are left out.
	 *
	 * @return void
	 */
	public function test_get_html_leaves_out_what_the_page_has() {
		$html = Media_Library::get_html( array( 'jquery-core', 'jquery-migrate' ), array( 'buttons' ) );

		$this->assertStringContainsString( 'id="media-views-js"', $html );
		$this->assertStringNotContainsString( 'id="jquery-core-js"', $html );
		$this->assertStringNotContainsString( 'id="buttons-css"', $html );
	}

	/**
	 * Output from another plugin's wp_enqueue_media callback, such as a notice, is not sent ahead of the JSON.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @return void
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_html_leaves_out_output_from_wp_enqueue_media_callbacks() {
		add_action(
			'wp_enqueue_media',
			static function () {
				echo 'Notice: something went wrong';
			}
		);

		ob_start();
		Media_Library::get_html();
		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * Data provider for test_ajax_answers_only_users_who_can_upload_files.
	 *
	 * @return array[] Role, whether the response carries the library.
	 */
	public static function provide_roles() {
		return array(
			'administrator' => array( 'administrator', true ),
			'subscriber'    => array( 'subscriber', false ),
		);
	}

	/**
	 * The registered action answers with the library, but only users who can upload files get it.
	 *
	 * @dataProvider provide_roles
	 *
	 * @param string $role     User role.
	 * @param bool   $expected Whether the response carries the library.
	 * @return void
	 */
	#[DataProvider( 'provide_roles' )]
	public function test_ajax_answers_only_users_who_can_upload_files( $role, $expected ) {
		Media_Library::init();
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'media-library-' . $role . '-' . wp_rand(),
					'user_pass'  => wp_generate_password(),
					'role'       => $role,
				)
			)
		);
		add_filter( 'wp_doing_ajax', '__return_true' );
		add_filter(
			'wp_die_ajax_handler',
			static function () {
				// Stands in for wp_die(), which never returns.
				return /** @return never */ static function () {
					throw new RuntimeException( 'wp_die' );
				};
			}
		);

		ob_start();
		try {
			do_action( 'wp_ajax_jetpack_media_library' );
		} catch ( RuntimeException $e ) {
			// wp_send_json() ends the request.
			unset( $e );
		}
		$response = json_decode( (string) ob_get_clean(), true );

		$this->assertIsArray( $response );
		$this->assertSame( $expected, $response['success'] );
		$this->assertSame( $expected, str_contains( $response['data']['html'] ?? '', 'id="media-views-js"' ) );
	}
}
