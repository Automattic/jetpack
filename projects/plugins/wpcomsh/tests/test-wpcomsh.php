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
		$custom_element_starts_with_pre;

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
		'<presto-player><a href="https://wp.com" rel="nofollow">https://wp.com</a></presto-player>'; // Made clickable even if it starts with `<pre`

		$this->assertEquals( $expected_output, wpcomsh_make_content_clickable( $original_content ) );
	}
}
