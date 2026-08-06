<?php
/**
 * Tests for Body_Close_Locator: the byte offset it reports must be the
 * document's own closing body tag, never a literal '</body>' inside content,
 * and null whenever the buffer holds no trustworthy closing tag.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Body_Close_Locator;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Class Body_Close_Locator_Test
 */
class Body_Close_Locator_Test extends BaseTestCase {

	/**
	 * The offset reported is the document's own closing tag, with a decoy
	 * '</body>' earlier in the buffer. The real closing tag is the last
	 * literal occurrence in these fixtures, so the expectation is computed
	 * with strrpos() rather than hand-counted.
	 *
	 * @param string $html Buffer with a decoy before the real closing tag.
	 * @dataProvider provide_decoy_before_real_close
	 */
	#[DataProvider( 'provide_decoy_before_real_close' )]
	public function test_reports_the_documents_own_closing_tag( $html ) {
		$this->assertSame( strrpos( $html, '</body>' ), Body_Close_Locator::find( $html ) );
	}

	/**
	 * Buffers whose decoy '</body>' precedes the document's real closing tag.
	 */
	public static function provide_decoy_before_real_close() {
		return array(
			'plain document'      => array( '<html><body><p>x</p></body></html>' ),
			'document.write'      => array( '<html><body><script>document.write("</body>")</script><p>x</p></body></html>' ),
			'textarea'            => array( '<html><body><textarea></body></textarea><p>x</p></body></html>' ),
			'title'               => array( '<html><body><title></body></title><p>x</p></body></html>' ),
			'style'               => array( '<html><body><style>/*</body>*/</style><p>x</p></body></html>' ),
			'comment'             => array( '<html><body><!-- </body> --><p>x</p></body></html>' ),
			'attribute value'     => array( '<html><body><div data-x="</body>">y</div></body></html>' ),
			'template content'    => array( '<html><body><template></body></template><p>x</p></body></html>' ),
			'noscript content'    => array( '<html><body><noscript></body></noscript><p>x</p></body></html>' ),
			'svg foreign content' => array( '<html><body><svg><desc></body></desc></svg><p>x</p></body></html>' ),
			'stray closer'        => array( '<html><body><div></body></div><p>x</p></body></html>' ),
			'self-closing svg'    => array( '<html><body><svg/><p>x</p></body></html>' ),
		);
	}

	/**
	 * A decoy in trailing output — after the document's own closing tag —
	 * must not replace the document's answer, which is the first literal
	 * occurrence in these fixtures.
	 *
	 * @param string $html Buffer with a decoy after the real closing tag.
	 * @dataProvider provide_decoy_after_real_close
	 */
	#[DataProvider( 'provide_decoy_after_real_close' )]
	public function test_trailing_decoys_do_not_replace_the_answer( $html ) {
		$this->assertSame( strpos( $html, '</body>' ), Body_Close_Locator::find( $html ) );
	}

	/**
	 * Buffers whose decoy '</body>' follows the document's real closing tag.
	 */
	public static function provide_decoy_after_real_close() {
		return array(
			'trailing comment'      => array( '<html><body><p>x</p></body></html><!-- </body> -->' ),
			'trailing script'       => array( '<html><body><p>x</p></body></html><script>var s="</body>";</script>' ),
			'svg in trailing slot'  => array( '<html><body><p>x</p></body><svg><desc></body></desc></svg></html>' ),
			'unterminated textarea' => array( '<html><body><p>x</p></body></html><textarea>pasted </body>' ),
			'unterminated comment'  => array( '<html><body><p>x</p></body></html><!-- pasted </body>' ),
		);
	}

	/**
	 * Closing tag spellings a browser accepts beyond the literal lowercase
	 * '</body>'.
	 *
	 * @param string $html     Buffer.
	 * @param string $closer   The closing tag's spelling in the buffer.
	 * @dataProvider provide_closing_tag_spellings
	 */
	#[DataProvider( 'provide_closing_tag_spellings' )]
	public function test_accepts_the_spellings_a_browser_accepts( $html, $closer ) {
		$this->assertSame( strpos( $html, $closer ), Body_Close_Locator::find( $html ) );
	}

	/**
	 * Closing body tag spellings.
	 */
	public static function provide_closing_tag_spellings() {
		return array(
			'uppercase'  => array( '<html><body><p>x</p></BODY></html>', '</BODY>' ),
			'whitespace' => array( "<html><body><p>x</p></body\n></html>", "</body\n>" ),
			'attribute'  => array( '<html><body><p>x</p></body data-x="y"></html>', '</body' ),
		);
	}

	/**
	 * Buffers with no trustworthy closing tag report null, which makes the
	 * caller append at the end instead of rewriting content.
	 *
	 * @param string $html Buffer without a real closing body tag.
	 * @dataProvider provide_buffers_without_a_closing_tag
	 */
	#[DataProvider( 'provide_buffers_without_a_closing_tag' )]
	public function test_reports_null_without_a_trustworthy_closing_tag( $html ) {
		$this->assertNull( Body_Close_Locator::find( $html ) );
	}

	/**
	 * Buffers whose only '</body>' bytes, if any, are content.
	 */
	public static function provide_buffers_without_a_closing_tag() {
		return array(
			'empty buffer'          => array( '' ),
			'fragment'              => array( '<p>x</p>' ),
			'inside comment only'   => array( '<p>x</p><!-- </body> -->' ),
			'unterminated textarea' => array( '<html><body><textarea>pasted </body>' ),
			'unterminated comment'  => array( '<html><body><!-- pasted </body>' ),
			'inside template only'  => array( '<html><body><template></body></template>' ),
		);
	}
}
