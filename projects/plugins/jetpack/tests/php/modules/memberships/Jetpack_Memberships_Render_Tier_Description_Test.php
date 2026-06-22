<?php
/**
 * Tests for Jetpack_Memberships::render_tier_description_html().
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';

/**
 * @covers Jetpack_Memberships
 */
#[CoversClass( Jetpack_Memberships::class )]
class Jetpack_Memberships_Render_Tier_Description_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * An empty (or whitespace-only) description renders to an empty string.
	 *
	 * @return void
	 */
	public function test_empty_description_renders_empty_string() {
		$this->assertSame( '', Jetpack_Memberships::render_tier_description_html( '' ) );
		$this->assertSame( '', Jetpack_Memberships::render_tier_description_html( '   ' ) );
	}

	/**
	 * A non-scalar value (e.g. a malformed stored option) renders to an empty
	 * string rather than emitting a warning or fatally failing on the cast.
	 *
	 * @return void
	 */
	public function test_non_scalar_description_renders_empty_string() {
		$this->assertSame( '', Jetpack_Memberships::render_tier_description_html( array( 'unexpected' ) ) );
		$this->assertSame( '', Jetpack_Memberships::render_tier_description_html( (object) array( 'a' => 'b' ) ) );
		$this->assertSame( '', Jetpack_Memberships::render_tier_description_html( null ) );
	}

	/**
	 * Basic markdown (bold/italic) is converted to HTML.
	 *
	 * @return void
	 */
	public function test_renders_inline_markdown() {
		$html = Jetpack_Memberships::render_tier_description_html( 'Hello **world** and _everyone_' );

		$this->assertStringContainsString( '<strong>world</strong>', $html );
		$this->assertStringContainsString( '<em>everyone</em>', $html );
	}

	/**
	 * Markdown lists render to list markup.
	 *
	 * @return void
	 */
	public function test_renders_list_markup() {
		$html = Jetpack_Memberships::render_tier_description_html( "Includes:\n\n- One\n- Two" );

		$this->assertStringContainsString( '<ul>', $html );
		$this->assertStringContainsString( '<li>One</li>', $html );
		$this->assertStringContainsString( '<li>Two</li>', $html );
	}

	/**
	 * Links open in a new tab (descriptions render inside the subscribe modal's
	 * iframe).
	 *
	 * @return void
	 */
	public function test_links_open_in_new_tab() {
		$html = Jetpack_Memberships::render_tier_description_html( '[Learn more](https://example.com)' );

		$this->assertStringContainsString( 'href="https://example.com"', $html );
		$this->assertStringContainsString( 'target="_blank"', $html );
	}

	/**
	 * Disallowed markup is stripped by the kses allowlist.
	 *
	 * @return void
	 */
	public function test_strips_unsafe_markup() {
		$html = Jetpack_Memberships::render_tier_description_html( "Safe **text**\n\n<script>alert(1)</script>" );

		$this->assertStringContainsString( '<strong>text</strong>', $html );
		$this->assertStringNotContainsString( '<script>', $html );
	}
}
