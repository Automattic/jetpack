<?php
/**
 * Tests for the Jetpack SEO Llms_Txt generator.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Llms_Txt
 */
#[CoversClass( Llms_Txt::class )]
class LlmsTxtTest extends TestCase {

	/**
	 * Reset the enable option before each test.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		delete_option( Llms_Txt::OPTION );
	}

	/**
	 * `is_enabled()` reflects the stored option.
	 *
	 * @return void
	 */
	public function test_is_enabled_reflects_option() {
		$this->assertFalse( Llms_Txt::is_enabled() );
		update_option( Llms_Txt::OPTION, true );
		$this->assertTrue( Llms_Txt::is_enabled() );
	}

	/**
	 * The document starts with the site title as an H1.
	 *
	 * @return void
	 */
	public function test_generate_starts_with_site_title_heading() {
		update_option( 'blogname', 'Angela Test Site' );
		$this->assertStringStartsWith( '# Angela Test Site', Llms_Txt::generate() );
	}

	/**
	 * The tagline is rendered as a Markdown blockquote when set.
	 *
	 * @return void
	 */
	public function test_generate_includes_tagline_as_blockquote() {
		update_option( 'blogname', 'Site' );
		update_option( 'blogdescription', 'Just another test site' );
		$this->assertStringContainsString( '> Just another test site', Llms_Txt::generate() );
	}

	/**
	 * With no published content, the Pages/Posts sections are omitted (only the
	 * site-identity heading remains). The populated-list path is exercised by the
	 * live front-end test — the package test environment can't query inserted
	 * posts, the same reason {@see SchemaBuilderTest} builds posts directly.
	 *
	 * @return void
	 */
	public function test_generate_omits_sections_when_no_content() {
		update_option( 'blogname', 'Empty Site' );

		$output = Llms_Txt::generate();

		$this->assertStringContainsString( '# Empty Site', $output );
		$this->assertStringNotContainsString( '## Pages', $output );
		$this->assertStringNotContainsString( '## Posts', $output );
	}

	/**
	 * With no static file shadowing the route and no host override, WordPress can
	 * serve /llms.txt.
	 *
	 * @return void
	 */
	public function test_can_serve_true_by_default() {
		$this->assertTrue( Llms_Txt::can_serve() );
	}

	/**
	 * A host (or the static-file auto-detection) can force the honest
	 * "can't take effect" state via the filter.
	 *
	 * @return void
	 */
	public function test_can_serve_respects_filter() {
		add_filter( 'jetpack_seo_llms_txt_can_serve', '__return_false' );
		$this->assertFalse( Llms_Txt::can_serve() );
		remove_filter( 'jetpack_seo_llms_txt_can_serve', '__return_false' );

		$this->assertTrue( Llms_Txt::can_serve() );
	}
}
