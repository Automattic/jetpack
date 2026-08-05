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
}
