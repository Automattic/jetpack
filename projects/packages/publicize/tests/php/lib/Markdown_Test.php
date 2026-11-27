<?php
/**
 * HTML to Markdown tests.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Lib;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Publicize\Lib\Markdown
 */
#[CoversClass( Markdown::class )]
class Markdown_Test extends BaseTestCase {

	/**
	 * Converts HTML to Markdown.
	 *
	 * @dataProvider provide_html
	 *
	 * @param string $html     The HTML.
	 * @param string $expected The expected Markdown.
	 */
	#[DataProvider( 'provide_html' )]
	public function test_from_html( $html, $expected ) {
		$this->assertSame( $expected, Markdown::from_html( $html ) );
	}

	/**
	 * HTML and the expected Markdown.
	 *
	 * @return array[]
	 */
	public static function provide_html() {
		return array(
			'paragraphs'            => array( "<p>One</p>\n<p>Two</p>", "One\n\nTwo" ),
			'whitespace'            => array( "<p>  One\n   two  </p>", 'One two' ),
			'headings'              => array( '<h2>Title</h2><p>Text</p>', "## Title\n\nText" ),
			'emphasis'              => array( '<p>A <strong>bold</strong> and <em>soft</em> word</p>', 'A **bold** and *soft* word' ),
			'emphasis whitespace'   => array( '<p>A<strong> bold </strong>word</p>', 'A **bold** word' ),
			'empty emphasis'        => array( '<p>A<strong> </strong>B</p>', 'A B' ),
			'link'                  => array( '<p><a href="https://example.com/">Example</a></p>', '[Example](https://example.com/)' ),
			'link with parentheses' => array( '<a href="https://example.com/a_(b)">x</a>', '[x](<https://example.com/a_(b)>)' ),
			'link without text'     => array( '<a href="https://example.com/"></a>', '[https://example.com/](https://example.com/)' ),
			'anchor link'           => array( '<a href="#top">Top</a>', 'Top' ),
			'image'                 => array( '<img src="https://example.com/a.png" alt="A [b]">', '![A \[b\]](https://example.com/a.png)' ),
			'linked image'          => array( '<a href="https://example.com/"><img src="https://example.com/a.png" alt="A"></a>', '[![A](https://example.com/a.png)](https://example.com/)' ),
			'unordered list'        => array( '<ul><li>One</li><li>Two</li></ul>', "- One\n- Two" ),
			'ordered list'          => array( '<ol start="3"><li>Three</li><li>Four</li></ol>', "3. Three\n4. Four" ),
			'nested list'           => array( '<ul><li>One<ul><li>Sub</li></ul></li><li>Two</li></ul>', "- One\n  - Sub\n- Two" ),
			'list after paragraph'  => array( '<p>Intro</p><ul><li>One</li></ul>', "Intro\n\n- One" ),
			'blockquote'            => array( '<blockquote><p>One</p><p>Two</p></blockquote>', "> One\n>\n> Two" ),
			'code block'            => array( "<pre><code>a  *b*\n  c</code></pre>", "```\na  *b*\n  c\n```" ),
			'code block backticks'  => array( '<pre>```</pre>', "````\n```\n````" ),
			'inline code'           => array( '<p>Use <code>a_b*</code> here</p>', 'Use `a_b*` here' ),
			'inline code backtick'  => array( '<code>a`b</code>', '``a`b``' ),
			'line break'            => array( '<p>One<br>Two</p>', "One\\\nTwo" ),
			'trailing line break'   => array( '<p>One<br></p><p>Two</p>', "One\n\nTwo" ),
			'line break in pre'     => array( '<pre class="wp-block-preformatted">One<br>Two</pre>', "```\nOne\nTwo\n```" ),
			'line break in code'    => array( '<code>One<br>Two</code>', '`One Two`' ),
			'line break in heading' => array( '<h2>One<br>Two</h2>', '## One Two' ),
			'line break in link'    => array( '<a href="https://example.com/">One<br>Two</a>', '[One Two](https://example.com/)' ),
			'line break ending li'  => array( '<ul><li>One<br></li><li>Two</li></ul>', "- One\n- Two" ),
			'line break ending bq'  => array( '<blockquote>One<br></blockquote>', '> One' ),
			'line break at the end' => array( 'One<br>', 'One' ),
			'horizontal rule'       => array( '<p>One</p><hr><p>Two</p>', "One\n\n---\n\nTwo" ),
			'entities'              => array( '<p>Caf&eacute; &amp; &#8220;Bar&#8221;</p>', "Caf\u{00E9} & \u{201C}Bar\u{201D}" ),
			'escaping'              => array( '<p>a_b *c* [d] &lt;e&gt; `f` \\g</p>', 'a\\_b \\*c\\* \\[d\\] \\<e> \\`f\\` \\\\g' ),
			'escaping line start'   => array( '<p># No heading</p><p>- No list</p><p>1. No list</p>', "\\# No heading\n\n\\- No list\n\n1\\. No list" ),
			'escaping block marks'  => array( '<p>&gt;quote</p><p>~~~</p><p>---</p><p>One<br>===</p>', "\\>quote\n\n\\~~~\n\n\\---\n\nOne\\\n\\===" ),
			'escaping references'   => array( '<p>Write &amp;copy; or &amp;#169;, not &amp;</p>', 'Write \\&copy; or \\&#169;, not &' ),
			'escaping heading runs' => array( '<p>## Two</p><p>###### Six</p>', "\\## Two\n\n\\###### Six" ),
			'heading closing hash'  => array( '<h2>Issue #</h2><h2>C#</h2>', "## Issue \\#\n\n## C#" ),
			'unsafe link'           => array( '<a href="javascript:alert(1)">me</a>', 'me' ),
			'unsafe image'          => array( '<p>A<img src="javascript:alert(1)" alt="x"></p>', 'A' ),
			'invalid list start'    => array( '<ol start="-2"><li>x</li></ol><p>-</p><ol start="1e3"><li>y</li></ol>', "1. x\n\n\\-\n\n1. y" ),
			'no escaping mid line'  => array( '<p>Hash # and 1. here</p>', 'Hash # and 1. here' ),
			'script and style'      => array( '<p>A</p><script>alert(1)</script><style>p{}</style>', 'A' ),
			'unknown elements'      => array( '<p><span class="x">A</span> <mark>B</mark></p>', 'A B' ),
			'block editor markup'   => array( "<figure class=\"wp-block-image\"><img src=\"https://example.com/a.png\" alt=\"\"/><figcaption>Caption</figcaption></figure>\n\n<div class=\"wp-block-group\"><p>Text</p></div>", "![](https://example.com/a.png)\n\nCaption\n\nText" ),
			'unclosed elements'     => array( '<p>One<p>Two <strong>bold', "One\n\nTwo **bold**" ),
		);
	}
}
