<?php
/**
 * Once-per-user editor welcome guides test file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/editor-welcome-guides/editor-welcome-guides.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Tests for the once-per-user editor welcome guides.
 *
 * @covers ::wpcom_editor_welcome_guides_filter_preferences
 * @covers ::wpcom_editor_welcome_guides_record_preferences
 */
#[CoversFunction( 'wpcom_editor_welcome_guides_filter_preferences' )]
#[CoversFunction( 'wpcom_editor_welcome_guides_record_preferences' )]
class Editor_Welcome_Guides_Test extends \WorDBless\BaseTestCase {

	/**
	 * Test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * What the `wpcom_editor_welcome_guides_dismissed` filter returns in the test.
	 *
	 * @var array
	 */
	private $dismissed = array();

	/**
	 * Arguments of every `wpcom_editor_welcome_guides_dismiss` call in the test.
	 *
	 * @var array
	 */
	private $recorded = array();

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->dismissed = array();
		$this->recorded  = array();

		$GLOBALS['wpcom_site_stickers_test_value'] = array( 'editor-welcome-guides-per-user' );

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'welcome_guides_user',
				'user_pass'  => 'password',
				'user_email' => 'welcome_guides_user@example.com',
			)
		);

		add_filter( 'wpcom_editor_welcome_guides_dismissed', array( $this, 'provide_dismissed' ) );
		add_action( 'wpcom_editor_welcome_guides_dismiss', array( $this, 'record_dismiss' ), 10, 2 );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		unset( $GLOBALS['wpcom_site_stickers_test_value'] );
		remove_filter( 'wpcom_editor_welcome_guides_dismissed', array( $this, 'provide_dismissed' ) );
		remove_action( 'wpcom_editor_welcome_guides_dismiss', array( $this, 'record_dismiss' ), 10 );
		wp_delete_user( $this->user_id );

		parent::tear_down();
	}

	/**
	 * Test provider for the dismissed guides.
	 *
	 * @return array
	 */
	public function provide_dismissed() {
		return $this->dismissed;
	}

	/**
	 * Test recorder for dismissed guides.
	 *
	 * @param int   $user_id   User ID.
	 * @param array $dismissed Map of scope to guide keys.
	 * @return void
	 */
	public function record_dismiss( $user_id, $dismissed ) {
		$this->recorded[] = array( $user_id, $dismissed );
	}

	/**
	 * Writes the preferences meta the way the editor does, without the write hook noticing.
	 *
	 * @param array $preferences The preferences to store.
	 * @return void
	 */
	private function store_preferences( array $preferences ) {
		remove_action( 'wpcom_editor_welcome_guides_dismiss', array( $this, 'record_dismiss' ), 10 );
		update_user_meta( $this->user_id, wpcom_editor_welcome_guides_meta_key(), $preferences );
		add_action( 'wpcom_editor_welcome_guides_dismiss', array( $this, 'record_dismiss' ), 10, 2 );
	}

	/**
	 * Reads the preferences meta the way core's `get_metadata_raw()` does: the filter's
	 * value wins, otherwise the stored one. WorDBless's own `get_user_metadata` callback
	 * discards earlier filter results, so `get_user_meta()` cannot observe the feature here.
	 *
	 * @return mixed
	 */
	private function read_preferences() {
		$meta_key = wpcom_editor_welcome_guides_meta_key();
		$check    = wpcom_editor_welcome_guides_filter_preferences( null, $this->user_id, $meta_key );

		return null === $check ? get_user_meta( $this->user_id, $meta_key, true ) : $check[0];
	}

	/**
	 * The hooks are registered.
	 *
	 * @return void
	 */
	public function test_hooks_are_registered() {
		$this->assertSame( 1, has_filter( 'get_user_metadata', 'wpcom_editor_welcome_guides_filter_preferences' ) );
		$this->assertSame( 10, has_action( 'added_user_meta', 'wpcom_editor_welcome_guides_record_preferences' ) );
		$this->assertSame( 10, has_action( 'updated_user_meta', 'wpcom_editor_welcome_guides_record_preferences' ) );
	}

	/**
	 * Reading the preferences turns the dismissed guides off and keeps the rest.
	 *
	 * @return void
	 */
	public function test_read_turns_dismissed_guides_off() {
		$this->store_preferences( array( 'core' => array( 'fixedToolbar' => true ) ) );
		$this->dismissed = array(
			'core/edit-post' => array( 'welcomeGuide' ),
			'core/edit-site' => array( 'welcomeGuide', 'welcomeGuideStyles' ),
		);

		$preferences = $this->read_preferences();

		$this->assertFalse( $preferences['core/edit-post']['welcomeGuide'] );
		$this->assertFalse( $preferences['core/edit-site']['welcomeGuide'] );
		$this->assertFalse( $preferences['core/edit-site']['welcomeGuideStyles'] );
		$this->assertTrue( $preferences['core']['fixedToolbar'] );
		$this->assertNotFalse( strtotime( $preferences['_modified'] ) );
	}

	/**
	 * Reading works when nothing is stored yet for the site.
	 *
	 * @return void
	 */
	public function test_read_works_without_stored_preferences() {
		$this->dismissed = array( 'core/edit-widgets' => array( 'welcomeGuide' ) );

		$preferences = $this->read_preferences();

		$this->assertFalse( $preferences['core/edit-widgets']['welcomeGuide'] );
		$this->assertNotFalse( strtotime( $preferences['_modified'] ) );
	}

	/**
	 * Reading leaves the preferences alone when nothing is dismissed or the site is not enabled.
	 *
	 * @return void
	 */
	public function test_read_is_unchanged_when_nothing_applies() {
		$stored = array( 'core/edit-post' => array( 'welcomeGuide' => true ) );
		$this->store_preferences( $stored );

		$this->dismissed = array();
		$this->assertSame( $stored, $this->read_preferences() );

		$this->dismissed = array( 'core/edit-post' => array( 'welcomeGuide' ) );
		unset( $GLOBALS['wpcom_site_stickers_test_value'] );
		$this->assertSame( $stored, $this->read_preferences() );
	}

	/**
	 * Saving the preferences reports the guides that are off, on the first save and on updates.
	 *
	 * @return void
	 */
	public function test_write_reports_guides_turned_off() {
		update_user_meta(
			$this->user_id,
			wpcom_editor_welcome_guides_meta_key(),
			array(
				'core/edit-site' => array(
					'welcomeGuide'       => false,
					'welcomeGuideStyles' => true,
					'fixedToolbar'       => false,
				),
				'core'           => array( 'welcomeGuide' => false ),
			)
		);
		update_user_meta(
			$this->user_id,
			wpcom_editor_welcome_guides_meta_key(),
			array( 'core/edit-post' => array( 'welcomeGuide' => false ) )
		);

		$this->assertSame(
			array(
				array( $this->user_id, array( 'core/edit-site' => array( 'welcomeGuide' ) ) ),
				array( $this->user_id, array( 'core/edit-post' => array( 'welcomeGuide' ) ) ),
			),
			$this->recorded
		);
	}

	/**
	 * Saving reports nothing when no guide is off, or when the site is not enabled.
	 *
	 * @return void
	 */
	public function test_write_reports_nothing_when_nothing_applies() {
		update_user_meta( $this->user_id, wpcom_editor_welcome_guides_meta_key(), array( 'core/edit-post' => array( 'welcomeGuide' => true ) ) );
		update_user_meta( $this->user_id, 'nickname', array( 'core/edit-post' => array( 'welcomeGuide' => false ) ) );

		unset( $GLOBALS['wpcom_site_stickers_test_value'] );
		update_user_meta( $this->user_id, wpcom_editor_welcome_guides_meta_key(), array( 'core/edit-post' => array( 'welcomeGuide' => false ) ) );

		$this->assertSame( array(), $this->recorded );
	}
}
