<?php
/**
 * Tests for the Site Editor prompt on the legacy Sharing settings page.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing.php';

use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * Tests Sharing_Admin::site_editor_prompt_display().
 *
 * The URL is a contract with the Site Editor router, so this asserts the encoded
 * form rather than the parsed parameters.
 *
 * @covers \Sharing_Admin::site_editor_prompt_display
 */
#[CoversMethod( Sharing_Admin::class, 'site_editor_prompt_display' )]
class Sharing_Admin_Site_Editor_Prompt_Test extends WP_UnitTestCase {
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
	 * The prompt's primary button opens the template, not the template list.
	 */
	public function test_prompt_opens_the_active_theme_single_template() {
		$admin = new Sharing_Admin();

		ob_start();
		$admin->site_editor_prompt_display();
		$html = ob_get_clean();

		$expected = esc_url(
			admin_url( 'site-editor.php' ) . '?p=%2Fwp_template%2Ftwentytwentyfour%2F%2Fsingle&canvas=edit'
		);

		$this->assertStringContainsString( 'href="' . $expected . '"', $html );
		$this->assertStringNotContainsString( 'path=%2Fwp_template', $html );
	}
}
