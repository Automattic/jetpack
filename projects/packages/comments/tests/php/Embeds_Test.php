<?php
/**
 * Tests for Embeds.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Comments\Embeds
 */
#[CoversClass( Embeds::class )]
class Embeds_Test extends BaseTestCase {

	/**
	 * @dataProvider provide_sanitize_html
	 */
	#[DataProvider( 'provide_sanitize_html' )]
	public function test_sanitize_html( $html, $expected ) {
		$this->assertSame( $expected, Embeds::sanitize_html( $html ) );
	}

	/**
	 * @dataProvider provide_trusted_url
	 */
	#[DataProvider( 'provide_trusted_url' )]
	public function test_trusted_url( $handled, $expected ) {
		add_filter( 'jetpack_comments_embed_handled', fn() => $handled );

		$this->assertSame( $expected ? 'https://github.com/Automattic/jetpack/pull/1' : false, Embeds::trusted_url( 'https://github.com/Automattic/jetpack/pull/1' ) );

		remove_all_filters( 'jetpack_comments_embed_handled' );
	}

	public static function provide_trusted_url() {
		return array(
			'untrusted without a host' => array( false, false ),
			'trusted by a host'        => array( true, true ),
		);
	}

	public function test_block_renders_host_data_as_card_without_request() {
		add_filter( 'jetpack_comments_embed_handled', '__return_true' );
		add_filter(
			'jetpack_comments_pre_embed_data',
			fn() => (object) array(
				'provider_name' => 'GitHub',
				'title'         => 'Fix the thing',
				'author_name'   => 'someone',
				'html'          => '',
			)
		);
		add_filter(
			'pre_http_request',
			function () {
				$this->fail( 'A host-handled URL must not make an HTTP request.' );
			}
		);

		$block = Embeds::block( array( 'attrs' => array( 'url' => 'https://github.com/Automattic/jetpack/pull/1' ) ), true );

		$this->assertStringContainsString( 'Fix the thing', $block['innerHTML'] );
		$this->assertStringContainsString( 'View on GitHub', $block['innerHTML'] );
		$this->assertStringContainsString( 'href="https://github.com/Automattic/jetpack/pull/1"', $block['innerHTML'] );

		remove_all_filters( 'jetpack_comments_embed_handled' );
		remove_all_filters( 'jetpack_comments_pre_embed_data' );
		remove_all_filters( 'pre_http_request' );
	}

	public function test_block_falls_back_to_link_when_host_has_no_data() {
		add_filter( 'jetpack_comments_embed_handled', '__return_true' );
		add_filter( 'jetpack_comments_pre_embed_data', fn() => '' );

		$block = Embeds::block( array( 'attrs' => array( 'url' => 'https://github.com/Automattic/jetpack/pull/1' ) ), true );

		$this->assertStringContainsString( '<a href="https://github.com/Automattic/jetpack/pull/1"', $block['innerHTML'] );
		$this->assertStringNotContainsString( 'View on', $block['innerHTML'] );

		remove_all_filters( 'jetpack_comments_embed_handled' );
		remove_all_filters( 'jetpack_comments_pre_embed_data' );
	}

	public static function provide_sanitize_html() {
		return array(
			'iframe keeps listed attributes' => array( '<iframe src="https://a.test/v" width="10" onload="x()" style="a"></iframe>', '<iframe src="https://a.test/v" width="10"></iframe>' ),
			'protocol-relative src'          => array( '<img src="//a.test/i.png" alt="a">', '<img alt="a" src="https://a.test/i.png">' ),
			'script is dropped'              => array( '<script src="https://a.test/s.js"></script>', '' ), // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
			'javascript src is dropped'      => array( '<iframe src="javascript:alert(1)"></iframe>', '' ),
			'not a string'                   => array( null, '' ),
		);
	}
}
