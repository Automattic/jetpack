<?php
/**
 * Tests for the newsletter email design screen (NL-839).
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversClass;

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
	 * A snapshot of the admin menu globals, which add_theme_page() appends to.
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
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->asset_path    = JETPACK__PLUGIN_DIR . '_inc/build/email-design-editor.asset.php';
		$this->menu_snapshot = array( $GLOBALS['menu'] ?? array(), $GLOBALS['submenu'] ?? array() );

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

		list( $GLOBALS['menu'], $GLOBALS['submenu'] )         = $this->menu_snapshot;
		list( $GLOBALS['wp_scripts'], $GLOBALS['wp_styles'] ) = $this->asset_registries;

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
			array( 'elementId', 'editorSettings', 'urls', 'userEmail' ),
			array_keys( $data )
		);
	}

	public function test_the_screen_data_describes_this_installation() {
		$user = wp_get_current_user();
		$data = $this->call_private( 'get_screen_data' );

		$this->assertSame( admin_url( 'themes.php' ), $data['urls']['back'] );
		$this->assertSame( admin_url( 'themes.php' ), $data['urls']['listings'] );
		$this->assertSame( $user->user_email, $data['userEmail'] );
	}

	public function test_the_allowed_iframe_handles_start_from_the_editor_stylesheets() {
		$handles = $this->call_private( 'get_allowed_iframe_style_handles' );

		$this->assertContains( 'wp-components-css', $handles );
		$this->assertContains( 'wp-block-library-css', $handles );
		$this->assertContains( 'wp-block-editor-content-css', $handles );
		$this->assertContains( 'wp-edit-blocks-css', $handles );
	}

	public function test_a_block_declaring_email_support_keeps_its_stylesheet() {
		register_block_type(
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

		unregister_block_type( 'jetpack-test/email-block' );
	}

	public function test_a_block_without_email_support_does_not() {
		register_block_type(
			'jetpack-test/ordinary-block',
			array(
				'supports'      => array( 'align' => true ),
				'style_handles' => array( 'jetpack-test-ordinary-style' ),
			)
		);

		$handles = $this->call_private( 'get_allowed_iframe_style_handles' );

		$this->assertNotContains( 'jetpack-test-ordinary-style-css', $handles );

		unregister_block_type( 'jetpack-test/ordinary-block' );
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

	public function test_the_iframe_settings_name_the_handles_they_were_filtered_against() {
		$settings = $this->call_private( 'get_iframe_asset_settings' );

		$this->assertSame(
			$this->call_private( 'get_allowed_iframe_style_handles' ),
			$settings['allowedIframeStyleHandles']
		);
		$this->assertArrayHasKey( '__unstableResolvedAssets', $settings );
	}

	/**
	 * The editor paints notices and popovers against the viewport, so below #adminmenuwrap
	 * (9990) they land behind the admin menu, and above #wpadminbar (100000) they cover it.
	 */
	public function test_the_layout_lifts_the_editor_between_the_admin_menu_and_the_admin_bar() {
		$css = $this->call_private( 'get_layout_css' );

		preg_match( '/z-index:\s*(\d+)/', $css, $matches );

		$this->assertNotEmpty( $matches );
		$this->assertGreaterThan( 9990, (int) $matches[1] );
		$this->assertLessThan( 100000, (int) $matches[1] );
	}

	public function test_the_layout_is_rtl_aware() {
		$css = $this->call_private( 'get_layout_css' );

		$this->assertStringContainsString( 'inset-inline', $css );
		$this->assertDoesNotMatchRegularExpression( '/(?<!-)\b(left|right):/', $css );
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
}
