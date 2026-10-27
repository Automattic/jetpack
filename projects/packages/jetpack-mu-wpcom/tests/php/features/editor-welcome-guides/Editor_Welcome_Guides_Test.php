<?php
/**
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/editor-welcome-guides/editor-welcome-guides.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * @covers ::wpcom_editor_welcome_guides_filter_preferences
 * @covers ::wpcom_editor_welcome_guides_record_preferences
 */
#[CoversFunction( 'wpcom_editor_welcome_guides_filter_preferences' )]
#[CoversFunction( 'wpcom_editor_welcome_guides_record_preferences' )]
class Editor_Welcome_Guides_Test extends \WorDBless\BaseTestCase {

	/**
	 * @var int
	 */
	private $user_id;

	/**
	 * What the `wpcom_editor_welcome_guides_dismissed` filter returns.
	 *
	 * @var array
	 */
	private $dismissed = array();

	/**
	 * Arguments of every `wpcom_editor_welcome_guides_dismiss` call.
	 *
	 * @var array
	 */
	private $recorded = array();

	public function set_up() {
		parent::set_up();

		$GLOBALS['wpcom_site_stickers_test_value'] = array( 'editor-welcome-guides-per-user' );

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'welcome_guides_user',
				'user_pass'  => 'password',
				'user_email' => 'welcome_guides_user@example.com',
			)
		);

		add_filter( 'wpcom_editor_welcome_guides_dismissed', fn() => $this->dismissed );
		add_action(
			'wpcom_editor_welcome_guides_dismiss',
			function ( $user_id, $dismissed ) {
				$this->recorded[] = array( $user_id, $dismissed );
			},
			10,
			2
		);
	}

	public function tear_down() {
		unset( $GLOBALS['wpcom_site_stickers_test_value'] );

		parent::tear_down();
	}

	/**
	 * Reads the preferences the way core's `get_metadata_raw()` does. WorDBless's own
	 * `get_user_metadata` callback discards earlier filter results, so `get_user_meta()` cannot.
	 */
	private function read_preferences() {
		$meta_key = wpcom_editor_welcome_guides_meta_key();
		$check    = wpcom_editor_welcome_guides_filter_preferences( null, $this->user_id, $meta_key );

		return null === $check ? get_user_meta( $this->user_id, $meta_key, true ) : $check[0];
	}

	public function test_read_filter_runs_first() {
		$this->assertSame( 1, has_filter( 'get_user_metadata', 'wpcom_editor_welcome_guides_filter_preferences' ) );
	}

	public function test_read_turns_dismissed_guides_off() {
		update_user_meta( $this->user_id, wpcom_editor_welcome_guides_meta_key(), array( 'core' => array( 'fixedToolbar' => true ) ) );
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

	public function test_read_works_without_stored_preferences() {
		$this->dismissed = array( 'core/edit-widgets' => array( 'welcomeGuide' ) );

		$preferences = $this->read_preferences();

		$this->assertFalse( $preferences['core/edit-widgets']['welcomeGuide'] );
		$this->assertNotFalse( strtotime( $preferences['_modified'] ) );
	}

	public function test_read_is_unchanged_when_nothing_applies() {
		$stored = array( 'core/edit-post' => array( 'welcomeGuide' => true ) );
		update_user_meta( $this->user_id, wpcom_editor_welcome_guides_meta_key(), $stored );

		$this->dismissed = array();
		$this->assertSame( $stored, $this->read_preferences() );

		$this->dismissed = array( 'wpcom/block-editor-nux' => array( 'welcomeTour' ) );
		$this->assertSame( $stored, $this->read_preferences() );

		$this->dismissed = array( 'core/edit-post' => array( 'welcomeGuide' ) );
		unset( $GLOBALS['wpcom_site_stickers_test_value'] );
		$this->assertSame( $stored, $this->read_preferences() );
	}

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

	public function test_write_reports_nothing_when_nothing_applies() {
		update_user_meta( $this->user_id, wpcom_editor_welcome_guides_meta_key(), array( 'core/edit-post' => array( 'welcomeGuide' => true ) ) );
		update_user_meta( $this->user_id, 'nickname', array( 'core/edit-post' => array( 'welcomeGuide' => false ) ) );

		unset( $GLOBALS['wpcom_site_stickers_test_value'] );
		update_user_meta( $this->user_id, wpcom_editor_welcome_guides_meta_key(), array( 'core/edit-post' => array( 'welcomeGuide' => false ) ) );

		$this->assertSame( array(), $this->recorded );
	}
}
