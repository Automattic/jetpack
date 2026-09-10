<?php
/**
 * Tests for the Jetpack feature hints shown among plugin search results.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/plugin-search.php';

use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * Tests where the Sharing Buttons block card sends people.
 *
 * The URL is a contract with the Site Editor router, so these assert the encoded
 * form rather than the parsed parameters.
 *
 * @covers \Jetpack_Plugin_Search::get_extra_features
 * @covers \Jetpack_Plugin_Search::insert_module_related_links
 */
#[CoversMethod( Jetpack_Plugin_Search::class, 'get_extra_features' )]
#[CoversMethod( Jetpack_Plugin_Search::class, 'insert_module_related_links' )]
class Jetpack_Plugin_Search_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Pin the stylesheet, so the expected template URL does not depend on the test theme.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'stylesheet', array( $this, 'pin_stylesheet' ) );
	}

	/**
	 * Release the stylesheet filter.
	 */
	public function tear_down() {
		remove_filter( 'stylesheet', array( $this, 'pin_stylesheet' ) );

		parent::tear_down();
	}

	/**
	 * Stylesheet used in place of whichever theme the test suite activated.
	 *
	 * @return string
	 */
	public function pin_stylesheet() {
		return 'twentytwentyfour';
	}

	/**
	 * The active theme's Single template, opened for editing.
	 *
	 * @return string
	 */
	private function expected_url() {
		return admin_url( 'site-editor.php' ) . '?p=%2Fwp_template%2Ftwentytwentyfour%2F%2Fsingle&canvas=edit';
	}

	/**
	 * The card's Configure destination is the template, not the template list.
	 */
	public function test_sharing_block_configure_url_opens_the_single_template() {
		$features = ( new Jetpack_Plugin_Search() )->get_extra_features();

		$this->assertSame( $this->expected_url(), $features['sharing-block']['configure_url'] );
	}

	/**
	 * The card's "Add block" button uses the same destination.
	 */
	public function test_sharing_block_add_block_link_opens_the_single_template() {
		$links = ( new Jetpack_Plugin_Search() )->insert_module_related_links(
			array(),
			array(
				'slug'   => Jetpack_Plugin_Search::$slug,
				'module' => 'sharing-block',
			)
		);

		$this->assertStringContainsString(
			'href="' . esc_url( $this->expected_url() ) . '"',
			$links['jp_get_started']
		);
	}
}
