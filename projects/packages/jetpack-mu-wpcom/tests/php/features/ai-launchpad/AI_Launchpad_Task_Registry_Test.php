<?php
/**
 * Covers the AI Launchpad's own task registry.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// The registry resolves its plugin CTAs through a helper that ai-launchpad.php loads in production.
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
require_once __DIR__ . '/fixtures/trait-registers-test-task.php';
require_once __DIR__ . '/fixtures/trait-stubs-marker-draft.php';
require_once __DIR__ . '/fixtures/trait-uses-block-theme.php';

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * The registry holds the task definitions the shared launchpad catalog does not own.
 *
 * @covers \AI_Launchpad_Task_Registry
 */
#[CoversClass( AI_Launchpad_Task_Registry::class )]
class AI_Launchpad_Task_Registry_Test extends \WorDBless\BaseTestCase {

	use AI_Launchpad_Registers_Test_Task;
	use AI_Launchpad_Stubs_Marker_Draft;
	use AI_Launchpad_Uses_Block_Theme;

	/**
	 * Tear down.
	 */
	public function tear_down() {
		$this->flush_marker_drafts();
		$this->restore_theme_directories();
		parent::tear_down();
	}

	/**
	 * Build a registry card, failing the test with a named message rather than handing back null.
	 *
	 * @param string $task_id  A task id the registry defines.
	 * @param string $subtitle The AI-written subtitle, or '' to take the registry default.
	 * @return array The built card.
	 */
	private function build_card( $task_id, $subtitle ) {
		$card = AI_Launchpad_Task_Registry::build( $task_id, $subtitle );
		$this->assertIsArray( $card, "the registry defines $task_id but built no card for it" );

		return (array) $card;
	}

