<?php
/**
 * Tests where the VideoPress block's "Activate VideoPress" button sends the site.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Block_Editor_Extensions activation URL tests.
 */
class Block_Editor_Extensions_Activation_Url_Test extends BaseTestCase {

	/**
	 * Script handle the payload is localized onto.
	 *
	 * @var string
	 */
	const HANDLE = 'test-videopress-activation-url';

	/**
	 * The handle Block_Editor_Extensions was configured with before this test.
	 *
	 * @var string
	 */
	private $previous_handle = '';

	/**
	 * Action counts before this test, which `my_jetpack_init` changes.
	 *
	 * @var array
	 */
	private $previous_actions = array();

	/**
	 * Registered admin pages before this test.
	 *
	 * @var array
	 */
	private $previous_pages = array();

	/**
	 * Register a stand-in script and a user who can open My Jetpack.
	 */
	public function set_up() {
		global $wp_actions, $_registered_pages;

		parent::set_up();

		$this->previous_actions = (array) $wp_actions;
		$this->previous_pages   = (array) $_registered_pages;

		$this->previous_handle                  = Block_Editor_Extensions::$script_handle;
		Block_Editor_Extensions::$script_handle = self::HANDLE;
		wp_register_script( self::HANDLE, 'https://example.org/test.js', array(), '1.0', true );

		Feature_Flags::reset();
		My_Jetpack_Initializer::register_feature_flags();
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'activation-url-admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		global $wp_actions, $_registered_pages;

		wp_deregister_script( self::HANDLE );
		Block_Editor_Extensions::$script_handle = $this->previous_handle;
		remove_all_filters( 'jetpack_feature_flag_enabled_' . My_Jetpack_Initializer::SETTINGS_CONSOLIDATION_FLAG );
		Feature_Flags::reset();
		$wp_actions        = $this->previous_actions;
		$_registered_pages = $this->previous_pages;
		( new Connection_Manager() )->reset_connection_status();

		parent::tear_down();
	}

	/**
	 * Tests that the button leaves the Settings search only once settings consolidation is on.
	 *
	 * @dataProvider provide_activation_urls
	 *
	 * @param bool   $flag     Whether the settings consolidation flag is on.
	 * @param string $expected The URL, relative to wp-admin.
	 */
	#[DataProvider( 'provide_activation_urls' )]
	public function test_activation_url_follows_the_settings_consolidation_flag( $flag, $expected ) {
		global $_registered_pages;

		do_action( 'my_jetpack_init' );
		$_registered_pages[ get_plugin_page_hookname( 'my-jetpack', 'jetpack' ) ] = true;
		add_filter( 'jetpack_feature_flag_enabled_' . My_Jetpack_Initializer::SETTINGS_CONSOLIDATION_FLAG, $flag ? '__return_true' : '__return_false' );

		Block_Editor_Extensions::enqueue_extensions();
		preg_match( '/var videoPressEditorState = (.*);/', (string) wp_scripts()->get_data( self::HANDLE, 'data' ), $matches );
		$state = (array) json_decode( $matches[1], true );

		$this->assertSame( admin_url( $expected ), $state['jetpackVideoPressSettingUrl'] );
	}

	/**
	 * Data provider for test_activation_url_follows_the_settings_consolidation_flag.
	 *
	 * @return array
	 */
	public static function provide_activation_urls() {
		return array(
			'flag off' => array( false, 'admin.php?page=jetpack#/settings?term=videopress' ),
			'flag on'  => array( true, 'admin.php?page=my-jetpack#/features?search=videopress' ),
		);
	}
}
