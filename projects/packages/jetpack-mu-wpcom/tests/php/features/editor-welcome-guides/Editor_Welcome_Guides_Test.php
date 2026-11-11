<?php
/**
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/editor-welcome-guides/editor-welcome-guides.php';

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers ::wpcom_editor_welcome_guides_filter_preferences
 * @covers ::wpcom_editor_welcome_guides_current_editor_scope
 * @covers ::wpcom_editor_welcome_guides_record_suppressed
 * @covers ::wpcom_editor_welcome_guides_record_preferences
 */
#[CoversFunction( 'wpcom_editor_welcome_guides_filter_preferences' )]
#[CoversFunction( 'wpcom_editor_welcome_guides_current_editor_scope' )]
#[CoversFunction( 'wpcom_editor_welcome_guides_record_suppressed' )]
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

	/**
	 * Reads the preferences the way core's `get_metadata_raw()` does. WorDBless's own
	 * `get_user_metadata` callback discards earlier filter results, so `get_user_meta()` cannot.
	 */
	private function read_preferences() {
		$meta_key = wpcom_editor_welcome_guides_meta_key();
		$check    = wpcom_editor_welcome_guides_filter_preferences( null, $this->user_id, $meta_key );

		return null === $check ? get_user_meta( $this->user_id, $meta_key, true ) : $check[0];
	}

	/**
	 * Loads an admin screen as the test user. Installs a Tracks spy, so only call it from a
	 * test that runs in a separate process.
	 *
	 * @param string $pagenow Admin screen file.
	 */
	private function load_screen( string $pagenow ): void {
		require_once __DIR__ . '/fixtures/tracks-spy.php';

		$GLOBALS['pagenow'] = $pagenow;
		wp_set_current_user( $this->user_id );
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

		$this->assertSame( array(), $this->recorded );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_editor_load_records_suppressed_guide() {
		$this->load_screen( 'post.php' );
		$this->dismissed = array( 'core/edit-post' => array( 'welcomeGuide' ) );

		$this->read_preferences();

		$this->assertSame(
			array(
				array(
					'wpcom_editor_welcome_guide_suppressed',
					array(
						'scope'    => 'core/edit-post',
						'guide'    => 'welcomeGuide',
						'platform' => 'atomic',
					),
				),
			),
			$GLOBALS['wpcom_tracks_events']
		);
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_repeated_reads_record_suppressed_guide_once() {
		$this->load_screen( 'site-editor.php' );
		$this->dismissed = array( 'core/edit-site' => array( 'welcomeGuide' ) );

		$this->read_preferences();
		$preferences = $this->read_preferences();

		$this->assertFalse( $preferences['core/edit-site']['welcomeGuide'] );
		$this->assertCount( 1, $GLOBALS['wpcom_tracks_events'] );
	}

	/**
	 * @param string $pagenow       Admin screen file.
	 * @param string $scope         Scope of the dismissed guide.
	 * @param bool   $already_off   Whether the site preferences already turn the guide off.
	 * @param bool   $as_other_user Whether another user is reading the test user's preferences.
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider provide_reads_that_suppress_nothing
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'provide_reads_that_suppress_nothing' )]
	public function test_read_records_nothing_when_no_guide_would_open( string $pagenow, string $scope, bool $already_off, bool $as_other_user ) {
		$this->load_screen( $pagenow );
		if ( $already_off ) {
			update_user_meta( $this->user_id, wpcom_editor_welcome_guides_meta_key(), array( $scope => array( 'welcomeGuide' => false ) ) );
		}
		if ( $as_other_user ) {
			wp_set_current_user(
				wp_insert_user(
					array(
						'user_login' => 'welcome_guides_other_user',
						'user_pass'  => 'password',
						'user_email' => 'welcome_guides_other_user@example.com',
					)
				)
			);
		}
		$this->dismissed = array( $scope => array( 'welcomeGuide' ) );

		$preferences = $this->read_preferences();

		$this->assertFalse( $preferences[ $scope ]['welcomeGuide'] );
		$this->assertArrayNotHasKey( 'wpcom_tracks_events', $GLOBALS );
	}

	/**
	 * @return array
	 */
	public static function provide_reads_that_suppress_nothing() {
		return array(
			'guide already off on this site' => array( 'post.php', 'core/edit-post', true, false ),
			'guide of another editor'        => array( 'post.php', 'core/edit-site', false, false ),
			'not an editor screen'           => array( 'index.php', 'core/edit-post', false, false ),
			'another user\'s preferences'    => array( 'post.php', 'core/edit-post', false, true ),
		);
	}
}
