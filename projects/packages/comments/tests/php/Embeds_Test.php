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
	}

	public static function provide_trusted_url() {
		return array(
			'untrusted without a host' => array( false, false ),
			'trusted by a host'        => array( true, true ),
		);
	}

	/**
	 * @dataProvider provide_block_with_host_data
	 */
	#[DataProvider( 'provide_block_with_host_data' )]
	public function test_block_with_host_data( $data, $contains, $not_contains ) {
		add_filter( 'jetpack_comments_embed_handled', '__return_true' );
		add_filter( 'jetpack_comments_pre_embed_data', fn() => $data );
		add_filter(
			'pre_http_request',
			function () {
				$this->fail( 'A host-handled URL must not make an HTTP request.' );
			}
		);

		$html = Embeds::block( array( 'attrs' => array( 'url' => 'https://github.com/Automattic/jetpack/pull/1' ) ), true )['innerHTML'] ?? '';

		foreach ( $contains as $text ) {
			$this->assertStringContainsString( $text, $html );
		}

		foreach ( $not_contains as $text ) {
			$this->assertStringNotContainsString( $text, $html );
		}
	}

	public static function provide_block_with_host_data() {
		return array(
			'host data renders a card'     => array(
				(object) array(
					'provider_name' => 'GitHub',
					'title'         => 'Fix the thing',
					'author_name'   => 'someone',
					'html'          => '',
				),
				array( 'Fix the thing', 'View on GitHub', 'href="https://github.com/Automattic/jetpack/pull/1"' ),
				array(),
			),
			'no host data leaves the link' => array(
				'',
				array( '<a href="https://github.com/Automattic/jetpack/pull/1"' ),
				array( 'View on' ),
			),
		);
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
