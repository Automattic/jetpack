<?php
require dirname( __FILE__ ) . '/../../../../modules/markdown.php';

class WP_Test_Markdown extends WP_UnitTestCase {
	
	private function add_test_gutenberg_markdown_post() {

		$post_content = <<<PC
<!-- wp:html -->
<div>
    This is an HTML block
</div>
<p>
    # Markdown in an HTML block should not render.
</p>
# Markdown in an HTML block should not render.
<!-- /wp:html -->

<!-- wp:jetpack/markdown-block -->
<textarea class="wp-block-jetpack-markdown-block"># Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

**double asterisks**

__double underscores__

&lt;div>
__double underscores__ inside of HTML tags should not render.
&lt;/div>
</textarea>
<!-- /wp:jetpack/markdown-block -->

<p>This is a Classic block</p>

<!-- wp:code -->
<pre class="wp-block-code"><code>&lt;p>testing p tags&lt;/p></code></pre>
<!-- /wp:code -->
PC;

		$post_id = $this->factory->post->create(
			array(
				'post_content' => $post_content,
				'post_title' => 'Test Gutenberg Post',
			)
		);

		return $post_id;
	}

	/**
	 * @return string
	 */
	private function get_converted_gutenberg_markdown_post() {
		$post_content = <<<PC
<!-- wp:html -->
<div>
    This is an HTML block
</div>

    # Markdown in an HTML block should not render.

# Markdown in an HTML block should not render.
<!-- /wp:html -->

<!-- wp:jetpack/markdown-block -->

<h1>Header 1</h1>

<h2>Header 2</h2>

<h3>Header 3</h3>

<h4>Header 4</h4>

<h5>Header 5</h5>

<h6>Header 6</h6>

<strong>double asterisks</strong>

<strong>double underscores</strong>

<div>
__double underscores__ inside of HTML tags should not render.
</div>

<!-- /wp:jetpack/markdown-block -->

This is a Classic block
PC;

		return $post_content;

	}

	private function get_gutenberg_non_markdown_post() {

		$post_content = <<<PC
<!-- wp:html -->
<div>
    This is an HTML block
</div>
<p>
    # Markdown in an HTML block should not render.
</p>
# Markdown in an HTML block should not render.
<!-- /wp:html -->

<p>This is a Classic block</p>

<!-- wp:code -->
<pre class="wp-block-code"><code>&lt;p>testing p tags&lt;/p></code></pre>
<!-- /wp:code -->
PC;

		return $post_content;
	}

	private function add_test_gutenberg_non_markdown_post() {

		$post_id = $this->factory->post->create(
			array(
				'post_content' => $this->get_gutenberg_non_markdown_post(),
				'post_title' => 'Test Gutenberg Non Markdown Post',
			)
		);

		return $post_id;
	}

	/**
	 * Setup environment for Markdown Tests.
	 *
	 * @since 4.4.0
	 */
	public function setUp() {

		parent::setUp();

		update_option( 'wpcom_publish_posts_with_markdown', true );
	}

	/**
	 * Test if _wpcom_is_markdown postmeta is set as true
	 * after a Gutenberg insert containing Markdown blocks.
	 *
	 * @since 4.6.0
	 */
	public function test_if_gutenberg_markdown_sets_wpcom_is_markdown_meta_as_true() {
		$post_id = $this->add_test_gutenberg_post();
		$this->assertEquals( WPCom_Markdown::get_instance()->is_markdown($post_id), true );
	}

	/**
	 * Test if _wpcom_is_markdown postmeta is false or non-existent
	 * after a Gutenberg insert of non-Markdown blocks.
	 *
	 * @since 4.6.0
	 */
	public function test_if_gutenberg_non_markdown_sets_wpcom_is_markdown_meta_as_false() {
		$post_id = $this->add_test_gutenberg_non_markdown_post();
		$this->assertEquals( WPCom_Markdown::get_instance()->is_markdown($post_id), false );
	}

	/**
	 * Test if Markdown blocks from Gutenberg are rendered and saved correctly.
	 *
	 * @since 4.6.0
	 */
	public function test_gutenberg_markdown_saved_correctly() {
		$post_id = $this->add_test_gutenberg_markdown_post();
		$post = get_post( $post_id );
		$this->assertEquals(
			$this->get_converted_gutenberg_markdown_post(),
			$post->post_content
		);
	}

	/**
	 * Test if non-Markdown blocks from Gutenberg are rendered and saved correctly.
	 *
	 * @since 4.6.0
	 */
	public function test_gutenberg_non_markdown_saved_correctly() {
		$post_id = $this->add_test_gutenberg_non_markdown_post();
		$post = get_post( $post_id );
		$this->assertEquals(
			$this->get_gutenberg_non_markdown_post(),
			$post->post_content
		);
	}

}
