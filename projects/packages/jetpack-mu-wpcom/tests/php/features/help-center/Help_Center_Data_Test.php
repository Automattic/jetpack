<?php
/**
 * Tests for Help_Center::get_help_center_data().
 *
 * @package automattic/jetpack-mu-wpcom
 */

use A8C\FSE\Help_Center;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/help-center/class-help-center.php';

/**
 * Class Help_Center_Data_Test
 */
class Help_Center_Data_Test extends \WorDBless\BaseTestCase {

	/**
	 * @var int
	 */
	private $user_id;

	/**
	 * @var Help_Center
	 */
	private $help_center;

	public function set_up() {
		parent::set_up();

		$this->user_id = wp_insert_user(
			array(
				'user_login'   => 'help_center_user',
				'user_pass'    => 'password',
				'user_email'   => 'help_center_user@example.com',
				'display_name' => 'Help Center User',
				'role'         => 'administrator',
			)
		);
		wp_set_current_user( $this->user_id );

		$this->help_center = new Help_Center();
	}

	public function tear_down() {
		// The Help_Center constructor registers hooks against $this. Without this,
		// each test would leak duplicate callbacks into later tests in the session.
		self::remove_help_center_hooks( $this->help_center );

		// test_get_instance_returns_singleton_after_init may have populated the
		// class-static singleton via init(); reset it so later tests start clean.
		$singleton = Help_Center::get_instance();
		if ( $singleton !== null ) {
			self::remove_help_center_hooks( $singleton );
			( new \ReflectionProperty( Help_Center::class, 'instance' ) )->setValue( null, null );
		}

		wp_set_current_user( 0 );
		parent::tear_down();
	}

	private static function remove_help_center_hooks( Help_Center $instance ): void {
		remove_action( 'rest_api_init', array( $instance, 'register_rest_api' ) );
		remove_filter( 'calypso_preferences_update', array( $instance, 'calypso_preferences_update' ) );
		remove_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_wp_admin_scripts' ), 100 );
		remove_action( 'wp_enqueue_scripts', array( $instance, 'enqueue_wp_admin_scripts' ), 100 );
		remove_action( 'next_admin_init', array( $instance, 'enqueue_wp_admin_scripts' ), 1000 );
		remove_filter( 'in_admin_header', array( $instance, 'jetpack_remove_core_help_tab' ) );
	}

	public function test_payload_has_stable_top_level_keys() {
		// Adding a field is a deliberate change — frontend consumers depend on this shape.
		$this->assertSame(
			array(
				'isProxied',
				'isSU',
				'isSSP',
				'sectionName',
				'isCommerceGarden',
				'currentUser',
				'site',
				'locale',
			),
			array_keys( $this->help_center->get_help_center_data( 'wp-admin' ) )
		);
	}

	public function test_current_user_block_reflects_logged_in_user() {
		$current_user = $this->help_center->get_help_center_data( 'wp-admin' )['currentUser'];

		$this->assertSame( $this->user_id, $current_user['ID'] );
		$this->assertSame( 'help_center_user', $current_user['username'] );
		$this->assertSame( 'Help Center User', $current_user['display_name'] );
		$this->assertSame( 'help_center_user@example.com', $current_user['email'] );
	}

	/**
	 * @dataProvider variant_section_name_provider
	 */
	#[DataProvider( 'variant_section_name_provider' )]
	public function test_variant_drives_section_name_default( string $variant, string $expected ) {
		$this->assertSame(
			$expected,
			$this->help_center->get_help_center_data( $variant )['sectionName']
		);
	}

	public static function variant_section_name_provider(): array {
		return array(
			'wp-admin'   => array( 'wp-admin', 'wp-admin' ),
			'gutenberg'  => array( 'gutenberg', 'gutenberg' ),
			'customizer' => array( 'customizer', 'customizer' ),
			'ciab-admin' => array( 'ciab-admin', 'ciab-admin' ),
			'logged-out' => array( 'logged-out', 'logged-out' ),
		);
	}

	public function test_default_variant_is_wp_admin() {
		$this->assertSame( 'wp-admin', $this->help_center->get_help_center_data()['sectionName'] );
	}

	public function test_overrides_shallow_merge_top_level_and_replace_subarrays() {
		$data = $this->help_center->get_help_center_data(
			'wp-admin',
			array(
				'sectionName' => 'landpack',
				'currentUser' => array( 'ID' => 0 ),
			)
		);

		$this->assertSame( 'landpack', $data['sectionName'], 'top-level override replaces' );
		$this->assertSame( array( 'ID' => 0 ), $data['currentUser'], 'sub-array override replaces wholesale (no deep merge)' );
		$this->assertSame( 'en', $data['locale'], 'untouched fields keep computed values' );
	}

	public function test_get_instance_returns_singleton_after_init() {
		Help_Center::init();
		$this->assertInstanceOf( Help_Center::class, Help_Center::get_instance() );
	}
}
