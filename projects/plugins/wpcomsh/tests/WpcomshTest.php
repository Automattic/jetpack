<?php
/**
 * Wpcomsh Test file.
 *
 * @package wpcomsh
 */

/**
 * Class WpcomshTest.
 */
class WpcomshTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tests wpcomsh_make_content_clickable
	 *
	 * Ensures that the wpcomsh_make_content_clickable function
	 * correctly outputs the expected content.
	 *
	 * @return void
	 */
	public function test_wpcomsh_make_content_clickable() {
		$script                         = '<script>https://wp.com</script>';
		$style                          = '<style>https://wp.com</style>';
		$a                              = '<a href="https://wp.com">https://wp.com</a>';
		$div                            = '<div>https://wp.com</div>';
		$pre                            = '<pre>https://wp.com</pre>';
		$code                           = '<code>https://wp.com</code>';
		$textarea                       = '<textarea>https://wp.com</textarea>';
		$div_skip                       = '<div class="skip-make-clickable test">https://wp.com</div>';
		$custom_element                 = '<custom-element>https://wp.com</custom-element>';
		$custom_element_starts_with_pre = '<presto-player>https://wp.com</presto-player>';
		$link_inside_tag_inside_attr    = "\n" . '<li data-test="<a href=\&quot;https://wp.com\&quot;&gt;Link</a&gt;"></li>';

		$original_content = '' .
		$script .
		$style .
		$a .
		$div .
		$pre .
		$code .
		$textarea .
		$div_skip .
		$custom_element .
		$custom_element_starts_with_pre .
		$link_inside_tag_inside_attr;

		$expected_output = '' .
		'<script>https://wp.com</script>' .
		'<style>https://wp.com</style>' .
		'<a href="https://wp.com">https://wp.com</a>' .
		'<div><a href="https://wp.com" rel="nofollow">https://wp.com</a></div>' . // Made clickable
		'<pre>https://wp.com</pre>' .
		'<code>https://wp.com</code>' .
		'<textarea>https://wp.com</textarea>' .
		'<div class="skip-make-clickable test">https://wp.com</div>' .
		'<custom-element><a href="https://wp.com" rel="nofollow">https://wp.com</a></custom-element>' . // Made clickable
		'<presto-player><a href="https://wp.com" rel="nofollow">https://wp.com</a></presto-player>' . // Made clickable even if it starts with `<pre`
		"\n" . '<li data-test="<a href=\&quot;https://wp.com\&quot;&gt;Link</a&gt;"></li>'; // Don't make clickable if it's inside a tag inside an attribute.

		$this->assertEquals( $expected_output, wpcomsh_make_content_clickable( $original_content ) );
	}

	/**
	 * Tests that JavaScript comparison operators in script tags don't break content rendering.
	 *
	 * Script tags containing < or > operators (e.g., `if (x < 10)`) would previously
	 * cause the regex split to misinterpret the < as an HTML tag start, resulting in
	 * content after the script being lost.
	 *
	 * @return void
	 */
	public function test_wpcomsh_make_content_clickable_with_js_comparison_operators() {
		$content = '<script>if (chartHeight < 500 && width > 100) { doSomething(); }</script>' .
			'<p>https://wp.com should be linkified</p>';

		$expected = '<script>if (chartHeight < 500 && width > 100) { doSomething(); }</script>' .
			'<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> should be linkified</p>';

		$this->assertEquals( $expected, wpcomsh_make_content_clickable( $content ) );
	}

	/**
	 * Tests multiple script tags with comparison operators preserve all surrounding content.
	 *
	 * @return void
	 */
	public function test_wpcomsh_make_content_clickable_with_multiple_scripts() {
		$content = '<p>https://wp.com before</p>' .
			'<script>var a = 1 < 2;</script>' .
			'<p>https://wp.com between</p>' .
			'<script>var b = 3 > 1;</script>' .
			'<p>https://wp.com after</p>';

		$expected = '<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> before</p>' .
			'<script>var a = 1 < 2;</script>' .
			'<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> between</p>' .
			'<script>var b = 3 > 1;</script>' .
			'<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> after</p>';

		$this->assertEquals( $expected, wpcomsh_make_content_clickable( $content ) );
	}

	/**
	 * Tests that URLs inside script tags with comparison operators are not linkified.
	 *
	 * @return void
	 */
	public function test_wpcomsh_make_content_clickable_with_url_in_script() {
		$content = '<script>if (count < 5) { fetch("https://wp.com/api"); }</script>' .
			'<p>https://wp.com should be linkified</p>';

		$expected = '<script>if (count < 5) { fetch("https://wp.com/api"); }</script>' .
			'<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> should be linkified</p>';

		$this->assertEquals( $expected, wpcomsh_make_content_clickable( $content ) );
	}

	/**
	 * Tests that URLs inside style tags are not linkified and content after is preserved.
	 *
	 * @return void
	 */
	public function test_wpcomsh_make_content_clickable_with_style_tag() {
		$content = '<style>.bg { background: url("https://wp.com/image.png"); }</style>' .
			'<p>https://wp.com should be linkified</p>';

		$expected = '<style>.bg { background: url("https://wp.com/image.png"); }</style>' .
			'<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> should be linkified</p>';

		$this->assertEquals( $expected, wpcomsh_make_content_clickable( $content ) );
	}

	/**
	 * Tests that a style tag containing < in CSS content doesn't break parsing.
	 *
	 * @return void
	 */
	public function test_wpcomsh_make_content_clickable_with_style_containing_angle_bracket() {
		$content = '<style>.arrow::before { content: "<"; }</style>' .
			'<p>https://wp.com should be linkified</p>';

		$expected = '<style>.arrow::before { content: "<"; }</style>' .
			'<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> should be linkified</p>';

		$this->assertEquals( $expected, wpcomsh_make_content_clickable( $content ) );
	}

	/**
	 * Tests that URLs inside textarea tags are not linkified and content after is preserved.
	 *
	 * @return void
	 */
	public function test_wpcomsh_make_content_clickable_with_textarea_tag() {
		$content = '<textarea>Visit https://wp.com for more info</textarea>' .
			'<p>https://wp.com should be linkified</p>';

		$expected = '<textarea>Visit https://wp.com for more info</textarea>' .
			'<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> should be linkified</p>';

		$this->assertEquals( $expected, wpcomsh_make_content_clickable( $content ) );
	}

	/**
	 * Tests mixed raw text elements (script, style, textarea) interspersed with linkifiable content.
	 *
	 * @return void
	 */
	public function test_wpcomsh_make_content_clickable_with_mixed_raw_text_elements() {
		$content = '<p>https://wp.com first</p>' .
			'<script>var x = 1 < 2;</script>' .
			'<p>https://wp.com second</p>' .
			'<style>.a { color: red; }</style>' .
			'<p>https://wp.com third</p>' .
			'<textarea>https://wp.com inside</textarea>' .
			'<p>https://wp.com fourth</p>';

		$expected = '<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> first</p>' .
			'<script>var x = 1 < 2;</script>' .
			'<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> second</p>' .
			'<style>.a { color: red; }</style>' .
			'<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> third</p>' .
			'<textarea>https://wp.com inside</textarea>' .
			'<p><a href="https://wp.com" rel="nofollow">https://wp.com</a> fourth</p>';

		$this->assertEquals( $expected, wpcomsh_make_content_clickable( $content ) );
	}

	/**
	 * Tests that nested divs inside skip-make-clickable don't prematurely exit protection.
	 *
	 * @return void
	 */
	public function test_wpcomsh_make_content_clickable_with_nested_divs_in_skip() {
		$content = '<div class="skip-make-clickable">' .
			'<div class="inner">https://wp.com</div>' .
			'https://wp.com' .
			'</div>' .
			'<div>https://wp.com</div>';

		$expected = '<div class="skip-make-clickable">' .
			'<div class="inner">https://wp.com</div>' .
			'https://wp.com' .
			'</div>' .
			'<div><a href="https://wp.com" rel="nofollow">https://wp.com</a></div>';

		$this->assertEquals( $expected, wpcomsh_make_content_clickable( $content ) );
	}

	/**
	 * Tests that trailing URLs after all HTML tags are linkified.
	 *
	 * @return void
	 */
	public function test_wpcomsh_make_content_clickable_trailing_url() {
		$content  = '<p>hello</p>https://wp.com trailing';
		$expected = '<p>hello</p><a href="https://wp.com" rel="nofollow">https://wp.com</a> trailing';

		$this->assertEquals( $expected, wpcomsh_make_content_clickable( $content ) );
	}

	/**
	 * Tests if Jetpack Boost plugin is active, to test the integreation setup.
	 *
	 * This is for the `jp docker phpunit-integration` command to verify it works.
	 *
	 * @return void
	 */
	public function test_is_jetpack_boost_active() {
		$plugins = getenv( 'JP_MONO_INTEGRATION_PLUGINS' );
		if ( $plugins && strpos( $plugins, 'boost' ) !== false ) {
			$this->assertTrue( is_plugin_active( 'boost/jetpack-boost.php' ) );
			return;
		}
		$this->assertFalse( is_plugin_active( 'boost/jetpack-boost.php' ) );
	}
}
