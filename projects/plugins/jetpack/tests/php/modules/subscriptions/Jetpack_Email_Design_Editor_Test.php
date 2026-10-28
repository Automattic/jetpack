<?php
/**
 * Tests for the newsletter email design screen (NL-839).
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions/email-design-editor/class-jetpack-email-design-editor.php';

/**
 * @covers Jetpack_Email_Design_Editor
 */
#[CoversClass( Jetpack_Email_Design_Editor::class )]
class Jetpack_Email_Design_Editor_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The asset file the screen looks for, which decides whether it enqueues anything.
	 *
	 * @var string
	 */
	private $asset_path;

	/**
	 * Where a real build's asset file was moved for the duration of a test, if there was one.
	 *
	 * @var string|null
	 */
	private $asset_backup = null;

	/**
	 * The build directory, when this test created it.
	 *
	 * @var string|null
	 */
	private $created_build_dir = null;

	/**
	 * Whether this test wrote the asset file.
	 *
	 * @var bool
	 */
	private $wrote_asset = false;

	/**
	 * A snapshot of the admin menu globals, which add_theme_page() appends to. `_parent_pages`
	 * belongs here too: `menu_page_url()` reads it, so without it one test's page is another's.
	 *
	 * @var array
	 */
	private $menu_snapshot = array();

	/**
	 * A snapshot of the script and style registries, which this test replaces.
	 *
	 * @var array
	 */
	private $asset_registries = array();

	/**
	 * Block types registered by a test, unregistered again however the test ends.
	 *
	 * @var string[]
	 */
	private $registered_blocks = array();

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->asset_path    = JETPACK__PLUGIN_DIR . '_inc/build/email-design-editor.asset.php';
		$this->menu_snapshot = array( $GLOBALS['menu'] ?? array(), $GLOBALS['submenu'] ?? array(), $GLOBALS['_parent_pages'] ?? array() );

		// A development environment may force the flag on for the whole site, which would make
		// the tests below assert the environment's answer rather than the registered default.
		remove_all_filters( 'jetpack_feature_flag_enabled' );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Jetpack_Email_Design_Editor::FEATURE_FLAG );

		// Other tests leave bare stdClass entries in the script registry, which the iframed-asset
		// helper copies wholesale and then trips over. Rebuilt rather than cleared: the helper
		// reads these globals before anything initializes them, and would copy nothing at all.
		$this->asset_registries = array( $GLOBALS['wp_scripts'] ?? null, $GLOBALS['wp_styles'] ?? null );
		$GLOBALS['wp_scripts']  = null;
		$GLOBALS['wp_styles']   = null;
		wp_scripts();
		wp_styles();

		// What the screen owes the bundle is that these fire, not what anything else hangs on
		// them — and on the wpcomsh run their callbacks warn on build files that job never built.
		remove_all_actions( 'enqueue_block_assets' );
		remove_all_actions( 'enqueue_block_editor_assets' );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		if ( $this->wrote_asset && file_exists( $this->asset_path ) ) {
			unlink( $this->asset_path );
		}

		if ( null !== $this->asset_backup ) {
			rename( $this->asset_backup, $this->asset_path );
		}

		if ( null !== $this->created_build_dir ) {
			rmdir( $this->created_build_dir );
		}

		foreach ( $this->registered_blocks as $name ) {
			unregister_block_type( $name );
		}
		$this->registered_blocks = array();

		Constants::clear_single_constant( 'AT_PROXIED_REQUEST' );

		// The platforms a test may have stood this site up as.
		foreach ( array( 'IS_WPCOM', 'ATOMIC_SITE_ID', 'ATOMIC_CLIENT_ID', 'WPCOMSH__PLUGIN_FILE' ) as $name ) {
			Constants::clear_single_constant( $name );
		}

		// Held for the request, so a test that turned offline mode off would otherwise answer for
		// the next one. {@see self::allow_tracking()}
		\Automattic\Jetpack\Status\Cache::clear();

		// Memoised past the database rollback. {@see self::connect_a_user()}
		Jetpack_Options::delete_option( 'user_tokens' );

		list( $GLOBALS['menu'], $GLOBALS['submenu'], $GLOBALS['_parent_pages'] ) = $this->menu_snapshot;
		list( $GLOBALS['wp_scripts'], $GLOBALS['wp_styles'] )                    = $this->asset_registries;

		$this->wrote_asset       = false;
		$this->asset_backup      = null;
		$this->created_build_dir = null;

		parent::tear_down();
	}

	/**
	 * Decide what the screen finds where its build should be.
	 *
	 * A real build is moved aside rather than deleted, so running the suite in a checkout that
	 * has been built does not destroy it.
	 *
	 * @param array|null $asset The asset file's return value, or null for no build at all.
	 * @return void
	 */
	private function set_build( ?array $asset ) {
		$build_dir = dirname( $this->asset_path );

		if ( file_exists( $this->asset_path ) ) {
			$this->asset_backup = $this->asset_path . '.test-backup';
			rename( $this->asset_path, $this->asset_backup );
		}

		if ( null === $asset ) {
			return;
		}

		if ( ! is_dir( $build_dir ) ) {
			mkdir( $build_dir, 0777, true );
			$this->created_build_dir = $build_dir;
		}

		file_put_contents( $this->asset_path, '<?php return ' . var_export( $asset, true ) . ';' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export, WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$this->wrote_asset = true;
	}

	/**
	 * Call one of the screen's private helpers.
	 *
	 * @param string $method Method name.
	 * @param array  $args   Arguments.
	 * @return mixed
	 */
	private function call_private( $method, array $args = array() ) {
		$reflected = new ReflectionMethod( Jetpack_Email_Design_Editor::class, $method );

		// Required on the 7.4 run, a no-op since 8.1, and deprecated as of 8.5.
		if ( PHP_VERSION_ID < 80100 ) {
			$reflected->setAccessible( true );
		}

		return $reflected->invokeArgs( null, $args );
	}

	/**
	 * Register a block type for the duration of one test.
	 *
	 * Returned so a test can write shapes past `register_block_type()` that a caller could still
	 * reach through `register_block_type_args`.
	 *
	 * @param string $name Block name.
	 * @param array  $args Registration args.
	 * @return WP_Block_Type
	 */
	private function register_test_block( $name, array $args = array() ) {
		$this->registered_blocks[] = $name;

		return register_block_type( $name, $args );
	}

	/**
	 * Give this process a sticker reader that answers for the named stickers.
	 *
	 * @param string[] $stickers The stickers this site carries.
	 * @param bool     $atomic   Whether to run as Atomic, where a reader is trusted.
	 * @return void
	 */
	private function stub_site_stickers( array $stickers, $atomic = true ) {
		if ( '1' === getenv( 'JETPACK_TEST_WPCOMSH' ) ) {
			$this->markTestSkipped( 'The real wpcomsh reader is loaded here, and its blank persistent data answers false for every sticker.' );
		}

		$GLOBALS['jetpack_test_site_stickers'] = $stickers;

		if ( $atomic ) {
			define( 'IS_ATOMIC', true );
		}

		require_once __DIR__ . '/../../files/mock-wpcomsh-site-sticker.php';
	}

	/**
	 * The submenu entries registered under Appearance for the screen's slug.
	 *
	 * @return array
	 */
	private function appearance_entries_for_screen() {
		$entries = $GLOBALS['submenu']['themes.php'] ?? array();

		return array_values(
			array_filter(
				$entries,
				function ( $entry ) {
					return Jetpack_Email_Design_Editor::PAGE_SLUG === $entry[2];
				}
			)
		);
	}

	public function test_the_flag_is_registered_and_defaults_to_off() {
		$this->assertNotNull( Feature_Flags::get( Jetpack_Email_Design_Editor::FEATURE_FLAG ) );
		$this->assertFalse( Jetpack_Email_Design_Editor::is_enabled() );
	}

	public function test_the_flag_can_be_turned_on_by_filter() {
		add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Email_Design_Editor::FEATURE_FLAG, '__return_true' );

		$this->assertTrue( Jetpack_Email_Design_Editor::is_enabled() );
	}

	/**
	 * The sticker has to answer the flag last, or a filter added after this one could keep the
	 * screen open on an Atomic site whose sticker was removed.
	 */
	public function test_the_sticker_gets_the_last_word_on_the_flag() {
		Jetpack_Email_Design_Editor::init();

		$this->assertSame(
			PHP_INT_MAX,
			has_filter(
				'jetpack_feature_flag_enabled_' . Jetpack_Email_Design_Editor::FEATURE_FLAG,
				array( 'Jetpack_Email_Design_Editor', 'filter_flag_for_atomic' )
			)
		);
	}

	/**
	 * On Atomic the sticker is the whole switch, read from the site's persistent data. NL-1040.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_the_sticker_turns_the_screen_on_on_atomic() {
		$this->stub_site_stickers( array( Jetpack_Email_Design_Editor::STICKER ) );

		Jetpack_Email_Design_Editor::init();

		$this->assertTrue( Jetpack_Email_Design_Editor::is_enabled() );
	}

	/**
	 * Removing the sticker is the rollback, so it has to beat a flag someone turned on by hand.
	 * This process is not proxied, which is the other half of the a12 rollout's condition.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_removing_the_sticker_closes_the_screen_even_with_the_flag_forced_on() {
		$this->stub_site_stickers( array() );

		$this->assertFalse( Constants::is_true( 'AT_PROXIED_REQUEST' ), 'This process is proxied, so the rollback below is not what is being asserted.' );

		Jetpack_Email_Design_Editor::init();
		add_filter( 'jetpack_feature_flag_enabled', '__return_true' );
		add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Email_Design_Editor::FEATURE_FLAG, '__return_true' );

		$this->assertFalse( Jetpack_Email_Design_Editor::is_enabled() );
	}

	/**
	 * Off Atomic, wpcomsh ships a blank `Atomic_Persistent_Data` and its reader answers false for
	 * every sticker -- so trusting it there would pin the flag off on a Jurassic Ninja or local
	 * site whose only way in is the flag.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_sticker_reader_off_atomic_does_not_decide_the_flag() {
		$this->stub_site_stickers( array(), false );

		Jetpack_Email_Design_Editor::init();
		add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Email_Design_Editor::FEATURE_FLAG, '__return_true' );

		$this->assertTrue( Jetpack_Email_Design_Editor::is_enabled() );
	}

	/**
	 * The a12 rollout: on Atomic the proxy opens the screen for an Automattician on a blog that
	 * carries no sticker yet, and wpcom's bootstrap endpoint still decides whether it is in. NL-41.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_proxied_automattician_gets_the_screen_on_atomic_without_the_sticker() {
		$this->stub_site_stickers( array() );
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );

		Jetpack_Email_Design_Editor::init();

		$this->assertTrue( Jetpack_Email_Design_Editor::is_enabled() );
	}

	/**
	 * The proxy is read only once the platform check has passed, so it cannot open the screen on
	 * Simple or a self-hosted site, where there is no sticker to roll the a12 group back with.
	 */
	public function test_the_proxy_does_not_decide_the_flag_off_atomic() {
		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			$this->markTestSkipped( 'This process runs as Atomic, which is what this test is about not being.' );
		}

		Constants::set_constant( 'AT_PROXIED_REQUEST', true );

		Jetpack_Email_Design_Editor::init();

		$this->assertFalse( Jetpack_Email_Design_Editor::is_enabled() );
	}

	/**
	 * A host can define `IS_ATOMIC` without loading wpcomsh -- the loader only forces it on for
	 * certain WP Cloud clients -- and calling a reader that is not there is a fatal.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_atomic_without_a_loaded_reader_falls_back_to_the_flag() {
		if ( function_exists( 'wpcomsh_is_site_sticker_active' ) ) {
			$this->markTestSkipped( 'This process already has a sticker reader, so there is no absent one to call.' );
		}

		define( 'IS_ATOMIC', true );

		Jetpack_Email_Design_Editor::init();
		add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Email_Design_Editor::FEATURE_FLAG, '__return_true' );

		$this->assertTrue( Jetpack_Email_Design_Editor::is_enabled() );
	}

	/**
	 * Neither Simple nor self-hosted reaches the Atomic reader, so the flag stays the gate there.
	 */
	public function test_the_flag_stays_the_gate_where_no_sticker_can_be_read() {
		if ( function_exists( 'wpcomsh_is_site_sticker_active' ) ) {
			$this->markTestSkipped( 'This process can read stickers, which is what this test is about not having.' );
		}

		Jetpack_Email_Design_Editor::init();

		$this->assertFalse( Jetpack_Email_Design_Editor::is_enabled() );

		add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Email_Design_Editor::FEATURE_FLAG, '__return_true' );

		$this->assertTrue( Jetpack_Email_Design_Editor::is_enabled() );
	}

	public function test_no_appearance_page_while_the_flag_is_off() {
		Jetpack_Email_Design_Editor::add_admin_page();

		$this->assertSame( array(), $this->appearance_entries_for_screen() );
	}

	public function test_the_appearance_page_is_gated_on_edit_theme_options() {
		add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Email_Design_Editor::FEATURE_FLAG, '__return_true' );

		Jetpack_Email_Design_Editor::add_admin_page();
		$entries = $this->appearance_entries_for_screen();

		$this->assertCount( 1, $entries );
		$this->assertSame( 'edit_theme_options', $entries[0][1] );
	}

	public function test_render_prints_the_element_the_bundle_mounts_into() {
		ob_start();
		Jetpack_Email_Design_Editor::render();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'id="' . Jetpack_Email_Design_Editor::HANDLE . '"', $html );
	}

	/**
	 * The element id is the contract between the page and the bundle: the bundle mounts into
	 * whatever `elementId` names, so the two must not drift apart.
	 */
	public function test_the_rendered_element_is_the_one_the_screen_data_names() {
		$data = $this->call_private( 'get_screen_data' );

		ob_start();
		Jetpack_Email_Design_Editor::render();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'id="' . $data['elementId'] . '"', $html );
	}

	/**
	 * Every WordPress.com id comes from the bootstrap response instead, because a locally
	 * computed one is right on Simple and wrong on Atomic and self-hosted.
	 */
	public function test_the_screen_data_carries_no_wordpress_com_ids() {
		$data = $this->call_private( 'get_screen_data' );

		$this->assertSame(
			array( 'elementId', 'editorSettings', 'urls', 'userEmail', 'postId', 'tracks' ),
			array_keys( $data )
		);
	}

	public function test_the_screen_data_describes_this_installation() {
		$user = wp_get_current_user();
		$data = $this->call_private( 'get_screen_data' );

		$this->assertSame( admin_url( '/' ), $data['urls']['back'] );
		$this->assertSame( admin_url( '/' ), $data['urls']['listings'] );
		$this->assertSame( $user->user_email, $data['userEmail'] );
	}

	/**
	 * The screen has two entry points, so the button goes back to the one that was used.
	 */
	public function test_the_editor_returns_to_the_page_that_sent_the_reader() {
		$settings       = \Automattic\Jetpack\Newsletter\Urls::get_newsletter_settings_url();
		$_GET['return'] = $settings;

		$data = $this->call_private( 'get_screen_data' );

		$this->assertSame( $settings, $data['urls']['back'] );
		$this->assertSame( $settings, $data['urls']['listings'] );
	}

	/**
	 * A `return` nobody can be sent to safely leaves the dashboard, never a half-applied redirect.
	 *
	 * @param string $return What the query arg carries.
	 *
	 * @dataProvider provide_unusable_returns
	 */
	#[PHPUnit\Framework\Attributes\DataProvider( 'provide_unusable_returns' )]
	public function test_an_unusable_return_falls_back_to_the_dashboard( $return ) {
		$_GET['return'] = $return;

		$data = $this->call_private( 'get_screen_data' );

		$this->assertSame( admin_url( '/' ), $data['urls']['back'] );
	}

	/**
	 * @return array[]
	 */
	public static function provide_unusable_returns() {
		return array(
			'another host'         => array( 'https://example.net/wp-admin/' ),
			'this site, not admin' => array( home_url( '/some-post/' ) ),
			'empty'                => array( '' ),
		);
	}

	/**
	 * The previewer's link carries the post the reader was looking at, so changing the design does
	 * not replace it with the sample post. See NL-1051.
	 */
	public function test_the_canvas_previews_the_post_the_previewer_named() {
		$post_id         = self::factory()->post->create();
		$_GET['post_id'] = (string) $post_id;

		$data = $this->call_private( 'get_screen_data' );

		$this->assertSame( $post_id, $data['postId'] );
	}

	/**
	 * A hand-edited URL cannot aim the canvas at a post this user may not read.
	 */
	public function test_a_post_this_user_cannot_edit_is_not_previewed() {
		$post_id         = self::factory()->post->create( array( 'post_author' => self::factory()->user->create( array( 'role' => 'author' ) ) ) );
		$_GET['post_id'] = (string) $post_id;

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'author' ) ) );

		$data = $this->call_private( 'get_screen_data' );

		$this->assertNull( $data['postId'] );
	}

	/**
	 * Without a usable one the canvas keeps its default post, which is what entering from
	 * Appearance or a bookmark does.
	 *
	 * @param string|null $post_id What the query arg carries, or null for no arg at all.
	 *
	 * @dataProvider provide_unusable_preview_posts
	 */
	#[PHPUnit\Framework\Attributes\DataProvider( 'provide_unusable_preview_posts' )]
	public function test_an_unusable_post_id_leaves_the_canvas_on_its_default( $post_id ) {
		if ( null !== $post_id ) {
			$_GET['post_id'] = $post_id;
		}

		$data = $this->call_private( 'get_screen_data' );

		$this->assertNull( $data['postId'] );
	}

	/**
	 * `absint()` folds the sign rather than rejecting it, so what a negative id names is a real
	 * post that `edit_post` then has the final word on. The REST route refuses one outright
	 * (`minimum: 1`); this path does not, and that difference is deliberate.
	 */
	public function test_a_negative_post_id_names_the_post_absint_folds_it_to() {
		$post_id         = self::factory()->post->create();
		$_GET['post_id'] = '-' . $post_id;

		$data = $this->call_private( 'get_screen_data' );

		$this->assertSame( $post_id, $data['postId'] );
	}

	/**
	 * @return array[]
	 */
	public static function provide_unusable_preview_posts() {
		return array(
			'no arg at all'       => array( null ),
			'not a number'        => array( 'abc' ),
			'zero'                => array( '0' ),
			'empty'               => array( '' ),
			'a post that is gone' => array( '999999' ),
		);
	}

	/**
	 * The Newsletter settings page renders its link from this value alone, so a site without the
	 * screen has to be told so rather than left to link at a page that will refuse it.
	 */
	public function test_the_script_data_withholds_the_link_while_the_flag_is_off() {
		Jetpack_Email_Design_Editor::add_admin_page();

		$data = Jetpack_Email_Design_Editor::add_script_data( array() );

		$this->assertNull( $data['newsletter']['emailDesignUrl'] );
	}

	public function test_the_script_data_names_the_screen_once_it_is_registered() {
		add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Email_Design_Editor::FEATURE_FLAG, '__return_true' );
		Jetpack_Email_Design_Editor::add_admin_page();

		$data = Jetpack_Email_Design_Editor::add_script_data( array() );

		// Bare: each surface that links here adds its own `return`, so this one carries none.
		parse_str( (string) wp_parse_url( $data['newsletter']['emailDesignUrl'], PHP_URL_QUERY ), $args );

		$this->assertSame( array( 'page' => Jetpack_Email_Design_Editor::PAGE_SLUG ), $args );
	}

	/**
	 * The Newsletter settings page asks only for `manage_options`, so its reader can be someone
	 * `add_theme_page()` registers nothing for -- and a link to an unregistered page is a `wp_die()`.
	 */
	public function test_the_script_data_withholds_the_link_without_edit_theme_options() {
		add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Email_Design_Editor::FEATURE_FLAG, '__return_true' );
		add_filter(
			'user_has_cap',
			function ( $allcaps ) {
				unset( $allcaps['edit_theme_options'] );
				return $allcaps;
			}
		);

		Jetpack_Email_Design_Editor::add_admin_page();
		$data = Jetpack_Email_Design_Editor::add_script_data( array() );

		$this->assertTrue( current_user_can( 'manage_options' ) );
		$this->assertNull( $data['newsletter']['emailDesignUrl'] );
	}

	public function test_the_allowed_iframe_handles_start_from_the_editor_stylesheets() {
		$handles = $this->call_private( 'get_allowed_iframe_style_handles' );

		$this->assertContains( 'wp-components-css', $handles );
		$this->assertContains( 'wp-block-library-css', $handles );
		$this->assertContains( 'wp-block-editor-content-css', $handles );
		$this->assertContains( 'wp-edit-blocks-css', $handles );
	}

	public function test_a_block_declaring_email_support_keeps_its_stylesheet() {
		$this->register_test_block(
			'jetpack-test/email-block',
			array(
				'supports'             => array( 'email' => true ),
				'style_handles'        => array( 'jetpack-test-email-style' ),
				'editor_style_handles' => array( 'jetpack-test-email-editor-style' ),
			)
		);

		$handles = $this->call_private( 'get_allowed_iframe_style_handles' );

		$this->assertContains( 'jetpack-test-email-style-css', $handles );
		$this->assertContains( 'jetpack-test-email-editor-style-css', $handles );
	}

	public function test_a_block_without_email_support_does_not() {
		$this->register_test_block(
			'jetpack-test/ordinary-block',
			array(
				'supports'      => array( 'align' => true ),
				'style_handles' => array( 'jetpack-test-ordinary-style' ),
			)
		);

		$handles = $this->call_private( 'get_allowed_iframe_style_handles' );

		$this->assertNotContains( 'jetpack-test-ordinary-style-css', $handles );
	}

	/**
	 * `WP_Block_Type::set_props()` normalizes only `attributes`, so a handle list arrives however
	 * it was registered — and `register_block_type_args` can rewrite it after that.
	 */
	public function test_a_block_declaring_its_handles_as_a_string_does_not_break_the_list() {
		$block                = $this->register_test_block( 'jetpack-test/string-handles', array( 'supports' => array( 'email' => true ) ) );
		$block->style_handles = 'jetpack-test-string-style';

		$handles = $this->call_private( 'get_allowed_iframe_style_handles' );

		$this->assertContains( 'jetpack-test-string-style-css', $handles );
	}

	public function test_a_block_whose_supports_is_not_an_array_is_skipped() {
		$block           = $this->register_test_block( 'jetpack-test/object-supports', array( 'style_handles' => array( 'jetpack-test-object-style' ) ) );
		$block->supports = new stdClass();

		$handles = $this->call_private( 'get_allowed_iframe_style_handles' );

		$this->assertNotContains( 'jetpack-test-object-style-css', $handles );
	}

	public function test_a_handle_that_is_not_a_string_is_left_out_rather_than_concatenated() {
		$block                = $this->register_test_block( 'jetpack-test/nested-handle', array( 'supports' => array( 'email' => true ) ) );
		$block->style_handles = array( array( 'nested' ), 'jetpack-test-nested-sibling' );

		$handles = $this->call_private( 'get_allowed_iframe_style_handles' );

		$this->assertContains( 'jetpack-test-nested-sibling-css', $handles );
		$this->assertNotContains( 'Array-css', $handles );
	}

	/**
	 * An unfiltered list would leave the canvas painted in the site's own styles rather than
	 * the email's, and it would look plausible while doing it.
	 */
	public function test_the_resolved_assets_keep_only_allowed_stylesheets() {
		$assets = $this->call_private( 'get_resolved_assets', array( array( 'wp-block-library-css' ) ) );
		$tags   = array_filter( explode( "\n", $assets['styles'] ) );

		$this->assertArrayHasKey( 'scripts', $assets );
		$this->assertNotEmpty( $tags, 'Nothing was kept, so the filter below asserts nothing.' );

		foreach ( $tags as $tag ) {
			$this->assertStringContainsString( 'wp-block-library-css', $tag );
		}
	}

	/**
	 * Core buffers `wp_print_footer_scripts()` to collect the canvas assets, so the dialog is
	 * captured and injected into the canvas — where its own stylesheet is stripped, leaving it
	 * permanently visible over the email. NL-957.
	 */
	public function test_the_resolved_assets_leave_the_auth_check_dialog_out_of_the_canvas() {
		add_action( 'wp_print_footer_scripts', 'wp_auth_check_html', 5 );

		$assets   = $this->call_private( 'get_resolved_assets', array( array( 'wp-block-library-css' ) ) );
		$restored = has_action( 'wp_print_footer_scripts', 'wp_auth_check_html' );

		remove_action( 'wp_print_footer_scripts', 'wp_auth_check_html', 5 );

		$this->assertStringNotContainsString( 'wp-auth-check', $assets['scripts'] );
		$this->assertSame( 5, $restored, 'The dialog was dropped from the page it belongs on.' );
	}

	public function test_the_resolved_assets_do_not_add_a_dialog_the_screen_never_had() {
		remove_action( 'wp_print_footer_scripts', 'wp_auth_check_html', 5 );

		$this->call_private( 'get_resolved_assets', array( array() ) );

		$this->assertFalse( has_action( 'wp_print_footer_scripts', 'wp_auth_check_html' ) );
	}

	public function test_the_iframe_settings_name_the_handles_they_were_filtered_against() {
		$settings = $this->call_private( 'get_iframe_asset_settings' );

		$this->assertSame(
			$this->call_private( 'get_allowed_iframe_style_handles' ),
			$settings['allowedIframeStyleHandles']
		);
		$this->assertArrayHasKey( '__unstableResolvedAssets', $settings );
	}

	/**
	 * The screen runs in fullscreen mode, so the admin menu is gone and #wpadminbar (99999) is
	 * the only thing left to sit below. The floor matters less than it did, but stays pinned so
	 * the container cannot drop under page chrome.
	 */
	public function test_the_layout_lifts_the_editor_between_the_admin_menu_and_the_admin_bar() {
		$css = $this->call_private( 'get_layout_css' );

		preg_match( '/z-index:\s*(\d+)/', $css, $matches );

		$this->assertNotEmpty( $matches );
		$this->assertGreaterThan( 9999, (int) $matches[1] );
		$this->assertLessThan( 99999, (int) $matches[1] );
	}

	/**
	 * `wp-edit-post` carries the rule that pins this, and the screen does not enqueue it, so
	 * without one of our own the snackbar renders in flow beside the header.
	 */
	public function test_the_layout_pins_the_snackbar_over_the_canvas() {
		$css = $this->call_private( 'get_layout_css' );

		$this->assertMatchesRegularExpression(
			'/#' . Jetpack_Email_Design_Editor::HANDLE . '\s+\.components-editor-notices__snackbar\s*\{[^}]*position:\s*absolute/',
			$css
		);
		$this->assertMatchesRegularExpression( '/inset-block-end:/', $css );
	}

	public function test_the_layout_is_rtl_aware() {
		$css = $this->call_private( 'get_layout_css' );

		$this->assertStringContainsString( 'inset-inline', $css );
		$this->assertDoesNotMatchRegularExpression( '/(?<!-)\b(left|right):/', $css );
	}

	/**
	 * `wp-editor` hides the admin menu on this class. The editor also sets it from a React
	 * component, but only once the bundle has loaded and the bootstrap has answered — so without
	 * this the page spends a few seconds in the ordinary admin layout and then reflows.
	 */
	public function test_the_screen_asks_for_fullscreen_before_the_bundle_loads() {
		$this->assertStringContainsString(
			'is-fullscreen-mode',
			Jetpack_Email_Design_Editor::add_fullscreen_body_class( 'existing-class' )
		);
	}

	public function test_the_screen_actually_wires_the_fullscreen_class_up() {
		Jetpack_Email_Design_Editor::on_load();

		$this->assertNotFalse(
			has_filter( 'admin_body_class', array( 'Jetpack_Email_Design_Editor', 'add_fullscreen_body_class' ) )
		);
	}

	public function test_the_fullscreen_class_keeps_what_was_already_there() {
		$this->assertStringContainsString(
			'existing-class',
			Jetpack_Email_Design_Editor::add_fullscreen_body_class( 'existing-class' )
		);
	}

	/**
	 * The admin menu is hidden, so an inset for it would leave a gap rather than clear anything.
	 */
	public function test_the_layout_leaves_no_room_for_the_admin_menu() {
		$css = $this->call_private( 'get_layout_css' );

		$this->assertStringNotContainsString( '160px', $css );
		$this->assertStringNotContainsString( 'folded', $css );
	}

	public function test_nothing_is_enqueued_without_a_build() {
		$this->set_build( null );

		Jetpack_Email_Design_Editor::enqueue_assets();

		$this->assertFalse( wp_script_is( Jetpack_Email_Design_Editor::HANDLE, 'enqueued' ) );
		$this->assertFalse( wp_style_is( Jetpack_Email_Design_Editor::HANDLE, 'enqueued' ) );
	}

	public function test_the_bundle_and_its_screen_data_are_enqueued_from_a_build() {
		$this->set_build(
			array(
				'dependencies' => array( 'wp-blocks' ),
				'version'      => 'test-version',
			)
		);

		Jetpack_Email_Design_Editor::enqueue_assets();

		$this->assertTrue( wp_script_is( Jetpack_Email_Design_Editor::HANDLE, 'enqueued' ) );
		$this->assertTrue( wp_style_is( Jetpack_Email_Design_Editor::HANDLE, 'enqueued' ) );

		$before = wp_scripts()->get_data( Jetpack_Email_Design_Editor::HANDLE, 'before' );

		$this->assertStringContainsString( 'window.JetpackEmailDesignEditor = {', implode( "\n", (array) $before ) );
	}

	/**
	 * The stylesheet's dependencies are what lay the editor's frame out, and naming one
	 * WordPress does not register drops the whole stylesheet silently.
	 */
	public function test_every_style_dependency_is_a_handle_wordpress_registers() {
		$this->set_build(
			array(
				'dependencies' => array(),
				'version'      => 'test-version',
			)
		);

		Jetpack_Email_Design_Editor::enqueue_assets();

		$deps = wp_styles()->registered[ Jetpack_Email_Design_Editor::HANDLE ]->deps;

		$this->assertNotEmpty( $deps, 'No dependencies, so the check below asserts nothing.' );

		foreach ( $deps as $handle ) {
			$this->assertTrue( wp_style_is( $handle, 'registered' ), "$handle is not a registered style handle." );
		}
	}

	public function test_the_stylesheet_is_flipped_rather_than_supplemented_for_rtl() {
		$this->set_build(
			array(
				'dependencies' => array(),
				'version'      => 'test-version',
			)
		);

		Jetpack_Email_Design_Editor::enqueue_assets();

		$this->assertSame( 'replace', wp_styles()->get_data( Jetpack_Email_Design_Editor::HANDLE, 'rtl' ) );
	}

	public function test_the_block_editor_globals_the_bundle_expects_are_bootstrapped() {
		$this->set_build(
			array(
				'dependencies' => array(),
				'version'      => 'test-version',
			)
		);

		Jetpack_Email_Design_Editor::enqueue_assets();

		$after = implode( "\n", (array) wp_scripts()->get_data( 'wp-blocks', 'after' ) );

		$this->assertStringContainsString( 'wp.blocks.setCategories(', $after );
		$this->assertStringContainsString( 'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(', $after );
	}

	/**
	 * Let the site record, which it will not do by default.
	 *
	 * Offline mode as well as the terms: it answers both `should_enable_tracking()` and
	 * `has_agreed()` on its own, and the suite's bootstrap pins it on for every test -- at priority
	 * 100, hence this one. The status cache holds the first answer for the request, so it is
	 * dropped here and again in tear-down.
	 */
	private function allow_tracking() {
		add_filter( 'jetpack_offline_mode', '__return_false', 101 );
		\Automattic\Jetpack\Status\Cache::clear();
		Jetpack_Options::update_option( 'tos_agreed', true );
	}

	/**
	 * The arg is as hand-editable as `return` and `post_id`, and it ends up in a Tracks property.
	 *
	 * @param string $source   What the URL carried.
	 * @param string $expected What should be recorded.
	 *
	 * @dataProvider provide_sources
	 */
	#[PHPUnit\Framework\Attributes\DataProvider( 'provide_sources' )]
	public function test_the_route_is_read_from_an_allowlist( $source, $expected ) {
		$_GET['source'] = $source;

		$this->assertSame( $expected, $this->call_private( 'read_source' ) );
	}

	/**
	 * @return array
	 */
	public static function provide_sources() {
		return array(
			'the newsletter settings card' => array( 'newsletter_settings', 'newsletter_settings' ),
			'the previewer'                => array( 'preview_modal', 'preview_modal' ),
			'something invented'           => array( 'made-up', 'unknown' ),
			'a script tag'                 => array( '<script>x</script>', 'unknown' ),
			'an empty one'                 => array( '', 'admin_menu' ),
		);
	}

	/**
	 * The previewer links bare when the post is unsaved and has no id, so the menu route cannot be
	 * inferred from the absence of the other args -- only from the absence of this one.
	 */
	public function test_arriving_with_no_route_at_all_is_the_admin_menu() {
		unset( $_GET['source'] );

		$this->assertSame( 'admin_menu', $this->call_private( 'read_source' ) );
	}

	/**
	 * The screen's own event carries this from here and the bundle's events carry it from
	 * `getSiteType()`, so a platform spelled differently in one of them cannot be joined to the
	 * other half of the funnel.
	 *
	 * @param array  $constants What the platform defines.
	 * @param string $expected  The spelling `getSiteType()` uses.
	 *
	 * @dataProvider provide_platforms
	 */
	#[PHPUnit\Framework\Attributes\DataProvider( 'provide_platforms' )]
	public function test_the_platform_is_spelled_the_way_the_bundle_spells_it( $constants, $expected ) {
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}

		// Read once per request and memoised, so a default answered before this is still standing.
		\Automattic\Jetpack\Status\Cache::clear();

		$this->assertSame( $expected, $this->call_private( 'site_type' ) );
	}

	/**
	 * @return array
	 */
	public static function provide_platforms() {
		return array(
			'self-hosted' => array( array(), 'jetpack' ),
			'Simple'      => array( array( 'IS_WPCOM' => true ), 'simple' ),
			'WoA'         => array(
				array(
					'ATOMIC_SITE_ID'       => 123,
					'ATOMIC_CLIENT_ID'     => 456,
					'WPCOMSH__PLUGIN_FILE' => '/wpcomsh.php',
				),
				'woa',
			),
		);
	}

	/**
	 * These two property names and the event name are the contract with whoever reads the funnel,
	 * and nothing downstream would report a renamed one -- the series would just stop.
	 */
	public function test_the_arrival_event_carries_the_route_and_the_platform() {
		$_GET['source'] = 'preview_modal';

		$this->assertSame(
			array(
				'source'    => 'preview_modal',
				'site_type' => 'jetpack',
			),
			$this->call_private( 'screen_view_properties' )
		);
	}

	/**
	 * `record_user_event()` adds the `jetpack_` prefix, so the constant carries the rest of a name
	 * that is read by dashboards rather than by any code here.
	 */
	public function test_the_arrival_event_reaches_tracks_under_the_name_dashboards_read() {
		$this->assertSame(
			'jetpack_newsletter_email_design_view',
			'jetpack_' . Jetpack_Email_Design_Editor::VIEW_EVENT
		);
	}

	/**
	 * Tracks declines to record for a test user, so this asserts only that the call is wired up and
	 * reaches that refusal rather than an error -- the properties are covered above.
	 */
	public function test_the_arrival_is_recorded_without_raising() {
		$_GET['source'] = 'newsletter_settings';

		$sent = array();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$sent ) {
				$sent[] = $url;

				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '',
				);
			},
			10,
			3
		);

		Jetpack_Email_Design_Editor::record_screen_view();

		// Nothing left the site: the refusal happens before the pixel is built. If this ever starts
		// failing, Tracks has become testable and the properties above can be asserted on the wire.
		$this->assertSame( array(), $sent );
	}

	/**
	 * Jetpack's recorder refuses on Simple, for the same reason the gate does, so the arrival went
	 * unrecorded there until it was routed through the one WordPress.com answers.
	 *
	 * The name carries the prefix here that `record_user_event()` would otherwise add, which is the
	 * part a platform split is most likely to get wrong.
	 */
	public function test_a_simple_site_records_the_arrival_through_wordpress_com() {
		Constants::set_constant( 'IS_WPCOM', true );
		\Automattic\Jetpack\Status\Cache::clear();
		$_GET['source'] = 'preview_modal';

		$GLOBALS['jetpack_test_wpcom_tracks_events'] = array();
		require_once __DIR__ . '/../../files/mock-wpcom-record-tracks-event.php';

		Jetpack_Email_Design_Editor::record_screen_view();

		$this->assertSame(
			array(
				array(
					'jetpack_newsletter_email_design_view',
					array(
						'source'    => 'preview_modal',
						'site_type' => 'simple',
					),
				),
			),
			$GLOBALS['jetpack_test_wpcom_tracks_events']
		);
	}

	/**
	 * The pixel is a blocking request with a one-second timeout, so recorded on the load hook it
	 * would sit in front of the screen's first paint.
	 */
	public function test_the_arrival_is_recorded_after_the_response() {
		Jetpack_Email_Design_Editor::on_load();

		$this->assertNotFalse(
			has_action( 'shutdown', array( 'Jetpack_Email_Design_Editor', 'record_screen_view' ) )
		);
		$this->assertFalse(
			has_action( 'admin_enqueue_scripts', array( 'Jetpack_Email_Design_Editor', 'record_screen_view' ) )
		);
	}

	/**
	 * `Jetpack_Gutenberg` enqueues the sender for block-editor screens and dequeues it for every
	 * other one, which this is -- so without this the queue the bundle pushes onto is never
	 * drained and every event the screen records is silently lost.
	 */
	public function test_the_tracks_sender_is_enqueued_for_a_site_that_may_record() {
		$this->allow_tracking();
		$this->set_build(
			array(
				'dependencies' => array(),
				'version'      => 'test-version',
			)
		);

		Jetpack_Email_Design_Editor::enqueue_assets();

		$this->assertTrue( wp_script_is( 'jp-tracks', 'enqueued' ) );
	}

	public function test_the_tracks_sender_is_left_off_a_site_that_may_not() {
		$this->set_build(
			array(
				'dependencies' => array(),
				'version'      => 'test-version',
			)
		);

		Jetpack_Email_Design_Editor::enqueue_assets();

		$this->assertFalse( wp_script_is( 'jp-tracks', 'enqueued' ) );
	}

	/**
	 * Simple answers Jetpack's gate with no -- it asks about the terms of service and the user's
	 * connection, which a Simple site has neither of -- so gating on it recorded nothing at all on
	 * the platform the screen ships to first.
	 */
	public function test_a_simple_site_records_although_jetpack_would_not_let_it() {
		Constants::set_constant( 'IS_WPCOM', true );
		\Automattic\Jetpack\Status\Cache::clear();

		$data = $this->call_private( 'get_screen_data' );

		$this->assertTrue( $data['tracks']['canSend'] );
		$this->assertSame( get_current_blog_id(), $data['tracks']['blogId'] );
	}

	/**
	 * WordPress.com loads the sender on Simple and identifies the user with it, so an identity of
	 * ours would replace the one already on the page.
	 */
	public function test_a_simple_site_supplies_no_identity_of_its_own() {
		Constants::set_constant( 'IS_WPCOM', true );
		\Automattic\Jetpack\Status\Cache::clear();
		$this->connect_a_user();

		$data = $this->call_private( 'get_screen_data' );

		$this->assertNull( $data['tracks']['userData'] );
	}

	public function test_the_screen_data_says_a_site_that_may_not_record_should_not() {
		$data = $this->call_private( 'get_screen_data' );

		$this->assertFalse( $data['tracks']['canSend'] );
		$this->assertNull( $data['tracks']['userData'] );
	}

	/**
	 * Connect the current user, so there is an identity to narrow.
	 *
	 * @return int The local user id.
	 */
	private function connect_a_user() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $user_id );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "dummy.usertoken.$user_id" ) );
		set_transient(
			"jetpack_connected_user_data_$user_id",
			array(
				'ID'          => 777,
				'login'       => 'wpcomuser',
				'email'       => 'wpcomuser@example.com',
				'user_locale' => 'en',
			)
		);

		return $user_id;
	}

	public function test_the_screen_data_names_the_connected_user_it_records_against() {
		$this->allow_tracking();
		$this->connect_a_user();

		$data = $this->call_private( 'get_screen_data' );

		$this->assertTrue( $data['tracks']['canSend'] );
		$this->assertSame( 777, $data['tracks']['userData']['userid'] );
		$this->assertSame( 'wpcomuser', $data['tracks']['userData']['username'] );
	}

	/**
	 * `get_connected_user_tracks_identity()` also returns the creator's email address and locale,
	 * and this blob is printed into the page's HTML.
	 */
	public function test_the_screen_data_carries_no_identity_beyond_what_records_an_event() {
		$this->allow_tracking();
		$this->connect_a_user();

		$data = $this->call_private( 'get_screen_data' );

		$this->assertSame( array( 'canSend', 'userData', 'blogId' ), array_keys( $data['tracks'] ) );
		$this->assertSame( array( 'userid', 'username' ), array_keys( $data['tracks']['userData'] ) );
		$this->assertStringNotContainsString(
			'wpcomuser@example.com',
			wp_json_encode( $data, Jetpack_Email_Design_Editor::JSON_FLAGS )
		);
	}
}
