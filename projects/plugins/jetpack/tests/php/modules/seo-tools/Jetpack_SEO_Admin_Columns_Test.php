<?php
/**
 * Class Jetpack_SEO_Admin_Columns_Test.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-posts.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-admin-columns.php';

/**
 * Tests for the read-only SEO columns on the wp-admin post-list tables.
 */
class Jetpack_SEO_Admin_Columns_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Capture the echoed output of render_column().
	 *
	 * @param string $column  Column id.
	 * @param int    $post_id Post id.
	 * @return string
	 */
	private function render( $column, $post_id ) {
		ob_start();
		Jetpack_SEO_Admin_Columns::render_column( $column, $post_id );
		return (string) ob_get_clean();
	}

	/**
	 * The three SEO columns are inserted immediately after the title column,
	 * preserving the surrounding column order.
	 */
	public function test_add_columns_inserts_after_title() {
		$columns = array(
			'cb'    => '<input type="checkbox" />',
			'title' => 'Title',
			'date'  => 'Date',
		);

		$this->assertSame(
			array( 'cb', 'title', 'jetpack_seo_schema', 'jetpack_seo_description', 'jetpack_seo_search', 'date' ),
			array_keys( Jetpack_SEO_Admin_Columns::add_columns( $columns ) )
		);
	}

	/**
	 * The Schema column renders the type label, or an em dash when no override
	 * is set.
	 */
	public function test_render_schema_column() {
		$post_id = self::factory()->post->create();
		$this->assertSame( '—', $this->render( 'jetpack_seo_schema', $post_id ) );

		update_post_meta( $post_id, Jetpack_SEO_Posts::SCHEMA_TYPE_META_KEY, 'article' );
		$this->assertSame( 'Article', $this->render( 'jetpack_seo_schema', $post_id ) );
	}

	/**
	 * The Meta description column reports set / not-set state.
	 */
	public function test_render_description_column() {
		$post_id = self::factory()->post->create();

		$unset = $this->render( 'jetpack_seo_description', $post_id );
		$this->assertStringContainsString( 'Not set', $unset );

		update_post_meta( $post_id, Jetpack_SEO_Posts::DESCRIPTION_META_KEY, 'A meta description.' );
		$set = $this->render( 'jetpack_seo_description', $post_id );
		$this->assertStringContainsString( 'Set', $set );
		$this->assertStringNotContainsString( 'Not set', $set );
	}

	/**
	 * The Search column reports visibility, flipping to Hidden when the post is
	 * marked noindex.
	 */
	public function test_render_search_column() {
		$post_id = self::factory()->post->create();
		$this->assertStringContainsString( 'Visible', $this->render( 'jetpack_seo_search', $post_id ) );

		update_post_meta( $post_id, Jetpack_SEO_Posts::NOINDEX_META_KEY, '1' );
		$this->assertStringContainsString( 'Hidden', $this->render( 'jetpack_seo_search', $post_id ) );
	}

	/**
	 * On a post-list screen the three SEO columns are added to the default-hidden
	 * set, so they don't crowd out the title column for users who never touched
	 * Screen Options.
	 */
	public function test_columns_hidden_by_default_on_edit_screen() {
		$screen = WP_Screen::get( 'edit-post' );

		$hidden = Jetpack_SEO_Admin_Columns::default_hidden_columns( array( 'comments' ), $screen );

		$this->assertContains( 'jetpack_seo_schema', $hidden );
		$this->assertContains( 'jetpack_seo_description', $hidden );
		$this->assertContains( 'jetpack_seo_search', $hidden );
		// Existing defaults are preserved.
		$this->assertContains( 'comments', $hidden );
	}

	/**
	 * Off the post-list tables (e.g. the dashboard) the filter is a no-op, so it
	 * never pollutes unrelated screens' hidden-column defaults.
	 */
	public function test_columns_untouched_off_edit_screen() {
		$screen = WP_Screen::get( 'dashboard' );

		$hidden = Jetpack_SEO_Admin_Columns::default_hidden_columns( array( 'welcome_panel' ), $screen );

		$this->assertSame( array( 'welcome_panel' ), $hidden );
	}

	/**
	 * Create an administrator and make them the current user.
	 *
	 * @return int
	 */
	private function login_admin() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		return $user_id;
	}

	/**
	 * The hidden-column set a user has saved for a screen, as core reads it.
	 *
	 * @param int    $user_id   User ID.
	 * @param string $screen_id Screen ID.
	 * @return mixed
	 */
	private function saved_hidden_columns( $user_id, $screen_id ) {
		return get_user_option( 'manage' . $screen_id . 'columnshidden', $user_id );
	}

	/**
	 * A user who customized Screen Options before the SEO columns existed never
	 * receives `default_hidden_columns`, so the backfill has to merge the columns
	 * into the set they already saved.
	 */
	public function test_backfill_hides_columns_for_users_with_saved_screen_options() {
		$user_id = $this->login_admin();
		update_user_option( $user_id, 'manageedit-postcolumnshidden', array( 'comments' ), true );

		Jetpack_SEO_Admin_Columns::backfill_hidden_columns( WP_Screen::get( 'edit-post' ) );

		$hidden = $this->saved_hidden_columns( $user_id, 'edit-post' );
		$this->assertContains( 'jetpack_seo_schema', $hidden );
		$this->assertContains( 'jetpack_seo_description', $hidden );
		$this->assertContains( 'jetpack_seo_search', $hidden );
		// The user's own choices survive.
		$this->assertContains( 'comments', $hidden );
	}

	/**
	 * Once a screen is backfilled, a user who deliberately re-enables the columns
	 * keeps them — the backfill must not run a second time and re-hide them.
	 */
	public function test_backfill_runs_only_once_per_screen() {
		$user_id = $this->login_admin();
		update_user_option( $user_id, 'manageedit-postcolumnshidden', array( 'comments' ), true );

		Jetpack_SEO_Admin_Columns::backfill_hidden_columns( WP_Screen::get( 'edit-post' ) );

		// The user turns the Schema column back on.
		update_user_option( $user_id, 'manageedit-postcolumnshidden', array( 'comments', 'jetpack_seo_description', 'jetpack_seo_search' ), true );

		Jetpack_SEO_Admin_Columns::backfill_hidden_columns( WP_Screen::get( 'edit-post' ) );

		$this->assertNotContains( 'jetpack_seo_schema', $this->saved_hidden_columns( $user_id, 'edit-post' ) );
	}

	/**
	 * Each post-list screen stores its own hidden-column set, so backfilling Posts
	 * must not mark Pages as done.
	 */
	public function test_backfill_is_tracked_per_screen() {
		$user_id = $this->login_admin();
		update_user_option( $user_id, 'manageedit-postcolumnshidden', array( 'comments' ), true );
		update_user_option( $user_id, 'manageedit-pagecolumnshidden', array( 'comments' ), true );

		Jetpack_SEO_Admin_Columns::backfill_hidden_columns( WP_Screen::get( 'edit-post' ) );

		$this->assertNotContains( 'jetpack_seo_schema', $this->saved_hidden_columns( $user_id, 'edit-page' ) );

		Jetpack_SEO_Admin_Columns::backfill_hidden_columns( WP_Screen::get( 'edit-page' ) );

		$this->assertContains( 'jetpack_seo_schema', $this->saved_hidden_columns( $user_id, 'edit-page' ) );
	}

	/**
	 * A user who never touched Screen Options is already covered by
	 * `default_hidden_columns`, so the backfill must not write a hidden-column set
	 * on their behalf — doing so would opt them out of every future default.
	 */
	public function test_backfill_leaves_untouched_screens_alone() {
		$user_id = $this->login_admin();

		Jetpack_SEO_Admin_Columns::backfill_hidden_columns( WP_Screen::get( 'edit-post' ) );

		$this->assertFalse( $this->saved_hidden_columns( $user_id, 'edit-post' ) );
	}

	/**
	 * The backfill is scoped to post-list tables and ignores everything else.
	 */
	public function test_backfill_ignores_non_edit_screens() {
		$user_id = $this->login_admin();
		update_user_option( $user_id, 'managedashboardcolumnshidden', array( 'welcome_panel' ), true );

		Jetpack_SEO_Admin_Columns::backfill_hidden_columns( WP_Screen::get( 'dashboard' ) );

		$this->assertSame( array( 'welcome_panel' ), $this->saved_hidden_columns( $user_id, 'dashboard' ) );
	}

	/**
	 * The columns register on the same post types the SEO Content tab lists, so the
	 * two never drift apart.
	 */
	public function test_columns_register_on_the_seo_supported_post_types() {
		register_post_type(
			'jetpack_seo_test_cpt',
			array(
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			)
		);

		Jetpack_SEO_Admin_Columns::register_columns_for_post_types();

		// Concrete expectations first, so this doesn't merely restate whatever the
		// helper happens to return.
		foreach ( array( 'post', 'page', 'jetpack_seo_test_cpt' ) as $post_type ) {
			$this->assertNotFalse(
				has_filter( "manage_{$post_type}_posts_columns", array( 'Jetpack_SEO_Admin_Columns', 'add_columns' ) ),
				"Expected the SEO columns to register on the {$post_type} list table."
			);
		}

		// And the full set tracks the Content tab's, so the two cannot drift apart.
		foreach ( \Automattic\Jetpack\SEO\Post_Types::get_supported_content_types() as $post_type ) {
			$this->assertNotFalse(
				has_filter( "manage_{$post_type}_posts_columns", array( 'Jetpack_SEO_Admin_Columns', 'add_columns' ) ),
				"Expected the SEO columns to register on the {$post_type} list table."
			);
		}

		$this->assertFalse(
			has_filter( 'manage_attachment_posts_columns', array( 'Jetpack_SEO_Admin_Columns', 'add_columns' ) ),
			'The media library is not an SEO content surface.'
		);

		unregister_post_type( 'jetpack_seo_test_cpt' );
	}
}
