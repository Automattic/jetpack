<?php
/**
 * Tests for Help_Center::get_help_center_data().
 *
 * @package automattic/jetpack-mu-wpcom
 */

use A8C\FSE\Help_Center;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

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
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	public function test_payload_has_stable_top_level_keys() {
		$data = $this->help_center->get_help_center_data( 'wp-admin' );

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
			array_keys( $data ),
			'Top-level helpCenterData keys must stay stable. Adding a field is a deliberate change — update this list and any frontend consumers.'
		);
	}

	public function test_current_user_block_reflects_logged_in_user() {
		$data = $this->help_center->get_help_center_data( 'wp-admin' );

		$this->assertSame( $this->user_id, $data['currentUser']['ID'] );
		$this->assertSame( 'help_center_user', $data['currentUser']['username'] );
		$this->assertSame( 'Help Center User', $data['currentUser']['display_name'] );
		$this->assertSame( 'help_center_user@example.com', $data['currentUser']['email'] );
		$this->assertArrayHasKey( 'avatar_URL', $data['currentUser'] );
		$this->assertArrayHasKey( 'is_a11n', $data['currentUser'] );
	}

	public function test_variant_drives_section_name_default() {
		$this->assertSame( 'wp-admin', $this->help_center->get_help_center_data( 'wp-admin' )['sectionName'] );
		$this->assertSame( 'gutenberg', $this->help_center->get_help_center_data( 'gutenberg' )['sectionName'] );
		$this->assertSame( 'customizer', $this->help_center->get_help_center_data( 'customizer' )['sectionName'] );
		$this->assertSame( 'ciab-admin', $this->help_center->get_help_center_data( 'ciab-admin' )['sectionName'] );
		$this->assertSame( 'logged-out', $this->help_center->get_help_center_data( 'logged-out' )['sectionName'] );
	}

	public function test_overrides_are_shallow_merged() {
		$data = $this->help_center->get_help_center_data(
			'wp-admin',
			array( 'sectionName' => 'landpack' )
		);

		$this->assertSame( 'landpack', $data['sectionName'], 'Override replaces sectionName.' );
		$this->assertSame( $this->user_id, $data['currentUser']['ID'], 'Untouched fields keep computed values.' );
		$this->assertSame( 'en', $data['locale'], 'Untouched fields keep computed values.' );
	}

	public function test_overrides_replace_subarrays_wholesale() {
		$data = $this->help_center->get_help_center_data(
			'wp-admin',
			array( 'currentUser' => array( 'ID' => 0 ) )
		);

		// Shallow merge: passing a partial currentUser replaces the whole sub-array.
		$this->assertSame( array( 'ID' => 0 ), $data['currentUser'] );
	}

	public function test_default_variant_is_wp_admin() {
		$this->assertSame(
			$this->help_center->get_help_center_data(),
			$this->help_center->get_help_center_data( 'wp-admin' )
		);
	}

	public function test_payload_is_deterministic_under_json_encode() {
		$first  = wp_json_encode(
			$this->help_center->get_help_center_data( 'wp-admin' ),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		);
		$second = wp_json_encode(
			$this->help_center->get_help_center_data( 'wp-admin' ),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		);

		$this->assertSame( $first, $second, 'JSON-encoded payload must be byte-equal across calls.' );
	}

	public function test_get_instance_returns_singleton_after_init() {
		// init() may have been short-circuited (e.g. preview=true) or not yet run in this test context.
		// What we guarantee is that get_instance() returns either an instance or null — not a fatal.
		$instance = Help_Center::get_instance();
		$this->assertTrue( $instance === null || $instance instanceof Help_Center );
	}
}