	/**
	 * An id the registry does not own is not complete and does not build, rather than fataling on a
	 * missing definition.
	 */
	public function test_unknown_ids_resolve_to_nothing() {
		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( 'first_post_published' ) );
		$this->assertFalse( AI_Launchpad_Task_Registry::is_visible( 'first_post_published' ) );
		$this->assertNull( AI_Launchpad_Task_Registry::build( 'not_a_task', 'x' ) );
	}

	/**
	 * `is_visible` is optional: a definition without one is visible, and one with a callable reports what
	 * that callable returns.
	 *
	 * @param bool|null $is_visible The `is_visible` return value, or null to omit the key.
	 * @param bool      $expected   Whether the task should report as visible.
	 * @dataProvider provide_registry_visibility_cases
	 */
	#[DataProvider( 'provide_registry_visibility_cases' )]
	public function test_is_visible_honors_the_optional_callable( $is_visible, $expected ) {
		$this->assertSame( $expected, AI_Launchpad_Task_Registry::is_visible( $this->register_test_task( $is_visible ) ) );
	}

	/**
	 * Visibility cases for test_is_visible_honors_the_optional_callable.
	 *
	 * @return array
	 */
	public static function provide_registry_visibility_cases() {
		return array(
			'a definition with no is_visible' => array( null, true ),
			'an is_visible returning true'    => array( true, true ),
			'an is_visible returning false'   => array( false, false ),
		);
	}

	/**
	 * A completed task is never also in progress, even while its marker draft is still lying around.
	 */
	public function test_build_does_not_report_a_completed_task_as_in_progress() {
		update_option( 'launchpad_checklist_tasks_statuses', array( 'add_gallery_page' => true ) );
		$this->stub_marker_draft( AI_Launchpad_Gallery_Page_Listener::META_KEY, 4343 );

		$card = $this->build_card( 'add_gallery_page', 'Show your work.' );

		$this->assertTrue( $card['completed'] );
		$this->assertFalse( $card['in_progress'] );
		$this->assertSame( 'Create your first gallery', $card['title'] );
		$this->assertNull( $card['calypso_path'] );
	}

	/**
	 * A page task's own unpublished marker draft puts it in progress, pointing the card at that draft and
	 * keeping the AI-written subtitle.
	 *
	 * @param string $task_id        The registry task id.
	 * @param string $meta_key       The listener marker meta its draft lookup queries.
	 * @param int    $draft_id       The draft post id the stubbed lookup resolves to.
	 * @param string $continue_title The card title once the draft exists.
	 * @dataProvider provide_marker_page_tasks
	 */
	#[DataProvider( 'provide_marker_page_tasks' )]
	public function test_a_page_task_reports_its_own_in_progress_draft( $task_id, $meta_key, $draft_id, $continue_title ) {
		$this->stub_marker_draft( $meta_key, $draft_id );

		$card = $this->build_card( $task_id, 'Whatever the AI wrote.' );

		$this->assertTrue( $card['in_progress'] );
		$this->assertSame( $continue_title, $card['title'] );
		$this->assertSame( 'Whatever the AI wrote.', $card['subtitle'] );
		$this->assertSame( admin_url( 'post.php?post=' . $draft_id . '&action=edit' ), $card['calypso_path'] );
	}

	/**
	 * The registry's page tasks, each with a marker meta of its own.
	 *
	 * @return array
	 */
	public static function provide_marker_page_tasks() {
		return array(
			'the gallery page'    => array( 'add_gallery_page', AI_Launchpad_Gallery_Page_Listener::META_KEY, 4343, 'Continue working on your gallery' ),
			'the contact page'    => array( 'add_contact_page', AI_Launchpad_Contact_Page_Listener::META_KEY, 7171, 'Continue working on your contact page' ),
			'the events page'     => array( 'add_events_page', AI_Launchpad_Events_Page_Listener::META_KEY, 8181, 'Continue working on your events page' ),
			'the video page'      => array( 'add_video_page', AI_Launchpad_Video_Page_Listener::META_KEY, 9191, 'Continue working on your video page' ),
			'the portfolio piece' => array( 'add_portfolio_piece', AI_Launchpad_Portfolio_Piece_Listener::META_KEY, 10101, 'Continue working on your portfolio piece' ),
		);
	}

	/**
	 * A task with no completion signal of its own completes from the shared status option its listener or the
	 * complete-on-click route writes, through is_complete() and build() alike.
	 *
	 * @param string $task_id The registry task id.
	 * @dataProvider provide_status_option_task_ids
	 */
	#[DataProvider( 'provide_status_option_task_ids' )]
	public function test_status_option_completion( $task_id ) {
		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( $task_id ) );

		update_option( 'launchpad_checklist_tasks_statuses', array( $task_id => true ) );

		$this->assertTrue( AI_Launchpad_Task_Registry::is_complete( $task_id ) );
		$this->assertTrue( $this->build_card( $task_id, '' )['completed'] );
	}

	/**
	 * The tasks that complete from the shared status option.
	 *
	 * @return array
	 */
	public static function provide_status_option_task_ids() {
		return array(
			'the gallery page'     => array( 'add_gallery_page' ),
			'the contact page'     => array( 'add_contact_page' ),
			'the events page'      => array( 'add_events_page' ),
			'the video page'       => array( 'add_video_page' ),
			'the portfolio piece'  => array( 'add_portfolio_piece' ),
			'the style variations' => array( 'pick_fonts_colors' ),
		);
	}

	/**
	 * A task that asks nothing of the site declares no visibility gate, so it is offered everywhere,
	 * including on the classic theme this harness runs.
	 *
	 * @param string $task_id The registry task id.
	 * @dataProvider provide_ungated_task_ids
	 */
	#[DataProvider( 'provide_ungated_task_ids' )]
	public function test_ungated_tasks_are_visible_everywhere( $task_id ) {
		$this->assertFalse( wp_is_block_theme(), 'the premise: this is the theme that hides pick_fonts_colors' );
		$this->assertTrue( AI_Launchpad_Task_Registry::is_visible( $task_id ) );
	}

	/**
	 * The registry tasks with no visibility gate.
	 *
	 * @return array
	 */
	public static function provide_ungated_task_ids() {
		return array(
			'the gallery page'    => array( 'add_gallery_page' ),
			'the contact page'    => array( 'add_contact_page' ),
			'the events page'     => array( 'add_events_page' ),
			'the video page'      => array( 'add_video_page' ),
			'the portfolio piece' => array( 'add_portfolio_piece' ),
			'the site icon'       => array( 'add_site_icon' ),
			'Sensei LMS'          => array( 'install_sensei_lms' ),
		);
	}

	/**
	 * A registry task renders the `calypso_path` it declares; the page tasks build their page on click and so
	 * ship none.
	 *
	 * @param string      $task_id  The registry task id.
	 * @param string|null $expected The expected CTA path, relative to admin_url().
	 * @dataProvider provide_registry_ctas
	 */
	#[DataProvider( 'provide_registry_ctas' )]
	public function test_build_resolves_the_declared_cta( $task_id, $expected ) {
		$card = $this->build_card( $task_id, 'A subtitle.' );

		$this->assertSame( null === $expected ? null : admin_url( $expected ), $card['calypso_path'] );
	}

	/**
	 * CTA cases for test_build_resolves_the_declared_cta.
	 *
	 * @return array
	 */
	public static function provide_registry_ctas() {
		return array(
			'the site icon settings screen' => array( 'add_site_icon', 'options-general.php' ),
			// `p` is the Site Editor's router path arg; `section` is the Styles screen's own sub-route.
			'the Styles variations screen'  => array( 'pick_fonts_colors', 'site-editor.php?p=/styles&section=/variations' ),
			'the gallery, built on click'   => array( 'add_gallery_page', null ),
			'the contact page, on click'    => array( 'add_contact_page', null ),
			'the events page, on click'     => array( 'add_events_page', null ),
			'the video page, on click'      => array( 'add_video_page', null ),
			'the piece, on click'           => array( 'add_portfolio_piece', null ),
			"Sensei LMS's installer"        => array( 'install_sensei_lms', 'plugin-install.php?tab=plugin-information&plugin=sensei-lms' ),
		);
	}

	/**
	 * The site-icon task completes off the live `site_icon` option, which holds the uploaded attachment id.
	 *
	 * @param mixed $option   The `site_icon` option value, or null to leave it unset.
	 * @param bool  $expected Whether the task should report complete.
	 * @dataProvider provide_site_icon_completion_cases
	 */
	#[DataProvider( 'provide_site_icon_completion_cases' )]
	public function test_site_icon_completion_reads_the_option( $option, $expected ) {
		if ( null !== $option ) {
			update_option( 'site_icon', $option );
		}

		$this->assertSame( $expected, AI_Launchpad_Task_Registry::is_complete( 'add_site_icon' ) );
		$this->assertSame( $expected, $this->build_card( 'add_site_icon', '' )['completed'] );
	}

	/**
	 * Completion cases for test_site_icon_completion_reads_the_option.
	 *
	 * @return array
	 */
	public static function provide_site_icon_completion_cases() {
		return array(
			'no icon has ever been set' => array( null, false ),
			'the icon was removed'      => array( 0, false ),
			'an uploaded attachment'    => array( 4242, true ),
		);
	}

	/**
	 * Completion is written to the shared status option directly, and only for ids the registry owns.
	 */
	public function test_mark_complete_writes_only_for_registry_ids() {
		$this->assertTrue( AI_Launchpad_Task_Registry::mark_complete( 'pick_fonts_colors' ) );
		$this->assertFalse( AI_Launchpad_Task_Registry::mark_complete( 'first_post_published' ) );

		$this->assertSame( array( 'pick_fonts_colors' => true ), get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * The style-variations task is offered only on a block theme, where the Styles screen its CTA opens exists.
	 */
	public function test_fonts_and_colors_needs_a_block_theme() {
		$this->assertFalse( AI_Launchpad_Task_Registry::is_visible( 'pick_fonts_colors' ) );

		$this->use_block_theme();

		$this->assertTrue( wp_is_block_theme(), 'the premise: the fixture theme really is a block theme' );
		$this->assertTrue( AI_Launchpad_Task_Registry::is_visible( 'pick_fonts_colors' ) );
	}

	/**
	 * Every registry task builds the full card shape, with a translated title and a default subtitle for when
	 * the AI supplies none.
	 *
	 * @param string $task_id  The registry task id.
	 * @param string $title    The expected card title.
	 * @param string $subtitle The expected fallback subtitle.
	 * @dataProvider provide_registry_card_copy
	 */
	#[DataProvider( 'provide_registry_card_copy' )]
	public function test_build_returns_the_declared_copy( $task_id, $title, $subtitle ) {
		$card = $this->build_card( $task_id, '' );

		$this->assertSame( $task_id, $card['id'] );
		$this->assertSame( $title, $card['title'] );
		$this->assertSame( $subtitle, $card['subtitle'] );
		$this->assertFalse( $card['in_progress'] );
		$this->assertFalse( $card['disabled'] );
	}

	/**
	 * Card copy for test_build_returns_the_declared_copy.
	 *
	 * @return array
	 */
	public static function provide_registry_card_copy() {
		return array(
			'the gallery page'     => array(
				'add_gallery_page',
				'Create your first gallery',
				'Show your work in a beautiful photo gallery.',
			),
			'the site icon'        => array(
				'add_site_icon',
				'Add your logo or site icon',
				'Upload your logo so your site is recognizable in browser tabs and search results.',
			),
			'the style variations' => array(
				'pick_fonts_colors',
				'Customize fonts and colors',
				'Try a style variation to set the mood of your whole site at once.',
			),
			'the contact page'     => array(
				'add_contact_page',
				'Add a contact page',
				'Give visitors a simple way to reach you, with a contact form ready to go.',
			),
			'the events page'      => array(
				'add_events_page',
				'Add an events page',
				'Give people one place to find out what is coming up and when.',
			),
			'the video page'       => array(
				'add_video_page',
				'Add a video page',
				'Give your videos a home on your site, ready for you to upload the first one.',
			),
			'the portfolio piece'  => array(
				'add_portfolio_piece',
				'Add your first portfolio piece',
				'Give one project a page of its own, with room for the work and the story behind it.',
			),
			'Sensei LMS'           => array(
				'install_sensei_lms',
				'Build your courses with Sensei LMS',
				'Install Sensei to turn what you teach into structured lessons, quizzes, and student progress.',
			),
		);
	}

	/**
	 * A plugin-discovery task is complete, and still visible, exactly while its plugin is active; deactivating
	 * un-ticks it, so completion is never latched.
	 */
	public function test_plugin_discovery_completion_tracks_the_active_plugin() {
		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( 'install_sensei_lms' ) );
		$this->assertFalse( $this->build_card( 'install_sensei_lms', '' )['completed'] );

		update_option( 'active_plugins', array( 'sensei-lms/sensei-lms.php' ) );

		$this->assertTrue( AI_Launchpad_Task_Registry::is_complete( 'install_sensei_lms' ) );
		$this->assertTrue( $this->build_card( 'install_sensei_lms', '' )['completed'] );
		$this->assertTrue( AI_Launchpad_Task_Registry::is_visible( 'install_sensei_lms' ) );

		update_option( 'active_plugins', array() );

		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( 'install_sensei_lms' ) );
	}

	/**
	 * A discovery task watches its own plugin, not whether any plugin is active.
	 */
	public function test_plugin_discovery_completion_keys_off_its_own_plugin() {
		update_option( 'active_plugins', array( 'woocommerce/woocommerce.php', 'akismet/akismet.php' ) );

		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( 'install_sensei_lms' ) );

		update_option( 'active_plugins', array( 'woocommerce/woocommerce.php', 'sensei-lms/sensei-lms.php' ) );

		$this->assertTrue( AI_Launchpad_Task_Registry::is_complete( 'install_sensei_lms' ) );
	}

	/**
	 * A discovery task cannot be ticked through the status option the complete-on-click route writes: only
	 * installing the plugin completes it.
	 */
	public function test_plugin_discovery_completion_ignores_the_status_option() {
		update_option( 'launchpad_checklist_tasks_statuses', array( 'install_sensei_lms' => true ) );

		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( 'install_sensei_lms' ) );
	}

	/**
	 * On a Simple site the discovery CTA points at the Calypso page for that plugin, since Simple has no
	 * wp-admin installer. Runs in a separate process so IS_WPCOM does not leak.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_plugin_discovery_ctas_target_calypso_on_simple() {
		define( 'IS_WPCOM', true );

		$this->assertSame(
			'/plugins/sensei-lms/' . rawurlencode( wpcom_get_site_slug() ),
			$this->build_card( 'install_sensei_lms', '' )['calypso_path']
		);
	}
}
