<?php
/**
 * Unit Tests for Form_Editor.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Editor;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Screen;

/**
 * Test class for Form_Editor
 *
 * @covers Automattic\Jetpack\Forms\Editor\Form_Editor
 */
#[CoversClass( Form_Editor::class )]
class Form_Editor_Test extends BaseTestCase {

	/**
	 * IDs the stubbed form query should return.
	 *
	 * @var int[]
	 */
	private $stub_form_ids = array();

	/**
	 * Query vars the eligibility check asked for, captured by the stub.
	 *
	 * @var array|null
	 */
	private $captured_query_vars = null;

	/**
	 * The eligibility check queries for the user's own forms. WorDBless has no
	 * real database behind WP_Query, so the query is short-circuited and its
	 * arguments asserted instead.
	 */
	protected function set_up() {
		parent::set_up();
		Contact_Form::register_post_type();
		$this->stub_form_ids       = array();
		$this->captured_query_vars = null;
		add_filter( 'posts_pre_query', array( $this, 'stub_form_query' ), 10, 2 );
	}

	/**
	 * Undo the registration and clear anything left behind.
	 */
	protected function tear_down() {
		remove_filter( 'posts_pre_query', array( $this, 'stub_form_query' ), 10 );
		unregister_post_type( Contact_Form::POST_TYPE );
		parent::tear_down();
	}

	/**
	 * Short-circuits the form lookup, recording what it was asked for.
	 *
	 * `posts_pre_query` runs regardless of `suppress_filters`, which get_posts()
	 * sets by default.
	 *
	 * @param array|null $posts Posts to return, or null to run the real query.
	 * @param \WP_Query  $query The query being run.
	 * @return array|null
	 */
	public function stub_form_query( $posts, $query ) {
		if ( Contact_Form::POST_TYPE !== ( $query->query_vars['post_type'] ?? '' ) ) {
			return $posts;
		}

		$this->captured_query_vars = $query->query_vars;

		return $this->stub_form_ids;
	}

	/**
	 * Test that init() registers the expected hooks.
	 */
	public function test_init_registers_hooks() {
		// Remove any existing hooks first to ensure a clean state
		remove_all_filters( 'allowed_block_types_all' );
		remove_all_filters( 'block_editor_settings_all' );
		remove_all_actions( 'admin_enqueue_scripts' );

		// Initialize the form editor
		Form_Editor::init();

		// Verify the filter is registered
		$this->assertNotFalse(
			has_filter( 'allowed_block_types_all', array( Form_Editor::class, 'allowed_blocks_for_jetpack_form' ) ),
			'allowed_block_types_all filter should be registered'
		);

		$this->assertNotFalse(
			has_filter( 'block_editor_settings_all', array( Form_Editor::class, 'block_editor_settings_all' ) ),
			'block_editor_settings_all filter should be registered'
		);

		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( Form_Editor::class, 'enqueue_admin_scripts' ) ),
			'admin_enqueue_scripts action should be registered'
		);

		// Clean up
		remove_all_filters( 'allowed_block_types_all' );
		remove_all_filters( 'block_editor_settings_all' );
		remove_all_actions( 'admin_enqueue_scripts' );
	}

	/**
	 * Test that allowed_blocks_for_jetpack_form returns the restricted block list
	 * when editing a jetpack-form post type.
	 */
	public function test_allowed_blocks_for_jetpack_form_restricts_blocks() {
		// Create a mock post with jetpack-form post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => Contact_Form::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => 'Test Form',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Call the method with an array of allowed blocks (default WordPress behavior)
		$allowed_blocks = array( 'core/paragraph', 'core/heading', 'jetpack/contact-form' );
		$result         = Form_Editor::allowed_blocks_for_jetpack_form( $allowed_blocks, $editor_context );

		// Verify that the result is an array
		$this->assertIsArray( $result, 'Result should be an array of allowed blocks' );

		// Verify that specific field blocks are in the allowed list
		$this->assertContains( 'jetpack/field-name', $result, 'Field name block should be allowed' );
		$this->assertContains( 'jetpack/field-email', $result, 'Field email block should be allowed' );
		$this->assertContains( 'jetpack/field-textarea', $result, 'Field textarea block should be allowed' );
		$this->assertContains( 'jetpack/button', $result, 'Button block should be allowed' );

		// Verify that core blocks are in the allowed list
		$this->assertContains( 'core/paragraph', $result, 'Paragraph block should be allowed' );
		$this->assertContains( 'core/heading', $result, 'Heading block should be allowed' );
		$this->assertContains( 'core/accordion', $result, 'Accordion block should be allowed' );
		$this->assertContains( 'core/details', $result, 'Details block should be allowed' );
		$this->assertContains( 'core/icon', $result, 'Icon block should be allowed' );

		// Verify that contact-form block is NOT in the list (handled by DOM manipulation)
		$this->assertNotContains( 'jetpack/contact-form', $result, 'Contact form block should not be in the allowed list' );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that allowed_blocks_for_jetpack_form returns the original allowed blocks
	 * when editing a different post type.
	 */
	public function test_allowed_blocks_for_jetpack_form_returns_original_for_other_post_types() {
		// Create a mock post with a different post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Test Post',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Call the method with an array of allowed blocks
		$allowed_blocks = array( 'core/paragraph', 'core/heading' );
		$result         = Form_Editor::allowed_blocks_for_jetpack_form( $allowed_blocks, $editor_context );

		// Verify that the result is the same as the input
		$this->assertEquals( $allowed_blocks, $result, 'Should return original allowed blocks for non-jetpack-form post types' );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that allowed_blocks_for_jetpack_form returns the original value
	 * when allowed_block_types is true (all blocks allowed).
	 */
	public function test_allowed_blocks_for_jetpack_form_with_boolean_true() {
		// Create a mock post with jetpack-form post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => Contact_Form::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => 'Test Form',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Call the method with true (all blocks allowed)
		$result = Form_Editor::allowed_blocks_for_jetpack_form( true, $editor_context );

		// Verify that the result is an array (the restricted list)
		$this->assertIsArray( $result, 'Should return restricted block array even when input is true' );
		$this->assertContains( 'jetpack/field-name', $result, 'Field name block should be in the restricted list' );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that allowed_blocks_for_jetpack_form handles missing editor context gracefully.
	 */
	public function test_allowed_blocks_for_jetpack_form_without_post() {
		// Create editor context without post
		$editor_context = new \stdClass();

		// Call the method
		$allowed_blocks = array( 'core/paragraph', 'core/heading' );
		$result         = Form_Editor::allowed_blocks_for_jetpack_form( $allowed_blocks, $editor_context );

		// Verify that the result is the same as the input (no restrictions applied)
		$this->assertEquals( $allowed_blocks, $result, 'Should return original allowed blocks when post is not set' );
	}

	/**
	 * Test that block_editor_settings_all disables block locking for jetpack-form posts.
	 */
	public function test_block_editor_settings_all_disables_locking() {
		// Create a mock post with jetpack-form post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => Contact_Form::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => 'Test Form',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Call the method with default settings
		$settings = array(
			'canLockBlocks' => true,
			'otherSetting'  => 'value',
		);
		$result   = Form_Editor::block_editor_settings_all( $settings, $editor_context );

		// Verify that canLockBlocks is set to false
		$this->assertFalse( $result['canLockBlocks'], 'canLockBlocks should be false for jetpack-form posts' );

		// Verify that other settings are preserved
		$this->assertEquals( 'value', $result['otherSetting'], 'Other settings should be preserved' );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that block_editor_settings_all returns original settings for other post types.
	 */
	public function test_block_editor_settings_all_returns_original_for_other_post_types() {
		// Create a mock post with a different post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Test Post',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Call the method with default settings
		$settings = array(
			'canLockBlocks' => true,
			'otherSetting'  => 'value',
		);
		$result   = Form_Editor::block_editor_settings_all( $settings, $editor_context );

		// Verify that the result is the same as the input
		$this->assertEquals( $settings, $result, 'Should return original settings for non-jetpack-form post types' );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test that block_editor_settings_all handles missing editor context gracefully.
	 */
	public function test_block_editor_settings_all_without_post() {
		// Create editor context without post
		$editor_context = new \stdClass();

		// Call the method
		$settings = array(
			'canLockBlocks' => true,
			'otherSetting'  => 'value',
		);
		$result   = Form_Editor::block_editor_settings_all( $settings, $editor_context );

		// Verify that the result is the same as the input
		$this->assertEquals( $settings, $result, 'Should return original settings when post is not set' );
	}

	/**
	 * Test that enqueue_admin_scripts enqueues the script in block editor context.
	 */
	public function test_enqueue_admin_scripts_in_block_editor() {
		global $wp_scripts;

		if ( ! file_exists( __DIR__ . '/../../../dist/form-editor/jetpack-form-editor.asset.php' ) ) {
			// Skip the test if the asset file does not exist to avoid false positives
			$this->markTestSkipped( 'Asset file does not exist; skipping enqueue test to avoid false positives.' );
		}

		// Create a mock screen for block editor
		$screen                  = WP_Screen::get( 'post' );
		$screen->is_block_editor = true;
		set_current_screen( $screen );

		// Reset wp_scripts to ensure clean state
		$wp_scripts = null;
		wp_scripts();

		// Call the method
		Form_Editor::enqueue_admin_scripts();

		// Verify that the script is enqueued
		$this->assertTrue(
			wp_script_is( Form_Editor::SCRIPT_HANDLE, 'enqueued' ),
			'Form editor script should be enqueued in block editor context'
		);

		// Clean up
		set_current_screen( 'front' );
		wp_deregister_script( Form_Editor::SCRIPT_HANDLE );
	}

	/**
	 * Test that enqueue_admin_scripts does NOT enqueue the script in site editor.
	 */
	public function test_enqueue_admin_scripts_not_in_site_editor() {
		global $wp_scripts;

		// Create a mock screen for site editor
		$screen                  = WP_Screen::get( 'site-editor' );
		$screen->is_block_editor = true;
		set_current_screen( $screen );

		// Reset wp_scripts to ensure clean state
		$wp_scripts = null;
		wp_scripts();

		// Call the method
		Form_Editor::enqueue_admin_scripts();

		// Verify that the script is NOT enqueued
		$this->assertFalse(
			wp_script_is( Form_Editor::SCRIPT_HANDLE, 'enqueued' ),
			'Form editor script should not be enqueued in site editor'
		);

		// Clean up
		set_current_screen( 'front' );
	}

	/**
	 * Test that enqueue_admin_scripts does NOT enqueue the script in non-block editor context.
	 */
	public function test_enqueue_admin_scripts_not_in_non_block_editor() {
		global $wp_scripts;

		// Create a mock screen for non-block editor (classic editor)
		$screen                  = WP_Screen::get( 'post' );
		$screen->is_block_editor = false;
		set_current_screen( $screen );

		// Reset wp_scripts to ensure clean state
		$wp_scripts = null;
		wp_scripts();

		// Call the method
		Form_Editor::enqueue_admin_scripts();

		// Verify that the script is NOT enqueued
		$this->assertFalse(
			wp_script_is( Form_Editor::SCRIPT_HANDLE, 'enqueued' ),
			'Form editor script should not be enqueued in non-block editor context'
		);

		// Clean up
		set_current_screen( 'front' );
	}

	/**
	 * Test that enqueue_admin_scripts handles null screen gracefully.
	 */
	public function test_enqueue_admin_scripts_with_null_screen() {
		global $wp_scripts, $current_screen;

		// Set current screen to null directly
		$current_screen = null;

		// Reset wp_scripts to ensure clean state
		$wp_scripts = null;
		wp_scripts();

		// Call the method - should not throw an error
		Form_Editor::enqueue_admin_scripts();

		// Verify that the script is NOT enqueued
		$this->assertFalse(
			wp_script_is( Form_Editor::SCRIPT_HANDLE, 'enqueued' ),
			'Form editor script should not be enqueued when screen is null'
		);

		// Clean up
		set_current_screen( 'front' );
	}

	/**
	 * Test that the allowed blocks list includes all expected block types.
	 */
	public function test_allowed_blocks_list_completeness() {
		// Create a mock post with jetpack-form post type
		$post_id = wp_insert_post(
			array(
				'post_type'   => Contact_Form::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => 'Test Form',
			)
		);
		$post    = get_post( $post_id );

		// Create editor context
		$editor_context       = new \stdClass();
		$editor_context->post = $post;

		// Get the allowed blocks
		$result = Form_Editor::allowed_blocks_for_jetpack_form( array(), $editor_context );

		// Expected blocks - field blocks
		$expected_field_blocks = array(
			'jetpack/field-name',
			'jetpack/field-email',
			'jetpack/field-url',
			'jetpack/field-telephone',
			'jetpack/field-textarea',
			'jetpack/field-checkbox',
			'jetpack/field-checkbox-multiple',
			'jetpack/field-radio',
			'jetpack/field-select',
			'jetpack/field-date',
			'jetpack/field-consent',
			'jetpack/field-rating',
			'jetpack/field-text',
			'jetpack/field-number',
			'jetpack/field-hidden',
			'jetpack/field-file',
			'jetpack/field-time',
			'jetpack/field-slider',
			'jetpack/field-image-select',
		);

		// Expected blocks - supporting blocks
		$expected_supporting_blocks = array(
			'jetpack/button',
			'jetpack/label',
			'jetpack/input',
			'jetpack/options',
			'jetpack/option',
			'jetpack/phone-input',
			'jetpack/dropzone',
			'jetpack/input-range',
			'jetpack/input-rating',
			'jetpack/fieldset-image-options',
			'jetpack/input-image-option',
		);

		// Expected blocks - multistep blocks
		$expected_multistep_blocks = array(
			'jetpack/form-step',
			'jetpack/form-step-container',
			'jetpack/form-step-divider',
			'jetpack/form-step-navigation',
			'jetpack/form-progress-indicator',
		);

		// Expected blocks - core blocks
		$expected_core_blocks = array(
			'core/accordion',
			'core/audio',
			'core/button',
			'core/code',
			'core/column',
			'core/columns',
			'core/details',
			'core/group',
			'core/heading',
			'core/html',
			'core/icon',
			'core/image',
			'core/list',
			'core/list-item',
			'core/math',
			'core/paragraph',
			'core/row',
			'core/separator',
			'core/spacer',
			'core/stack',
			'core/subhead',
			'core/video',
		);

		// Verify all expected blocks are present
		foreach ( $expected_field_blocks as $block ) {
			$this->assertContains( $block, $result, "Field block $block should be in allowed list" );
		}

		foreach ( $expected_supporting_blocks as $block ) {
			$this->assertContains( $block, $result, "Supporting block $block should be in allowed list" );
		}

		foreach ( $expected_multistep_blocks as $block ) {
			$this->assertContains( $block, $result, "Multistep block $block should be in allowed list" );
		}

		foreach ( $expected_core_blocks as $block ) {
			$this->assertContains( $block, $result, "Core block $block should be in allowed list" );
		}

		// Clean up
		wp_delete_post( $post_id, true );
	}

	/**
	 * Invokes one of the class's private static helpers.
	 *
	 * @param string $method Method name.
	 * @param array  $args   Arguments to pass.
	 * @return mixed The method's return value.
	 */
	private function call_private( $method, array $args = array() ) {
		$ref = new \ReflectionMethod( Form_Editor::class, $method );
		if ( PHP_VERSION_ID < 80100 ) {
			// No-op since 8.1 and deprecated in 8.5, but required before that.
			$ref->setAccessible( true );
		}

		return $ref->invokeArgs( null, $args );
	}

	/**
	 * Creates a user and makes them the current one.
	 *
	 * @return int The new user's ID.
	 */
	private function log_in_new_user() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'guide_user_' . wp_rand( 1000, 999999 ),
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * A user who has never dismissed the core welcome modal is new to the block
	 * editor, so the guide stands in for it.
	 */
	public function test_eligible_when_core_welcome_modal_never_dismissed() {
		$this->log_in_new_user();
		$this->stub_form_ids = array( 1234 );

		$this->assertTrue(
			$this->call_private( 'is_welcome_guide_eligible', array( array() ) ),
			'No stored core preference should count as a newcomer'
		);
		$this->assertTrue(
			$this->call_private(
				'is_welcome_guide_eligible',
				array( array( 'core/edit-post' => array( 'welcomeGuide' => true ) ) )
			),
			'An explicitly pending core modal should count as a newcomer'
		);
	}

	/**
	 * Someone experienced with the block editor still gets the guide until they
	 * have a form of their own.
	 */
	public function test_eligible_for_experienced_user_without_forms() {
		$this->log_in_new_user();
		$this->stub_form_ids = array();

		$this->assertTrue(
			$this->call_private(
				'is_welcome_guide_eligible',
				array( array( 'core/edit-post' => array( 'welcomeGuide' => false ) ) )
			)
		);
	}

	/**
	 * Experienced and already owns a form: this is the one combination that
	 * does not get the guide.
	 */
	public function test_not_eligible_for_experienced_user_with_a_form() {
		$this->log_in_new_user();
		$this->stub_form_ids = array( 1234 );

		$this->assertFalse(
			$this->call_private(
				'is_welcome_guide_eligible',
				array( array( 'core/edit-post' => array( 'welcomeGuide' => false ) ) )
			)
		);
	}

	/**
	 * The lookup asks only for this user's forms, one row, IDs only.
	 */
	public function test_form_lookup_is_scoped_to_the_current_user() {
		$user_id = $this->log_in_new_user();

		$this->call_private(
			'is_welcome_guide_eligible',
			array( array( 'core/edit-post' => array( 'welcomeGuide' => false ) ) )
		);

		$this->assertNotNull( $this->captured_query_vars, 'The eligibility check should query for forms' );
		$query_vars = (array) $this->captured_query_vars;

		$this->assertSame( $user_id, (int) $query_vars['author'] );
		$this->assertSame( Contact_Form::POST_TYPE, $query_vars['post_type'] );
		$this->assertSame( 'ids', $query_vars['fields'] );
		$this->assertSame( 1, (int) $query_vars['posts_per_page'] );
	}

	/**
	 * Opening post-new.php creates an auto-draft before the enqueue runs, so
	 * counting it would hide the guide from the first-time author it is for.
	 * Every other status counts, including trashed forms.
	 */
	public function test_form_lookup_counts_every_status_except_auto_draft() {
		$this->log_in_new_user();

		$this->call_private(
			'is_welcome_guide_eligible',
			array( array( 'core/edit-post' => array( 'welcomeGuide' => false ) ) )
		);

		$this->assertNotNull( $this->captured_query_vars, 'The eligibility check should query for forms' );
		$query_vars = (array) $this->captured_query_vars;
		$statuses   = $query_vars['post_status'];

		$this->assertIsArray( $statuses );
		$this->assertNotContains( 'auto-draft', $statuses, 'auto-draft must not count as owning a form' );

		foreach ( array( 'publish', 'draft', 'private', 'pending', 'trash' ) as $status ) {
			$this->assertContains( $status, $statuses, "$status should count as owning a form" );
		}
	}

	/**
	 * A newcomer is eligible without the lookup running at all.
	 */
	public function test_newcomer_short_circuits_before_querying_for_forms() {
		$this->log_in_new_user();
		$this->stub_form_ids = array( 1234 );

		$this->assertTrue( $this->call_private( 'is_welcome_guide_eligible', array( array() ) ) );
		$this->assertNull( $this->captured_query_vars, 'A newcomer should not need the form lookup' );
	}

	/**
	 * Logged-out requests are never eligible.
	 */
	public function test_not_eligible_when_logged_out() {
		wp_set_current_user( 0 );

		$this->assertFalse( $this->call_private( 'is_welcome_guide_eligible', array( array() ) ) );
	}

	/**
	 * Only an explicit false counts as a dismissal.
	 */
	public function test_is_welcome_guide_dismissed() {
		$this->assertFalse( $this->call_private( 'is_welcome_guide_dismissed', array( array() ) ) );
		$this->assertFalse(
			$this->call_private(
				'is_welcome_guide_dismissed',
				array( array( 'jetpack/forms' => array( 'welcomeGuide' => true ) ) )
			)
		);
		$this->assertTrue(
			$this->call_private(
				'is_welcome_guide_dismissed',
				array( array( 'jetpack/forms' => array( 'welcomeGuide' => false ) ) )
			)
		);
	}

	/**
	 * Preferences come back as an array even when nothing is stored.
	 */
	public function test_get_persisted_preferences_defaults_to_an_array() {
		$user_id = $this->log_in_new_user();

		$this->assertSame( array(), $this->call_private( 'get_persisted_preferences' ) );

		$this->seed_preferences( $user_id, array( 'jetpack/forms' => array( 'welcomeGuide' => false ) ) );
		$this->assertSame(
			array( 'jetpack/forms' => array( 'welcomeGuide' => false ) ),
			$this->call_private( 'get_persisted_preferences' )
		);

		wp_set_current_user( 0 );
		$this->assertSame( array(), $this->call_private( 'get_persisted_preferences' ) );
	}

	/**
	 * Core stores the block editor's preferences under a blog-prefixed meta key
	 * — wp_register_persisted_preferences_meta() builds it as
	 * $wpdb->get_blog_prefix() . 'persisted_preferences' — so the literal
	 * wp_persisted_preferences only happens to be right on a single site using
	 * the default table prefix. Anywhere else (a multisite subsite, or a custom
	 * $table_prefix) the read comes back empty, dismissal never registers, and
	 * every user looks eligible forever.
	 */
	public function test_preferences_are_read_from_the_blog_prefixed_meta_key() {
		global $wpdb;

		$user_id         = $this->log_in_new_user();
		$original_prefix = $wpdb->base_prefix;
		$preferences     = array( 'jetpack/forms' => array( 'welcomeGuide' => false ) );

		$wpdb->set_prefix( 'jptest_' );

		try {
			update_user_meta( $user_id, $wpdb->get_blog_prefix() . 'persisted_preferences', $preferences );

			$this->assertSame(
				$preferences,
				$this->call_private( 'get_persisted_preferences' ),
				'Preferences should be read from the blog-prefixed key, not a hardcoded wp_ one'
			);
		} finally {
			$wpdb->set_prefix( $original_prefix );
		}
	}

	/**
	 * Other post types never get the guide, which is what keeps it away from the
	 * in-editor navigation path. The post type check runs before the enqueue
	 * reaches for the built bundle, so this holds whether or not dist/ exists.
	 */
	public function test_welcome_guide_enqueue_bails_outside_the_form_editor() {
		$this->log_in_new_user();
		$this->stub_form_ids = array();

		$screen                  = WP_Screen::get( 'post' );
		$screen->is_block_editor = true;
		set_current_screen( $screen );

		global $wp_scripts;
		$wp_scripts = null;
		wp_scripts();

		$this->call_private( 'enqueue_welcome_guide' );

		$this->assertFalse( wp_script_is( Form_Editor::WELCOME_GUIDE_SCRIPT_HANDLE, 'enqueued' ) );

		$this->clean_up_enqueue();
	}

	/**
	 * The inline script the guide bundle reads its flags from.
	 *
	 * @return string The concatenated inline script, or an empty string.
	 */
	private function inline_guide_script() {
		$inline = wp_scripts()->get_data( Form_Editor::WELCOME_GUIDE_SCRIPT_HANDLE, 'before' );

		return is_array( $inline ) ? implode( '', $inline ) : (string) $inline;
	}

	/**
	 * Stores preferences under the key core actually uses on this install.
	 *
	 * @param int   $user_id     The user to store them for.
	 * @param array $preferences The preference blob.
	 */
	private function seed_preferences( $user_id, array $preferences ) {
		global $wpdb;

		update_user_meta( $user_id, $wpdb->get_blog_prefix() . 'persisted_preferences', $preferences );
	}

	/**
	 * Puts the current screen in the form editor.
	 *
	 * @return \WP_Screen The screen that was set.
	 */
	private function set_form_editor_screen() {
		$screen                  = WP_Screen::get( Contact_Form::POST_TYPE );
		$screen->is_block_editor = true;
		set_current_screen( $screen );

		return $screen;
	}

	/**
	 * Runs the enqueue with a clean script registry.
	 */
	private function run_enqueue() {
		global $wp_scripts;

		$wp_scripts = null;
		wp_scripts();

		Form_Editor::enqueue_admin_scripts();
	}

	/**
	 * Clears everything the enqueue tests touch.
	 */
	private function clean_up_enqueue() {
		set_current_screen( 'front' );
		wp_deregister_script( Form_Editor::SCRIPT_HANDLE );
		wp_deregister_script( Form_Editor::WELCOME_GUIDE_SCRIPT_HANDLE );
	}

	/**
	 * Skips when the guide bundle has not been built, matching the other
	 * enqueue tests here.
	 */
	private function skip_without_guide_asset() {
		if ( ! file_exists( __DIR__ . '/../../../dist/form-editor/jetpack-form-welcome-guide.asset.php' ) ) {
			$this->markTestSkipped( 'Welcome guide asset file does not exist; skipping enqueue test.' );
		}
	}

	/**
	 * A user the guide is meant for gets the bundle, along with the flag the
	 * script reads.
	 */
	public function test_welcome_guide_is_enqueued_for_an_eligible_user() {
		$this->skip_without_guide_asset();
		$this->log_in_new_user();
		$this->stub_form_ids = array();

		$this->set_form_editor_screen();
		$this->run_enqueue();

		$this->assertTrue(
			wp_script_is( Form_Editor::WELCOME_GUIDE_SCRIPT_HANDLE, 'enqueued' ),
			'The guide should load for a user it is meant for'
		);

		$inline = wp_scripts()->get_data( Form_Editor::WELCOME_GUIDE_SCRIPT_HANDLE, 'before' );
		$this->assertStringContainsString(
			'"isEligible":true',
			is_array( $inline ) ? implode( '', $inline ) : (string) $inline,
			'The eligibility flag should be printed for the script to read'
		);

		$this->clean_up_enqueue();
	}

	/**
	 * The shim that claims the Options menu item has to be there in every
	 * state, so an experienced user who already owns a form still gets it —
	 * they just get `isEligible: false` and it never opens on its own.
	 */
	public function test_welcome_guide_is_enqueued_for_an_ineligible_user() {
		$this->skip_without_guide_asset();
		$user_id             = $this->log_in_new_user();
		$this->stub_form_ids = array( 1234 );
		$this->seed_preferences( $user_id, array( 'core/edit-post' => array( 'welcomeGuide' => false ) ) );

		$this->set_form_editor_screen();
		$this->run_enqueue();

		$this->assertTrue( wp_script_is( Form_Editor::WELCOME_GUIDE_SCRIPT_HANDLE, 'enqueued' ) );
		$this->assertStringContainsString( '"isEligible":false', $this->inline_guide_script() );

		$this->clean_up_enqueue();
	}

	/**
	 * Once dismissed the guide never opens on its own, but the bundle still
	 * loads — without it, core's "Welcome Guide" item would go unclaimed and
	 * bring back the generic modal this guide replaces.
	 */
	public function test_welcome_guide_is_enqueued_once_dismissed() {
		$this->skip_without_guide_asset();
		$user_id             = $this->log_in_new_user();
		$this->stub_form_ids = array();
		$this->seed_preferences( $user_id, array( 'jetpack/forms' => array( 'welcomeGuide' => false ) ) );

		$this->set_form_editor_screen();
		$this->run_enqueue();

		$this->assertTrue( wp_script_is( Form_Editor::WELCOME_GUIDE_SCRIPT_HANDLE, 'enqueued' ) );
		$this->assertStringContainsString(
			'"isEligible":false',
			$this->inline_guide_script(),
			'A dismissed user is reported ineligible without the form lookup running'
		);
		$this->assertNull(
			$this->captured_query_vars,
			'Eligibility cannot change the outcome once dismissed, so it should not be queried'
		);

		$this->clean_up_enqueue();
	}

	/**
	 * Other post types get the editor bundle but never the guide, which is what
	 * keeps it away from the in-editor navigation path.
	 */
	public function test_welcome_guide_is_not_enqueued_outside_the_form_editor() {
		$this->skip_without_guide_asset();
		$this->log_in_new_user();
		$this->stub_form_ids = array();

		$screen                  = WP_Screen::get( 'post' );
		$screen->is_block_editor = true;
		set_current_screen( $screen );
		$this->run_enqueue();

		$this->assertFalse( wp_script_is( Form_Editor::WELCOME_GUIDE_SCRIPT_HANDLE, 'enqueued' ) );

		$this->clean_up_enqueue();
	}

	/**
	 * Only a stored true counts as the user asking for a guide.
	 *
	 * Core's own default is true as well but is never written to the blob, so
	 * an unstored value must not be read as a request — that would open the
	 * guide for every newcomer on a path meant for someone who chose it.
	 */
	public function test_is_core_welcome_guide_pending() {
		$this->assertFalse(
			$this->call_private( 'is_core_welcome_guide_pending', array( array() ) ),
			'Nothing stored is core’s default, not a request'
		);
		$this->assertFalse(
			$this->call_private(
				'is_core_welcome_guide_pending',
				array( array( 'core/edit-post' => array( 'welcomeGuide' => false ) ) )
			),
			'A dismissed core modal is not pending'
		);
		$this->assertTrue(
			$this->call_private(
				'is_core_welcome_guide_pending',
				array( array( 'core/edit-post' => array( 'welcomeGuide' => true ) ) )
			),
			'A stored true is the user having chosen core’s Welcome Guide'
		);
	}

	/**
	 * The pending flag reaches the page, so the script can act on it.
	 */
	public function test_welcome_guide_ships_the_core_pending_flag() {
		$this->skip_without_guide_asset();
		$user_id = $this->log_in_new_user();
		$this->seed_preferences(
			$user_id,
			array( 'core/edit-post' => array( 'welcomeGuide' => true ) )
		);

		$this->set_form_editor_screen();
		$this->run_enqueue();

		$inline = wp_scripts()->get_data( Form_Editor::WELCOME_GUIDE_SCRIPT_HANDLE, 'before' );
		$this->assertStringContainsString(
			'"isCoreGuidePending":true',
			is_array( $inline ) ? implode( '', $inline ) : (string) $inline
		);

		$this->clean_up_enqueue();
	}

	/**
	 * A missing editor bundle must not take the guide down with it: the two
	 * ship as separate entries and only one of them is absent.
	 */
	public function test_welcome_guide_survives_a_missing_editor_asset() {
		$this->skip_without_guide_asset();
		$this->log_in_new_user();
		$this->stub_form_ids = array();

		$this->set_form_editor_screen();
		$this->run_enqueue();

		$this->assertTrue(
			wp_script_is( Form_Editor::WELCOME_GUIDE_SCRIPT_HANDLE, 'enqueued' ),
			'The guide should enqueue independently of the editor bundle'
		);

		$this->clean_up_enqueue();
	}
}
